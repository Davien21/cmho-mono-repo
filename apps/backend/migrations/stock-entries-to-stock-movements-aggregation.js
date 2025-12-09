// MongoDB Aggregation Pipeline to migrate stock_entries to stock_movements
//
// Usage options:
// 1. Run in MongoDB shell:
//    db.stock_entries.aggregate([...pipeline])
//
// 2. Run in MongoDB Compass:
//    - Open Aggregation tab on stock_entries collection
//    - Paste the pipeline stages
//
// 3. Run via Node.js/Mongoose:
//    await db.collection('stock_entries').aggregate(pipeline).toArray()

// Simple copy with merge (skips duplicates by _id)
db.stock_entries.aggregate([
  {
    $match: {} // Match all documents
  },
  {
    $merge: {
      into: "stock_movements",
      whenMatched: "skip",      // Skip if document already exists (by _id)
      whenNotMatched: "insert"   // Insert if document doesn't exist
    }
  }
]);

// Alternative: Direct copy (will fail if duplicates exist)
// db.stock_entries.aggregate([
//   {
//     $match: {}
//   },
//   {
//     $out: "stock_movements"  // Creates/replaces the collection
//   }
// ]);

// To verify the migration:
// db.stock_entries.countDocuments()
// db.stock_movements.countDocuments()

// To drop the old collection after verification (BE CAREFUL!):
// db.stock_entries.drop()

