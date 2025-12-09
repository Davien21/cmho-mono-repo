import mongoose from "mongoose";
import { env } from "../src/config/env";
import logger from "../src/config/logger";

/**
 * Migration script to migrate data from stock_entries collection to stock_movements collection
 * 
 * This script:
 * 1. Copies all documents from stock_entries to stock_movements
 * 2. Verifies the migration by comparing counts
 * 3. Optionally removes the old collection (commented out for safety)
 * 
 * Usage:
 *   pnpm --filter @cmho/backend migrate:stock-entries
 * 
 * For dry-run (just check counts without migrating):
 *   DRY_RUN=true pnpm --filter @cmho/backend migrate:stock-entries
 */

const OLD_COLLECTION = "stock_entries";
const NEW_COLLECTION = "stock_movements";
const DRY_RUN = process.env.DRY_RUN === "true";

async function getCollectionCounts(db: mongoose.Connection) {
  const oldCount = await db.collection(OLD_COLLECTION).countDocuments();
  const newCount = await db.collection(NEW_COLLECTION).countDocuments();
  return { oldCount, newCount };
}

async function migrateData(db: mongoose.Connection) {
  logger.info(`Starting migration from ${OLD_COLLECTION} to ${NEW_COLLECTION}...`);

  // Check if old collection exists
  const collections = await db.listCollections({ name: OLD_COLLECTION }).toArray();
  if (collections.length === 0) {
    logger.info(`Collection ${OLD_COLLECTION} does not exist. Nothing to migrate.`);
    return { migrated: 0, skipped: 0 };
  }

  // Get initial counts
  const { oldCount, newCount: initialNewCount } = await getCollectionCounts(db);
  logger.info(`Found ${oldCount} documents in ${OLD_COLLECTION}`);
  logger.info(`Found ${initialNewCount} documents in ${NEW_COLLECTION}`);

  if (oldCount === 0) {
    logger.info(`No documents to migrate from ${OLD_COLLECTION}`);
    return { migrated: 0, skipped: 0 };
  }

  if (DRY_RUN) {
    logger.info("🔍 DRY RUN MODE - No data will be migrated");
    logger.info(`Would migrate ${oldCount} documents from ${OLD_COLLECTION} to ${NEW_COLLECTION}`);
    return { migrated: 0, skipped: oldCount };
  }

  // Check if new collection already has data
  if (initialNewCount > 0) {
    logger.warn(
      `⚠️  Warning: ${NEW_COLLECTION} already contains ${initialNewCount} documents.`
    );
    logger.warn("This migration will add to existing data. Duplicates may occur if documents already exist.");
    
    // Check for duplicates by _id
    const existingIds = await db
      .collection(NEW_COLLECTION)
      .find({}, { projection: { _id: 1 } })
      .toArray();
    const existingIdSet = new Set(existingIds.map((doc) => doc._id.toString()));

    const oldDocs = await db.collection(OLD_COLLECTION).find({}).toArray();
    const duplicates = oldDocs.filter((doc) => existingIdSet.has(doc._id.toString()));
    
    if (duplicates.length > 0) {
      logger.warn(`Found ${duplicates.length} documents that already exist in ${NEW_COLLECTION}`);
      logger.warn("These will be skipped to avoid duplicates.");
    }
  }

  // Use aggregation pipeline to copy documents
  // This is more efficient than individual inserts
  const pipeline = [
    {
      $match: {}, // Match all documents
    },
    {
      $merge: {
        into: NEW_COLLECTION,
        whenMatched: "skip", // Skip if document already exists (by _id)
        whenNotMatched: "insert", // Insert if document doesn't exist
      },
    },
  ];

  logger.info("Running aggregation pipeline to migrate documents...");
  const result = await db.collection(OLD_COLLECTION).aggregate(pipeline).toArray();

  // Get final counts
  const { newCount: finalNewCount } = await getCollectionCounts(db);
  const migrated = finalNewCount - initialNewCount;
  const skipped = oldCount - migrated;

  logger.info(`✅ Migration completed!`);
  logger.info(`   Migrated: ${migrated} documents`);
  logger.info(`   Skipped: ${skipped} documents (duplicates or errors)`);
  logger.info(`   Total in ${NEW_COLLECTION}: ${finalNewCount} documents`);

  return { migrated, skipped };
}

async function verifyMigration(db: mongoose.Connection) {
  logger.info("Verifying migration...");

  const { oldCount, newCount } = await getCollectionCounts(db);

  if (oldCount === 0) {
    logger.info("✅ Old collection is empty - nothing to verify");
    return true;
  }

  if (newCount >= oldCount) {
    logger.info(`✅ Verification passed: ${NEW_COLLECTION} has ${newCount} documents (expected at least ${oldCount})`);
    return true;
  } else {
    logger.error(
      `❌ Verification failed: ${NEW_COLLECTION} has ${newCount} documents but ${OLD_COLLECTION} has ${oldCount}`
    );
    return false;
  }
}

async function runMigration() {
  await mongoose.connect(env.DATABASE_URL);

  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    logger.info("=".repeat(60));
    logger.info("Stock Entries to Stock Movements Migration");
    logger.info("=".repeat(60));

    if (DRY_RUN) {
      logger.info("🔍 Running in DRY RUN mode");
    }

    // Run migration
    const { migrated, skipped } = await migrateData(db);

    // Verify migration
    const verified = await verifyMigration(db);

    if (!verified && !DRY_RUN) {
      logger.error("Migration verification failed!");
      process.exit(1);
    }

    if (DRY_RUN) {
      logger.info("\n🔍 DRY RUN completed. Run without DRY_RUN=true to perform actual migration.");
    } else {
      logger.info("\n✅ Migration completed successfully!");
      logger.info("\n⚠️  Next steps:");
      logger.info("   1. Verify the data in the new collection");
      logger.info("   2. Test your application with the new collection");
      logger.info("   3. Once confirmed, you can manually drop the old collection:");
      logger.info(`      db.${OLD_COLLECTION}.drop()`);
    }

    logger.info("=".repeat(60));
  } catch (error) {
    logger.error(`Error during migration: ${error}`);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Migration failed: ${error}`);
    process.exit(1);
  });

