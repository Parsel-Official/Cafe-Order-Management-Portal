"use server";

import { ID } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, getServerDatabases } from "@/lib/appwrite/server";

const submitOrderSchema = z.object({
  token: z.string().min(1),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1),
});

const money = (value: number) => Math.round(value);

export async function submitOrder(input: unknown) {
  const payload = submitOrderSchema.parse(input);
  const databases = getServerDatabases();
  const tables = await databases.listDocuments({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.tables,
    queries: [Query.equal("token", [payload.token]), Query.limit(1)],
  });
  const table = tables.documents[0];

  if (!table || !table.isActive) {
    throw new Error("این میز معتبر یا فعال نیست.");
  }

  const itemIds = [...new Set(payload.items.map((item) => item.menuItemId))];
  const menuItems = await databases.listDocuments({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.items,
    queries: [
      Query.equal("$id", itemIds),
      Query.equal("isActive", [true]),
      Query.equal("isAvailable", [true]),
      Query.limit(500),
    ],
  });
  const menuById = new Map(menuItems.documents.map((item) => [item.$id, item]));

  if (menuById.size !== itemIds.length) {
    throw new Error("یکی از آیتم‌های انتخاب‌شده دیگر موجود نیست.");
  }

  const activeOrders = await databases.listDocuments({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.orders,
    queries: [
      Query.equal("tableId", [table.$id]),
      Query.equal("status", ["active"]),
      Query.limit(2),
    ],
  });
  let order = activeOrders.documents[0];

  if (!order) {
    order = await databases.createDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.orders,
      documentId: ID.unique(),
      data: {
        tableId: table.$id,
        status: "active",
        discountType: "none",
        subtotal: 0,
        taxAmount: 0,
        total: 0,
        createdAt: new Date().toISOString(),
      },
    });
  }

  for (const item of payload.items) {
    const menuItem = menuById.get(item.menuItemId);
    if (!menuItem) continue;
    const existing = await databases.listDocuments({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.orderItems,
      queries: [
        Query.equal("orderId", [order.$id]),
        Query.equal("menuItemId", [item.menuItemId]),
        Query.limit(1),
      ],
    });

    if (existing.documents[0]) {
      await databases.updateDocument({
        databaseId: appwriteConfig.databaseId,
        collectionId: appwriteConfig.collections.orderItems,
        documentId: existing.documents[0].$id,
        data: {
          quantity: existing.documents[0].quantity + item.quantity,
        },
      });
    } else {
      await databases.createDocument({
        databaseId: appwriteConfig.databaseId,
        collectionId: appwriteConfig.collections.orderItems,
        documentId: ID.unique(),
        data: {
          orderId: order.$id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: money(menuItem.price),
        },
      });
    }
  }

  const orderItems = await databases.listDocuments({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.orderItems,
    queries: [Query.equal("orderId", [order.$id]), Query.limit(500)],
  });
  const subtotal = orderItems.documents.reduce(
    (sum, item) => sum + money(item.unitPrice) * item.quantity,
    0,
  );
  const taxAmount = money(subtotal * 0.1);

  await databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.orders,
    documentId: order.$id,
    data: { subtotal, taxAmount, total: subtotal + taxAmount },
  });

  if (table.status !== "occupied") {
    await databases.updateDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.tables,
      documentId: table.$id,
      data: { status: "occupied" },
    });
  }

  revalidatePath(`/orders/${payload.token}`, "page");
  revalidatePath("/admin", "page");
  revalidatePath("/admin/orders", "page");
  revalidatePath("/admin/tables", "page");
  return { orderId: order.$id };
}
