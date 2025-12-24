import cron from "node-cron";
import { Octokit } from "@octokit/rest";
import mongoose from "mongoose";
import fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";
import archiver from "archiver";
import logger from "../config/logger";

const execAsync = promisify(exec);

class BackupService {
  private backupDir = "/tmp/backups";
  private maxBackups = 2;
  private octokit: Octokit | null = null;
  private githubOwner: string = "";
  private githubRepo: string = "";

  constructor() {
    this.initializeGitHub();
  }

  private initializeGitHub() {
    try {
      const githubToken = process.env.GITHUB_BACKUP_TOKEN;
      const githubRepoPath = process.env.GITHUB_BACKUP_REPO;

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
      await execAsync(`mkdir -p ${backupPath}`);

      // Check database connection
      if (!mongoose.connection.db) {
        throw new Error("Database connection not established");
      }

      // Export all collections using Mongoose
      logger.info("📦 Exporting database collections...");
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();

      for (const collectionInfo of collections) {
        const collectionName = collectionInfo.name;
        logger.info(`  - Exporting collection: ${collectionName}`);

        const collection = db.collection(collectionName);
        const documents = await collection.find({}).toArray();

        // Write collection to JSON file
        const filePath = `${backupPath}/${collectionName}.json`;
        fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
      }

      // Create metadata file
      const metadata = {
        backupDate: new Date().toISOString(),
        databaseName: mongoose.connection.name,
        collections: collections.map((c) => c.name),
        totalCollections: collections.length,
      };
      fs.writeFileSync(
        `${backupPath}/metadata.json`,
        JSON.stringify(metadata, null, 2)
      );

      logger.info("🗜️  Creating zip archive...");
      await this.createZipArchive(backupPath, zipPath);

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

  private async createZipArchive(
    sourceDir: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Maximum compression
      });

      output.on("close", () => {
        resolve();
      });

      archive.on("error", (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  private async uploadToGitHub(filePath: string, fileName: string) {
    try {
      logger.info(`☁️  Uploading to GitHub: ${fileName}`);

      const content = fs.readFileSync(filePath, { encoding: "base64" });

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

      await this.octokit!.repos.createOrUpdateFileContents({
        owner: this.githubOwner,
        repo: this.githubRepo,
        path: fileName,
        message: `Database backup: ${fileName}`,
        content,
        sha,
      });

      logger.info(`✅ Uploaded to GitHub: ${fileName}`);

      await this.cleanupOldGitHubBackups();
    } catch (error) {
      logger.error(`❌ Failed to upload to GitHub: ${error}`);
      throw error;
    }
  }

  private async cleanupOldGitHubBackups() {
    try {
      const { data } = await this.octokit!.repos.getContent({
        owner: this.githubOwner,
        repo: this.githubRepo,
        path: "",
      });

      if (!Array.isArray(data)) return;

      const backupFiles = data
        .filter(
          (file) => file.name.startsWith("cmho-") && file.name.endsWith(".zip")
        )
        .sort((a, b) => b.name.localeCompare(a.name));

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

    cron.schedule("0 2 * * *", async () => {
      logger.info("⏰ Scheduled backup triggered");
      try {
        await this.performBackup();
      } catch (error) {
        logger.error(`❌ Scheduled backup failed: ${error}`);
      }
    });

    logger.info("✅ Backup scheduler started (runs daily at 2:00 AM UTC)");

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

  async triggerManualBackup() {
    logger.info("🔧 Manual backup triggered");
    return await this.performBackup();
  }

  async listAvailableBackups() {
    if (!this.octokit) {
      return [];
    }

    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.githubOwner,
        repo: this.githubRepo,
        path: "",
      });

      if (!Array.isArray(data)) return [];

      const backupFiles = data
        .filter(
          (file) => file.name.startsWith("cmho-") && file.name.endsWith(".zip")
        )
        .sort((a, b) => b.name.localeCompare(a.name))
        .map((file) => ({
          name: file.name,
          size: file.size,
          sizeMB: (file.size / (1024 * 1024)).toFixed(2),
          downloadUrl: file.download_url,
          htmlUrl: file.html_url,
          sha: file.sha,
        }));

      return backupFiles;
    } catch (error) {
      logger.error(`❌ Failed to list backups: ${error}`);
      return [];
    }
  }
}

export default new BackupService();
