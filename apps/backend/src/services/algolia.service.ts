import { algoliasearch } from "algoliasearch";
import { env } from "../config/env.js";
import logger from "../config/logger.js";

const client = algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_ADMIN_API_KEY);

/**
 * Determines the Algolia index name based on the current environment
 * - development: inventory_items_development
 * - production: inventory_items_production
 * - test: inventory_items_test
 */
const getIndexName = () => {
  const environment = env.NODE_ENV || "development";
  return `inventory_items_${environment}`;
};

logger.info(`🔍 Using Algolia index: ${getIndexName()}`);

interface InventoryItemForIndex {
  _id: string | { toString(): string };
  name: string;
  category?: {
    _id: string | { toString(): string };
    name: string;
  };
  status: string;
  isDeleted?: boolean;
}

class AlgoliaInventoryService {
  /**
   * Index a single inventory item
   */
  async indexItem(item: InventoryItemForIndex) {
    try {
      await client.saveObject({
        indexName: getIndexName(),
        body: {
          objectID: item._id.toString(),
          name: item.name,
          category: item.category?.name || "",
          categoryId: item.category?._id?.toString() || "",
          status: item.status,
          isDeleted: item.isDeleted || false,
        },
      });
      console.log(`✅ Indexed item: ${item.name}`);
    } catch (error) {
      console.error(`❌ Failed to index item ${item.name}:`, error);
      throw error;
    }
  }

  /**
   * Batch index multiple items
   */
  async indexItems(items: InventoryItemForIndex[]) {
    try {
      const objects = items.map((item) => ({
        objectID: item._id.toString(),
        name: item.name,
        category: item.category?.name || "",
        categoryId: item.category?._id?.toString() || "",
        status: item.status,
        isDeleted: item.isDeleted || false,
      }));

      await client.saveObjects({
        indexName: getIndexName(),
        objects,
      });
      console.log(`✅ Batch indexed ${items.length} items`);
    } catch (error) {
      console.error(`❌ Failed to batch index items:`, error);
      throw error;
    }
  }

  /**
   * Delete an item from index
   */
  async deleteItem(itemId: string) {
    try {
      await client.deleteObject({
        indexName: getIndexName(),
        objectID: itemId,
      });
      console.log(`✅ Deleted item from index: ${itemId}`);
    } catch (error) {
      console.error(`❌ Failed to delete item ${itemId} from index:`, error);
      throw error;
    }
  }

  /**
   * Search with autocomplete
   */
  async search(
    query: string,
    limit: number = 20
  ): Promise<Array<{ _id: string; name: string; category: string }>> {
    try {
      const { hits } = await client.searchSingleIndex({
        indexName: getIndexName(),
        searchParams: {
          query,
          hitsPerPage: limit,
          typoTolerance: "true",
          attributesToRetrieve: ["objectID", "name", "category"],
          filters: "status:active AND isDeleted:false",
          // Enable prefix matching for autocomplete
          queryType: "prefixAll",
        },
      });

      return hits.map((hit: any) => ({
        _id: hit.objectID,
        name: hit.name,
        category: hit.category,
      }));
    } catch (error) {
      console.error(`❌ Search failed for query "${query}":`, error);
      throw error;
    }
  }

  /**
   * Configure index settings for optimal autocomplete search
   */
  async configureIndex() {
    try {
      await client.setSettings({
        indexName: getIndexName(),
        indexSettings: {
          searchableAttributes: ["name", "category"],
          attributesForFaceting: ["status", "isDeleted", "categoryId"],
          customRanking: ["desc(name)"],
          typoTolerance: "min",
          minWordSizefor1Typo: 3,
          minWordSizefor2Typos: 6,
          // Enable highlighting for UI
          attributesToHighlight: ["name"],
          attributesToSnippet: ["name:20"],
        },
      });
      console.log(`✅ Configured settings for index: ${getIndexName()}`);
    } catch (error) {
      console.error(`❌ Failed to configure index:`, error);
      throw error;
    }
  }

  /**
   * Full reindex from MongoDB
   */
  async fullReindex() {
    try {
      console.log("🔄 Starting full reindex...");

      // Dynamic import to avoid circular dependencies
      const { default: InventoryItem } = await import(
        "../modules/inventory-items/inventory-items.model.js"
      );

      const items = await InventoryItem.find({
        isDeleted: { $ne: true },
      }).lean();

      console.log(`📦 Found ${items.length} items to index`);

      await this.indexItems(items as InventoryItemForIndex[]);

      console.log("✅ Full reindex completed successfully");
    } catch (error) {
      console.error("❌ Full reindex failed:", error);
      throw error;
    }
  }

  /**
   * Clear all objects from the index
   */
  async clearIndex() {
    try {
      await client.clearObjects({
        indexName: getIndexName(),
      });
      console.log(`✅ Cleared all objects from index: ${getIndexName()}`);
    } catch (error) {
      console.error(`❌ Failed to clear index:`, error);
      throw error;
    }
  }

  /**
   * Get the current index name
   */
  getIndexName() {
    return getIndexName();
  }
}

const algoliaInventoryService = new AlgoliaInventoryService();

export default algoliaInventoryService;
