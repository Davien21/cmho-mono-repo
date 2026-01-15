import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrateGalleryToMedia() {
  try {
    console.log("🔄 Starting Gallery to Media migration...\n");

    // Get database URL from environment or use default
    const DATABASE_URL =
      process.env.DATABASE_URL ||
      "mongodb://localhost:27017/cmho?directConnection=true";

    console.log(`📡 Connecting to database: ${DATABASE_URL}`);

    // Connect to MongoDB
    await mongoose.connect(DATABASE_URL);

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    // Get collections
    const galleryCollection = db.collection("gallery");
    const mediaCollection = db.collection("media");

    // Count total galleries to migrate
    const totalGalleries = await galleryCollection.countDocuments({
      isDeleted: { $ne: true },
    });

    console.log(`📊 Found ${totalGalleries} gallery items to migrate\n`);

    if (totalGalleries === 0) {
      console.log("✅ No gallery items to migrate. Exiting.");
      await mongoose.connection.close();
      return;
    }

    // Fetch all non-deleted gallery items with populated media_id
    const galleries = await galleryCollection.find({ isDeleted: { $ne: true } }).toArray();

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const errors: Array<{ galleryId: string; error: string }> = [];

    console.log("🔄 Processing gallery items...\n");

    for (const gallery of galleries) {
      try {
        const mediaId = gallery.media_id;

        // Check if media exists
        const media = await mediaCollection.findOne({ _id: mediaId });

        if (!media) {
          console.log(
            `⚠️  Skipping gallery ${gallery._id}: Media ${mediaId} not found`
          );
          skipCount++;
          continue;
        }

        // Update media with gallery metadata
        const updateResult = await mediaCollection.updateOne(
          { _id: mediaId },
          {
            $set: {
              name: gallery.name || media.name,
              category: gallery.category || media.category,
              isDeleted: gallery.isDeleted || false,
              deletedAt: gallery.deletedAt || null,
            },
          }
        );

        if (updateResult.modifiedCount > 0) {
          console.log(
            `✓ Migrated gallery ${gallery._id} → media ${mediaId} (${gallery.name || media.filename || 'unnamed'})`
          );
          successCount++;
        } else {
          console.log(
            `→ Gallery ${gallery._id} already migrated (no changes needed)`
          );
          successCount++;
        }
      } catch (error: any) {
        console.error(`❌ Error migrating gallery ${gallery._id}:`, error.message);
        errorCount++;
        errors.push({
          galleryId: gallery._id.toString(),
          error: error.message,
        });
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Migration Summary");
    console.log("=".repeat(60));
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⚠️  Skipped (media not found): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📦 Total processed: ${galleries.length}`);
    console.log("=".repeat(60));

    if (errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. Gallery ${err.galleryId}: ${err.error}`);
      });
    }

    // Show sample of migrated media
    if (successCount > 0) {
      console.log("\n📋 Sample of migrated media (first 5):");
      const sampleMedia = await mediaCollection
        .find({ name: { $exists: true } })
        .limit(5)
        .toArray();

      sampleMedia.forEach((media, idx) => {
        console.log(
          `  ${idx + 1}. ${media.name || media.filename || 'unnamed'} (${media.category})`
        );
      });
    }

    console.log("\n✨ Migration completed!");
    console.log("\n⚠️  IMPORTANT: The Gallery collection has NOT been deleted.");
    console.log("   Review the migrated data before removing the Gallery module.\n");

    // Close database connection
    await mongoose.connection.close();

    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run the migration
migrateGalleryToMedia();

