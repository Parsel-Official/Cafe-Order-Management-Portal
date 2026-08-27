import { appwriteConfig } from "@/lib/appwrite/config";
import { normalizeAppwriteImageUrl } from "@/lib/appwrite/image-url";
import {
  Query,
  getServerDatabases,
  withAppwriteRetry,
} from "@/lib/appwrite/server";
import {
  relationId,
  type DiscountCode,
  type MenuCategory,
  type MenuItem,
  type Order,
  type OrderItem,
  type OrderWithItems,
  type Table,
} from "@/lib/types";

export async function getAdminMenu(): Promise<
  Array<MenuCategory & { items: MenuItem[] }>
> {
  const databases = getServerDatabases();
  const [categoriesResult, itemsResult] = await Promise.all([
    databases.listDocuments({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.categories,
      queries: [Query.orderAsc("order"), Query.limit(200)],
    }),
    databases.listDocuments({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.items,
      queries: [Query.orderAsc("name"), Query.limit(2000)],
    }),
  ]);

  const categories = categoriesResult.documents as unknown as MenuCategory[];
  const items = itemsResult.documents as unknown as MenuItem[];

  return categories.map((category) => ({
    ...category,
    items: items
      .filter((item) => relationId(item.categoryId) === category.$id)
      .map((item) => ({
        ...item,
        imageUrl: normalizeAppwriteImageUrl(item.imageUrl),
      })),
  }));
}

export async function getTables(): Promise<Table[]> {
  const databases = getServerDatabases();
  const result = await databases.listDocuments({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.tables,
    queries: [Query.orderAsc("tableNumber"), Query.limit(200)],
  });
  return result.documents as unknown as Table[];
}

export async function getOrders(
  status: "active" | "settled",
  todayOnly = false,
): Promise<OrderWithItems[]> {
  const databases = getServerDatabases();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const queries = [
    Query.equal("status", [status]),
    Query.orderDesc("createdAt"),
    Query.limit(200),
  ];
  if (todayOnly && status === "settled") {
    queries.push(Query.greaterThanEqual("settledAt", [startOfDay.toISOString()]));
  }

  let ordersResult;
  let tablesResult;
  try {
    [ordersResult, tablesResult] = await withAppwriteRetry(() =>
      Promise.all([
        databases.listDocuments({
          databaseId: appwriteConfig.databaseId,
          collectionId: appwriteConfig.collections.orders,
          queries,
        }),
        databases.listDocuments({
          databaseId: appwriteConfig.databaseId,
          collectionId: appwriteConfig.collections.tables,
          queries: [Query.limit(500)],
        }),
      ]),
    );
  } catch (error) {
    console.error("Failed to load admin orders", {
      status,
      todayOnly,
      error,
    });
    throw new Error("دریافت سفارش‌ها از سرور انجام نشد. لطفاً دوباره تلاش کنید.");
  }

  const tableNumbers = new Map(
    tablesResult.documents.map((table) => [
      table.$id,
      String(table.tableNumber),
    ]),
  );

  const orderIds = ordersResult.documents.map((order) => order.$id);
  const itemsResult = orderIds.length
    ? await withAppwriteRetry(() =>
        databases.listDocuments({
          databaseId: appwriteConfig.databaseId,
          collectionId: appwriteConfig.collections.orderItems,
          queries: [Query.equal("orderId", orderIds), Query.limit(1000)],
        }),
      )
    : { documents: [] };

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of itemsResult.documents as unknown as OrderItem[]) {
    const orderId = relationId(item.orderId);
    const list = itemsByOrder.get(orderId) ?? [];
    list.push(item);
    itemsByOrder.set(orderId, list);
  }

  return ordersResult.documents.map((order) => {
    const typed = order as unknown as Order;
    return {
      ...typed,
      tableNumber: tableNumbers.get(relationId(typed.tableId)) ?? "؟",
      items: itemsByOrder.get(order.$id) ?? [],
    };
  });
}

export async function getOrderDetail(
  orderId: string,
): Promise<(OrderWithItems & { tableToken: string }) | null> {
  const databases = getServerDatabases();
  const order = await databases
    .getDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.orders,
      documentId: orderId,
    })
    .catch(() => null);
  if (!order) return null;

  const [table, itemsResult, menuResult] = await Promise.all([
    databases.getDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.tables,
      documentId: relationId(order.tableId),
    }),
    databases.listDocuments({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.orderItems,
      queries: [Query.equal("orderId", [orderId]), Query.limit(500)],
    }),
    databases.listDocuments({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.items,
      queries: [Query.limit(2000)],
    }),
  ]);

  const nameById = new Map(menuResult.documents.map((item) => [item.$id, item.name]));

  return {
    ...(order as unknown as Order),
    tableNumber: String(table.tableNumber),
    tableToken: String(table.token),
    items: (itemsResult.documents as unknown as OrderItem[]).map((item) => ({
      ...item,
      name: nameById.get(relationId(item.menuItemId)) ?? "آیتم حذف‌شده",
    })),
  };
}

export async function getDiscountCodes(): Promise<DiscountCode[]> {
  const databases = getServerDatabases();
  const result = await databases.listDocuments({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.discountCodes,
    queries: [Query.orderDesc("$createdAt"), Query.limit(200)],
  });
  return result.documents as unknown as DiscountCode[];
}
