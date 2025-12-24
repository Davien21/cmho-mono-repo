import { Router } from "express";
import backupService from "../../services/backup.service";
import logger from "../../config/logger";

const router = Router();

// Manual backup trigger
// TODO: Add authentication middleware to protect this endpoint
router.post("/backups/trigger", async (_req, res) => {
  try {
    // Add your auth check here
    // Example: if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

    logger.info("Manual backup triggered via API");
    const result = await backupService.triggerManualBackup();

    res.json({
      success: true,
      message: "Backup completed successfully",
      data: result,
    });
  } catch (error: any) {
    logger.error(`Manual backup failed: ${error.message || error}`);
    res.status(500).json({
      success: false,
      error: "Backup failed",
      message: error.message,
    });
  }
});

// Health check endpoint with available backups
router.get("/backups/status", async (_req, res) => {
  try {
    const isConfigured = !!(
      process.env.GITHUB_BACKUP_TOKEN && process.env.GITHUB_BACKUP_REPO
    );

    const availableBackups = await backupService.listAvailableBackups();

    res.json({
      success: true,
      message: isConfigured
        ? "Backup service is running"
        : "Backup service not configured",
      storage: "github",
      configured: isConfigured,
      repository: process.env.GITHUB_BACKUP_REPO || "Not set",
      maxBackups: 2,
      schedule: "Daily at 2:00 AM UTC",
      availableBackups: availableBackups,
      totalBackups: availableBackups.length,
    });
  } catch (error: any) {
    logger.error(`Status endpoint error: ${error.message || error}`);
    res.status(500).json({
      success: false,
      error: "Failed to fetch backup status",
      message: error.message,
    });
  }
});

export default router;
