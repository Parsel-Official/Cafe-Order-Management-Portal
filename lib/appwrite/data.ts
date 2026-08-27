import { appwriteConfig } from "@/lib/appwrite/config";
import { normalizeAppwriteImageUrl } from "@/lib/appwrite/image-url";
import { Query, getServerDatabases } from "@/lib/appwrite/server";
import type { MenuCategory, MenuItem, PublicMenu } from "@/lib/types";

function relationId(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$id" in value) {
    return String((value as { $id: string }).$id);
  }
  return "";
}

export async function getPublicMenu(token: string): Promise<PublicMenu> {
  const databases = getServerDatabases();
  const tables = await databases.listDocuments({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.tables,
    queries: [Query.equal("token", [token]), Query.limit(1)],
  });

  const table = tables.documents[0] as unknown as PublicMenu["table"] | undefined;
  if (!table) throw new Error("TABLE_NOT_FOUND");
  if (!table.isActive) throw new Error("TABLE_INACTIVE");

  const [categoriesResult, itemsResult, ordersResult] = await Promise.all([
    databases.listDocuments({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.categories,
      queries: [
        Query.equal("isActive", [true]),
        Query.orderAsc("order"),
        Query.limit(100),
      ],
    }),
    databases.listDocuments({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.items,
      queries: [
        Query.equal("isActive", [true]),
        Query.equal("isAvailable", [true]),
        Query.limit(500),
      ],
    }),
    databases.listDocuments({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.orders,
      queries: [
        Query.equal("tableId", [table.$id]),
        Query.equal("status", ["active"]),
        Query.limit(1),
      ],
    }),
  ]);

  const categories = categoriesResult.documents as unknown as MenuCategory[];
  const items = (
    itemsResult.documents as unknown as MenuItem[]
  ).map((item) => ({
    ...item,
    imageUrl: normalizeAppwriteImageUrl(item.imageUrl),
  }));
  const activeOrder = ordersResult.documents[0];

  if (activeOrder) {
    throw new Error("TABLE_HAS_ACTIVE_ORDER");
  }

  return {
    table,
    categories: categories.map((category) => ({
      ...category,
      items: items.filter(
        (item) => relationId(item.categoryId) === category.$id,
      ),
    })),
    activeOrder: null,
  };
}
