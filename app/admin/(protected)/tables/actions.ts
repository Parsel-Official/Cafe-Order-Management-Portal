"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, getServerDatabases } from "@/lib/appwrite/server";

export async function setTableActive(id: string, isActive: boolean) {
  const databases = getServerDatabases();
  await databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.tables,
    documentId: id,
    data: { isActive },
  });
  revalidatePath("/admin/tables", "page");
  revalidatePath("/admin", "page");
}

const freeTableSchema = z.object({ tableId: z.string().min(1) });

/**
 * آزادسازی دستی میز: سفارش active آن تسویه می‌شود.
 */
export async function forceFreeTable(input: unknown) {
  const { tableId } = freeTableSchema.parse(input);
  const databases = getServerDatabases();

  const orders = await databases.listDocuments({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.orders,
    queries: [
      Query.equal("tableId", [tableId]),
      Query.equal("status", ["active"]),
      Query.limit(1),
    ],
  });

  if (orders.documents[0]) {
    await databases.updateDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.orders,
      documentId: orders.documents[0].$id,
      data: { status: "settled", settledAt: new Date().toISOString() },
    });
  }

  await databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.tables,
    documentId: tableId,
    data: { status: "empty" },
  });

  revalidatePath("/admin/tables", "page");
  revalidatePath("/admin/orders", "page");
  revalidatePath("/admin/reports", "page");
  revalidatePath("/admin", "page");
}
