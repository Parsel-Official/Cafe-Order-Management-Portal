"use server";

import { ID } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { appwriteConfig } from "@/lib/appwrite/config";
import { getServerDatabases } from "@/lib/appwrite/server";

const discountCodeSchema = z.object({
  code: z.string().trim().min(2, "کد حداقل ۲ کاراکتر باشد.").max(32),
  percent: z.coerce.number().int().min(1).max(100),
});

export async function createDiscountCode(input: unknown) {
  const payload = discountCodeSchema.parse(input);
  const databases = getServerDatabases();

  await databases.createDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.discountCodes,
    documentId: ID.unique(),
    data: {
      code: payload.code.toUpperCase(),
      percent: payload.percent,
      isActive: true,
      expiresAt: "",
    },
  });

  revalidatePath("/admin/discounts", "page");
  revalidatePath("/admin/orders", "page");
  revalidatePath("/admin", "page");
}

export async function setDiscountCodeActive(id: string, isActive: boolean) {
  const databases = getServerDatabases();
  await databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.discountCodes,
    documentId: id,
    data: { isActive },
  });
  revalidatePath("/admin/discounts", "page");
  revalidatePath("/admin/orders", "page");
  revalidatePath("/admin", "page");
}

export async function deleteDiscountCode(id: string) {
  const databases = getServerDatabases();
  await databases.deleteDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.discountCodes,
    documentId: id,
  });
  revalidatePath("/admin/discounts", "page");
  revalidatePath("/admin/orders", "page");
  revalidatePath("/admin", "page");
}
