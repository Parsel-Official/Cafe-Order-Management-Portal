"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, getServerDatabases } from "@/lib/appwrite/server";
import {
  addItemsToOrder,
  deleteOrder,
  recalcOrder,
  setOrderDiscount,
  settleOrder,
} from "@/lib/appwrite/order-engine";
import { getOrders } from "@/lib/appwrite/admin-data";

function normalizeDigits(value: unknown) {
  if (typeof value !== "string") return value;
  return value
    .replace(/[۰-۹]/gu, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/gu, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

const percentSchema = z.preprocess(
  normalizeDigits,
  z.coerce.number().int().min(1).max(100),
);

const discountSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none"), orderId: z.string() }),
  z.object({
    type: z.literal("manual"),
    orderId: z.string(),
    percent: percentSchema,
  }),
  z.object({
    type: z.literal("code"),
    orderId: z.string(),
    code: z.string().trim().min(1).max(64),
  }),
]);

export async function applyDiscount(input: unknown) {
  const payload = discountSchema.parse(input);
  const databases = getServerDatabases();

  if (payload.type === "code") {
    const normalizedCode = payload.code.toUpperCase();
    const codes = await databases.listDocuments({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.discountCodes,
      queries: [Query.equal("code", [normalizedCode]), Query.limit(1)],
    });
    const discountCode = codes.documents[0];

    if (
      !discountCode ||
      !discountCode.isActive ||
      (discountCode.expiresAt && new Date(discountCode.expiresAt) < new Date())
    ) {
      throw new Error("کد تخفیف معتبر نیست.");
    }

    await setOrderDiscount(databases, payload.orderId, {
      type: "code",
      codeId: discountCode.$id,
      percent: discountCode.percent,
    });
  } else if (payload.type === "manual") {
    await setOrderDiscount(databases, payload.orderId, {
      type: "manual",
      percent: payload.percent,
    });
  } else {
    await setOrderDiscount(databases, payload.orderId, { type: "none" });
  }

  revalidatePath("/admin/orders", "page");
  revalidatePath(`/admin/orders/${payload.orderId}`, "page");
}

export async function settleOrderAction(orderId: string) {
  const databases = getServerDatabases();
  await settleOrder(databases, orderId);
  revalidatePath("/admin/orders", "page");
  revalidatePath(`/admin/orders/${orderId}`, "page");
  revalidatePath("/admin/reports", "page");
}

export async function deleteOrderAction(orderId: string) {
  const databases = getServerDatabases();
  await deleteOrder(databases, orderId);
  revalidatePath("/admin/orders", "page");
  revalidatePath("/admin/tables", "page");
  revalidatePath("/admin/reports", "page");
}

export async function deleteOrderItemAction(itemId: string, orderId: string) {
  const databases = getServerDatabases();
  await databases.deleteDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.orderItems,
    documentId: itemId,
  });
  await recalcOrder(databases, orderId);
  revalidatePath(`/admin/orders/${orderId}`, "page");
  revalidatePath("/admin/orders", "page");
}

export async function updateOrderItemQuantity(
  itemId: string,
  orderId: string,
  quantity: number,
) {
  const safeQuantity = Math.max(1, Math.min(99, Math.round(quantity)));
  const databases = getServerDatabases();
  await databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.orderItems,
    documentId: itemId,
    data: { quantity: safeQuantity },
  });
  await recalcOrder(databases, orderId);
  revalidatePath(`/admin/orders/${orderId}`, "page");
  revalidatePath("/admin/orders", "page");
}

export async function addItemsToOrderAction(
  orderId: string,
  items: Array<{ menuItemId: string; quantity: number }>,
) {
  const databases = getServerDatabases();
  await addItemsToOrder(databases, orderId, items);
  revalidatePath(`/admin/orders/${orderId}`, "page");
  revalidatePath("/admin/orders", "page");
}

/** فچ مجدد سفارش‌ها بعد از رویداد Realtime */
export async function refreshOrders(status: "active" | "settled") {
  return getOrders(status);
}
