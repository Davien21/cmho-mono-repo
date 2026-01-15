import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { exec } from "child_process";
import archiver from "archiver";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

async function createManualBackup(backupName: string) {
  try {
    console.log(`🔄 Starting manual backup: ${backupName}`);

    // Get database URL from environment or use default
    const DATABASE_URL =
      process.env.DATABASE_URL ||
      "mongodb://localhost:27017/cmho?directConnection=true";

    console.log(`📡 Connecting to database: ${DATABASE_URL}`);

    // Connect to MongoDB
    await mongoose.connect(DATABASE_URL);

    // Create backup directory in the backend folder
    const backupDir = path.join(__dirname, "..", "backups");
    await execAsync(`mkdir -p ${backupDir}`);

    const backupPath = path.join(backupDir, backupName);
    const zipPath = path.join(backupDir, `${backupName}.zip`);

    // Create backup subdirectory
    await execAsync(`mkdir -p ${backupPath}`);

    // Check database connection
    if (!mongoose.connection.db) {
      throw new Error("Database connection not established");
    }

    // Export all collections
    console.log("📦 Exporting database collections...");
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`  ✓ Exporting collection: ${collectionName}`);

      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();

      // Write collection to JSON file
      const filePath = path.join(backupPath, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));

      console.log(`    - Exported ${documents.length} documents`);
    }

    // Create metadata file
    const metadata = {
      backupName,
      backupDate: new Date().toISOString(),
      databaseName: mongoose.connection.name,
      collections: collections.map((c) => c.name),
      totalCollections: collections.length,
      purpose: "Pre-migration backup before Gallery to Media consolidation",
    };
    fs.writeFileSync(
      path.join(backupPath, "metadata.json"),
      JSON.stringify(metadata, null, 2)
    );

    console.log("🗜️  Creating zip archive...");
    await createZipArchive(backupPath, zipPath);

    // Cleanup uncompressed backup
    await execAsync(`rm -rf ${backupPath}`);

    // Get file size
    const stats = fs.statSync(zipPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup created successfully!`);
    console.log(`📁 Location: ${zipPath}`);
    console.log(`📊 Size: ${fileSizeMB} MB`);
    console.log(`📦 Collections backed up: ${collections.length}`);

    // Close database connection
    await mongoose.connection.close();

    return {
      success: true,
      backupPath: zipPath,
      sizeMB: fileSizeMB,
      collections: collections.length,
    };
  } catch (error) {
    console.error(`❌ Backup failed:`, error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    throw error;
  }
}

async function createZipArchive(
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

// Run the backup
const backupName = process.argv[2] || "manual-backup";
createManualBackup(backupName)
  .then((result) => {
    console.log("\n✨ Backup process completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Backup process failed!");
    process.exit(1);
  });

