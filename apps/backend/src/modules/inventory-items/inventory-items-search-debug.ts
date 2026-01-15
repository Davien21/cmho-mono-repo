/**
 * Diagnostic script to debug Atlas Search issues
 * Run this to identify why autocomplete search returns 0 results
 */

import { InventoryItem } from "./inventory-items.model";

export async function debugAtlasSearch(query: string) {
  console.log("=== ATLAS SEARCH DIAGNOSTIC ===\n");

  // 1. Check if items exist with correct filters
  console.log("1. Checking items with filters (status=active, isDeleted=false):");
  const activeItems = await InventoryItem.find({
    status: "active",
    isDeleted: false,
  })
    .limit(5)
    .select("name status isDeleted");
  console.log(`   Found ${activeItems.length} active items:`);
  activeItems.forEach((item) =>
    console.log(`   - ${item.name} (status: ${item.status})`)
  );

  // 2. Check total items
  console.log("\n2. Total items in collection:");
  const totalCount = await InventoryItem.countDocuments();
  console.log(`   Total: ${totalCount}`);

  // 3. Try search WITHOUT filters
  console.log(`\n3. Testing search WITHOUT filters for query: "${query}"`);
  try {
    const noFilterResults = await InventoryItem.aggregate([
      {
        $search: {
          index: "inventory_items_search",
          autocomplete: {
            query: query,
            path: "name",
          },
        },
      },
      { $limit: 5 },
      { $project: { name: 1, status: 1, isDeleted: 1 } },
    ]);
    console.log(`   Results without filters: ${noFilterResults.length}`);
    noFilterResults.forEach((item) =>
      console.log(
        `   - ${item.name} (status: ${item.status}, deleted: ${item.isDeleted})`
      )
    );
  } catch (error: any) {
    console.log(`   ERROR: ${error.message}`);
  }

  // 4. Try simple autocomplete with filters
  console.log(`\n4. Testing search WITH filters for query: "${query}"`);
  try {
    const withFilterResults = await InventoryItem.aggregate([
      {
        $search: {
          index: "inventory_items_search",
          compound: {
            must: [
              {
                autocomplete: {
                  query: query,
                  path: "name",
                },
              },
              {
                equals: {
                  path: "status",
                  value: "active",
                },
              },
              {
                equals: {
                  path: "isDeleted",
                  value: false,
                },
              },
            ],
          },
        },
      },
      { $limit: 5 },
      { $project: { name: 1, status: 1, isDeleted: 1 } },
    ]);
    console.log(`   Results with filters: ${withFilterResults.length}`);
    withFilterResults.forEach((item) =>
      console.log(
        `   - ${item.name} (status: ${item.status}, deleted: ${item.isDeleted})`
      )
    );
  } catch (error: any) {
    console.log(`   ERROR: ${error.message}`);
  }

  // 5. Check index status
  console.log("\n5. Recommendations:");
  if (activeItems.length === 0) {
    console.log(
      "   ⚠️  NO ACTIVE ITEMS FOUND! Check your data - all items might be disabled or deleted."
    );
  }
  if (totalCount === 0) {
    console.log("   ⚠️  Collection is empty! Seed some inventory items first.");
  }
  console.log(
    "   - Verify Atlas Search index 'inventory_items_search' is ACTIVE in Atlas UI"
  );
  console.log("   - Index rebuild takes 1-2 minutes after config changes");
  console.log(
    "   - Check Atlas Search > Indexes to see rebuild status\n"
  );

  console.log("=== END DIAGNOSTIC ===\n");
}

