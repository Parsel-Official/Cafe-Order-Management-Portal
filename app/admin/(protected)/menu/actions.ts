"use server";

import { ID, Storage } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { appwriteConfig } from "@/lib/appwrite/config";
import { getAppwriteServerClient, getServerDatabases } from "@/lib/appwrite/server";
import { createAppwriteFileUrl } from "@/lib/appwrite/image-url";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // هماهنگ با maximumFileSize در setup:appwrite

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/**
 * آپلود تصویر آیتم منو در bucket استوریج اپ‌رایت.
 * bucket با دسترسی read("any") توسط scripts/setup-appwrite.mjs ساخته می‌شود،
 * پس URL حاصل مستقیماً قابل نمایش عمومی است.
 */
export async function uploadMenuItemImage(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("فایلی برای آپلود انتخاب نشده است.");
  }
  if (file.size === 0) {
    throw new Error("فایل خالی است.");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("حجم تصویر باید کمتر از ۱۰ مگابایت باشد.");
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("فرمت تصویر باید JPG، PNG، WebP یا AVIF باشد.");
  }

  const storage = new Storage(getAppwriteServerClient());
  const uploaded = await storage.createFile({
    bucketId: appwriteConfig.menuBucketId,
    fileId: ID.unique(),
    file,
  });

  const url = createAppwriteFileUrl(
    appwriteConfig.endpoint,
    appwriteConfig.menuBucketId,
    uploaded.$id,
  );
  url.searchParams.set("project", appwriteConfig.projectId);

  return { imageUrl: url.toString() };
}

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "نام دسته الزامی است."),
  order: z.coerce.number().int().min(0),
});

const itemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "نام آیتم الزامی است."),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z.coerce.number().int().min(0, "قیمت معتبر نیست."),
  categoryId: z.string().min(1, "دسته‌بندی را انتخاب کنید."),
  imageUrl: z.string().trim().url("آدرس تصویر معتبر نیست.").optional().or(z.literal("")),
  isAvailable: z.coerce.boolean().default(true),
  isActive: z.coerce.boolean().default(true),
});

export async function saveCategory(input: unknown) {
  const payload = categorySchema.parse(input);
  const databases = getServerDatabases();
  const data = { name: payload.name, order: payload.order, isActive: true };

  if (payload.id) {
    await databases.updateDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.categories,
      documentId: payload.id,
      data,
    });
  } else {
    await databases.createDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.categories,
      documentId: ID.unique(),
      data,
    });
  }

  revalidatePath("/admin/menu", "page");
}

export async function setCategoryActive(id: string, isActive: boolean) {
  const databases = getServerDatabases();
  await databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.categories,
    documentId: id,
    data: { isActive },
  });
  revalidatePath("/admin/menu", "page");
}

export async function saveItem(input: unknown) {
  const payload = itemSchema.parse(input);
  const databases = getServerDatabases();
  const data = {
    name: payload.name,
    description: payload.description || "",
    price: payload.price,
    categoryId: payload.categoryId,
    imageUrl: payload.imageUrl || "",
    isAvailable: payload.isAvailable,
    isActive: payload.isActive,
  };

  if (payload.id) {
    await databases.updateDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.items,
      documentId: payload.id,
      data,
    });
  } else {
    await databases.createDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.collections.items,
      documentId: ID.unique(),
      data,
    });
  }

  revalidatePath("/admin/menu", "page");
  revalidatePath("/admin/orders", "page");
  revalidatePath("/admin", "page");
}

export async function setItemFlags(
  id: string,
  flags: { isAvailable?: boolean; isActive?: boolean },
) {
  const databases = getServerDatabases();
  await databases.updateDocument({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.collections.items,
    documentId: id,
    data: flags,
  });
  revalidatePath("/admin/menu", "page");
  revalidatePath("/admin", "page");
}
