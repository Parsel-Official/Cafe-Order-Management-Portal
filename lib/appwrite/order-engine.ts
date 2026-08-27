import { ID } from "node-appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, getServerDatabases } from "@/lib/appwrite/server";
import { relationId } from "@/lib/types";

const TAX_RATE = 0.1;
const money = (value: number) => Math.round(value);

type Databases = ReturnType<typeof getServerDatabases>;

export async function recalcOrder(databases: Databases, orderId: string) {
  const [orderResult, itemsResult] = await Promise.all([
    databases.getDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.orders,
      documentId: orderId,
    }),
    databases.listDocuments({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.orderItems,
      queries: [Query.equal("orderId", [orderId]), Query.limit(500)],
    }),
  ]);

  const order = orderResult as unknown as {
    discountType: "none" | "code" | "manual";
    discountPercent?: number | null;
  };

  const subtotal = itemsResult.documents.reduce(
    (sum, item) => sum + money(item.unitPrice) * item.quantity,
    0,
  );

  const discountPercent =
    order.discountType === "none" ? 0 : order.discountPercent ?? 0;
  const discountAmount = money((subtotal * discountPercent) / 100);
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = money(taxable * TAX_RATE);
  const total = taxable + taxAmount;

  const updated = await databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.orders,
    documentId: orderId,
    data: { discountAmount, subtotal, taxAmount, total },
  });

  return updated;
}

export async function setOrderDiscount(
  databases: Databases,
  orderId: string,
  discount:
    | { type: "none" }
    | { type: "manual"; percent: number }
    | { type: "code"; codeId: string; percent: number },
) {
  const data =
    discount.type === "none"
      ? { discountType: "none", discountCodeId: null, discountPercent: 0 }
      : discount.type === "manual"
        ? {
            discountType: "manual",
            discountCodeId: null,
            discountPercent: discount.percent,
          }
        : {
            discountType: "code",
            discountCodeId: discount.codeId,
            discountPercent: discount.percent,
          };

  await databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.orders,
    documentId: orderId,
    data,
  });

  return recalcOrder(databases, orderId);
}

export async function addItemsToOrder(
  databases: Databases,
  orderId: string,
  items: Array<{ menuItemId: string; quantity: number }>,
) {
  const itemIds = [...new Set(items.map((item) => item.menuItemId))];
  if (itemIds.length === 0) return;

  const menuItems = await databases.listDocuments({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.items,
    queries: [Query.equal("$id", itemIds), Query.limit(500)],
  });
  const menuById = new Map(menuItems.documents.map((item) => [item.$id, item]));

  const existing = await databases.listDocuments({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.orderItems,
    queries: [Query.equal("orderId", [orderId]), Query.limit(500)],
  });

  for (const item of items) {
    const menuItem = menuById.get(item.menuItemId);
    if (!menuItem) continue;

    const existingDoc = existing.documents.find(
      (doc) => relationId(doc.menuItemId) === item.menuItemId,
    );

    if (existingDoc) {
      await databases.updateDocument({
        databaseId: appwriteConfig.databaseId,
        collectionId: appwriteConfig.collections.orderItems,
        documentId: existingDoc.$id,
        data: { quantity: existingDoc.quantity + item.quantity },
      });
    } else {
      await databases.createDocument({
        databaseId: appwriteConfig.databaseId,
        collectionId: appwriteConfig.collections.orderItems,
        documentId: ID.unique(),
        data: {
          orderId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: money(menuItem.price),
        },
      });
    }
  }

  return recalcOrder(databases, orderId);
}

export async function settleOrder(databases: Databases, orderId: string) {
  const order = await databases.getDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.orders,
    documentId: orderId,
  });

  if (order.status === "settled") return order;

  const settled = await databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.orders,
    documentId: orderId,
    data: { status: "settled", settledAt: new Date().toISOString() },
  });

  await databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.tables,
    documentId: relationId(order.tableId),
    data: { status: "empty" },
  });

  return settled;
}

export async function deleteOrder(databases: Databases, orderId: string) {
  const order = await databases.getDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.orders,
    documentId: orderId,
  });

  const items = await databases.listDocuments({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.orderItems,
    queries: [Query.equal("orderId", [orderId]), Query.limit(500)],
  });
  for (const item of items.documents) {
    await databases.deleteDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.orderItems,
      documentId: item.$id,
    });
  }

  await databases.deleteDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.orders,
    documentId: orderId,
  });

  if (order.status === "active") {
    await databases.updateDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.tables,
      documentId: relationId(order.tableId),
      data: { status: "empty" },
    });
  }
}
