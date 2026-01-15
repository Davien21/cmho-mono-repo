import mongoose from "mongoose";

async function verifyMigration() {
  try {
    const DATABASE_URL =
      process.env.DATABASE_URL ||
      "mongodb://localhost:27017/cmho?directConnection=true";

    await mongoose.connect(DATABASE_URL);
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not established");

    const mediaCollection = db.collection("media");

    // Check a few migrated records
    const samples = await mediaCollection
      .find({ name: { $exists: true } })
      .limit(5)
      .toArray();

    console.log("📋 Sample migrated media records:\n");
    samples.forEach((media: any, idx: number) => {
      console.log(`${idx + 1}. Name: ${media.name || "N/A"}`);
      console.log(`   Category: ${media.category}`);
      console.log(`   Filename: ${media.filename}`);
      console.log(`   IsDeleted: ${media.isDeleted || false}\n`);
    });

    // Count stats
    const totalWithNames = await mediaCollection.countDocuments({
      name: { $exists: true },
    });
    const totalMedia = await mediaCollection.countDocuments({});

    console.log(`📊 Statistics:`);
    console.log(`   Total media records: ${totalMedia}`);
    console.log(`   Media with names: ${totalWithNames}`);
    console.log(
      `   Media with categories: ${await mediaCollection.countDocuments({ category: { $exists: true } })}`
    );

    await mongoose.connection.close();
    console.log("\n✅ Verification complete!");
  } catch (error) {
    console.error("❌ Verification failed:", error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

verifyMigration();

