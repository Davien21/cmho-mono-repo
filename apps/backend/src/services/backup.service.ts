import cron from "node-cron";
import { exec } from "child_process";
import { promisify } from "util";
import { Octokit } from "@octokit/rest";
import fs from "fs";
import logger from "../config/logger";
import { env } from "../config/env";

const execAsync = promisify(exec);

class BackupService {
  private backupDir = "/tmp/backups";
  private maxBackups = 2; // Keep only 2 backups
  private octokit: Octokit | null = null;
  private githubOwner: string = "";
  private githubRepo: string = "";

  constructor() {
    this.initializeGitHub();
  }

  private initializeGitHub() {
    try {
      const githubToken = process.env.GITHUB_BACKUP_TOKEN;
      const githubRepoPath = process.env.GITHUB_BACKUP_REPO; // Format: "owner/repo"

      if (!githubToken || !githubRepoPath) {
        logger.error(
          "❌ GitHub backup not configured (missing GITHUB_BACKUP_TOKEN or GITHUB_BACKUP_REPO)"
        );
        logger.info(
          "ℹ️  Backups will not run. Set ENABLE_BACKUPS=true and configure GitHub credentials."
        );
        return;
      }

      const [owner, repo] = githubRepoPath.split("/");
      this.githubOwner = owner;
      this.githubRepo = repo;

      this.octokit = new Octokit({ auth: githubToken });

      logger.info(`✅ GitHub backup configured: ${githubRepoPath}`);
    } catch (error) {
      logger.error(`❌ Failed to initialize GitHub backup: ${error}`);
      this.octokit = null;
    }
  }

  async performBackup() {
    if (!this.octokit) {
      const error = "GitHub backup not configured. Cannot perform backup.";
      logger.error(`❌ ${error}`);
      throw new Error(error);
    }

    try {
      const date = new Date().toISOString().split("T")[0];
      const backupName = `cmho-${date}`;
      const backupPath = `${this.backupDir}/${backupName}`;
      const zipPath = `${this.backupDir}/${backupName}.zip`;

      logger.info(`🔄 Starting backup: ${backupName}`);

      // Create backup directory
      await execAsync(`mkdir -p ${this.backupDir}`);

      // Run mongodump
      logger.info("📦 Running mongodump...");
      await execAsync(
        `mongodump --uri="${env.DATABASE_URL}" --out="${backupPath}" --gzip`
      );

      // Create zip
      logger.info("🗜️  Creating zip archive...");
      await execAsync(
        `cd ${this.backupDir} && zip -r ${backupName}.zip ${backupName}`
      );

      // Cleanup uncompressed backup
      await execAsync(`rm -rf ${backupPath}`);

      // Get file size
      const stats = fs.statSync(zipPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      logger.info(`✅ Backup created: ${backupName}.zip (${fileSizeMB} MB)`);

      // Check file size for GitHub (100MB limit)
      if (stats.size > 100 * 1024 * 1024) {
        logger.error(
          `❌ Backup too large for GitHub (${fileSizeMB} MB > 100 MB)`
        );
        logger.error("💡 Database backup exceeds GitHub's 100MB file limit");
        // Cleanup the too-large backup
        await execAsync(`rm -f ${zipPath}`);
        throw new Error(`Backup file too large: ${fileSizeMB} MB`);
      }

      // Upload to GitHub
      await this.uploadToGitHub(zipPath, `${backupName}.zip`);

      // Delete local backup after successful upload
      await execAsync(`rm -f ${zipPath}`);
      logger.info("🗑️  Local backup deleted after GitHub upload");

      return {
        success: true,
        backup: `${backupName}.zip`,
        sizeMB: fileSizeMB,
        storage: "github",
      };
    } catch (error) {
      logger.error(`❌ Backup failed: ${error}`);
      throw error;
    }
  }

  private async uploadToGitHub(filePath: string, fileName: string) {
    try {
      logger.info(`☁️  Uploading to GitHub: ${fileName}`);

      // Read file as base64
      const content = fs.readFileSync(filePath, { encoding: "base64" });

      // Check if file already exists
      let sha: string | undefined;
      try {
        const { data } = await this.octokit!.repos.getContent({
          owner: this.githubOwner,
          repo: this.githubRepo,
          path: fileName,
        });

        if ("sha" in data) {
          sha = data.sha;
          logger.info(`📝 Updating existing file: ${fileName}`);
        }
      } catch (error: any) {
        if (error.status !== 404) throw error;
        logger.info(`📝 Creating new file: ${fileName}`);
      }

      // Upload/update file
      await this.octokit!.repos.createOrUpdateFileContents({
        owner: this.githubOwner,
        repo: this.githubRepo,
        path: fileName,
        message: `Database backup: ${fileName}`,
        content,
        sha,
      });

      logger.info(`✅ Uploaded to GitHub: ${fileName}`);

      // Cleanup old backups
      await this.cleanupOldGitHubBackups();
    } catch (error) {
      logger.error(`❌ Failed to upload to GitHub: ${error}`);
      throw error;
    }
  }

  private async cleanupOldGitHubBackups() {
    try {
      // List all files in the repo
      const { data } = await this.octokit!.repos.getContent({
        owner: this.githubOwner,
        repo: this.githubRepo,
        path: "",
      });

      if (!Array.isArray(data)) return;

      // Filter backup files and sort by name (which includes date)
      const backupFiles = data
        .filter(
          (file) => file.name.startsWith("cmho-") && file.name.endsWith(".zip")
        )
        .sort((a, b) => b.name.localeCompare(a.name)); // Newest first

      // Delete old backups (keep only maxBackups)
      if (backupFiles.length > this.maxBackups) {
        const filesToDelete = backupFiles.slice(this.maxBackups);

        for (const file of filesToDelete) {
          await this.octokit!.repos.deleteFile({
            owner: this.githubOwner,
            repo: this.githubRepo,
            path: file.name,
            message: `Cleanup old backup: ${file.name}`,
            sha: file.sha,
          });

          logger.info(`🗑️  Deleted old GitHub backup: ${file.name}`);
        }
      }
    } catch (error) {
      logger.error(`❌ Failed to cleanup old GitHub backups: ${error}`);
    }
  }

  startScheduledBackups() {
    if (!this.octokit) {
      logger.info("⚠️  Backup scheduler not started - GitHub not configured");
      return;
    }

    // Run daily at 2:00 AM UTC
    cron.schedule("0 2 * * *", async () => {
      logger.info("⏰ Scheduled backup triggered");
      try {
        await this.performBackup();
      } catch (error) {
        logger.error(`❌ Scheduled backup failed: ${error}`);
      }
    });

    logger.info("✅ Backup scheduler started (runs daily at 2:00 AM UTC)");

    // Optional: Run backup on startup (for testing)
    if (process.env.BACKUP_ON_STARTUP === "true") {
      logger.info("🚀 Running initial backup on startup...");
      setTimeout(
        () =>
          this.performBackup().catch((err) =>
            logger.error(`Startup backup failed: ${err}`)
          ),
        5000
      );
    }
  }

  // Manual backup trigger
  async triggerManualBackup() {
    logger.info("🔧 Manual backup triggered");
    return await this.performBackup();
  }
}

export default new BackupService();
