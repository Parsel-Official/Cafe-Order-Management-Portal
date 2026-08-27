import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client, Databases, Query, Storage, Users } from "node-appwrite";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");

function loadEnvFile(fileName) {
  const filePath = path.join(projectDirectory, fileName);
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/u)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/u);
    if (!match || match[1] in process.env) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadEnvFile(".env");

const COLLECTIONS = {
  menuCategories: "menuCategories",
  menuItems: "menuItems",
  tables: "tables",
  orders: "orders",
  orderItems: "orderItems",
  discountCodes: "discountCodes",
};

const env = (name, fallback) => {
  const value = process.env[name]?.trim();
  return value || fallback;
};

const requiredEnv = (name, fallback) => {
  const value = process.env[name]?.trim() || fallback?.trim();
  if (!value) {
    throw new Error(`متغیر محیطی ${name} تنظیم نشده است.`);
  }
  return value;
};

const isAlreadyExists = (error) =>
  error?.code === 409 ||
  /already exists|duplicate|already registered/i.test(error?.message ?? "");

const isNotFound = (error) => error?.code === 404;

const client = new Client()
  .setEndpoint(
    requiredEnv("APPWRITE_ENDPOINT", process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT),
  )
  .setProject(
    requiredEnv(
      "APPWRITE_PROJECT_ID",
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    ),
  )
  .setKey(requiredEnv("APPWRITE_API_KEY"));

const databaseId = env("APPWRITE_DATABASE_ID", "cafe-moon");
const bucketId = env("APPWRITE_MENU_BUCKET_ID", "menu-images");
const databaseName = env("APPWRITE_DATABASE_NAME", "Cafe Moon");
const tableCount = Number.parseInt(env("APPWRITE_TABLE_COUNT", "14"), 10);

const databases = new Databases(client);
const storage = new Storage(client);
const users = new Users(client);

async function ensureDatabase() {
  try {
    const database = await databases.get({ databaseId });
    console.log(`✓ دیتابیس موجود است: ${database.name} (${databaseId})`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    const database = await databases.create({
      databaseId,
      name: databaseName,
      enabled: true,
    });
    console.log(`✓ دیتابیس ساخته شد: ${database.name} (${databaseId})`);
  }
}

async function ensureCollection(collectionId, name) {
  try {
    const collection = await databases.getCollection({
      databaseId,
      collectionId,
    });
    console.log(`  ✓ collection موجود است: ${collection.name}`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    const collection = await databases.createCollection({
      databaseId,
      collectionId,
      name,
      permissions: ["read(\"any\")"],
      documentSecurity: false,
      enabled: true,
    });
    console.log(`  ✓ collection ساخته شد: ${collection.name}`);
  }
}

async function existingAttributes(collectionId) {
  const result = await databases.listAttributes({
    databaseId,
    collectionId,
    queries: [Query.limit(100)],
  });
  return new Set(result.attributes.map((attribute) => attribute.key));
}

async function ensureAttribute(collectionId, key, create) {
  const attributes = await existingAttributes(collectionId);
  if (attributes.has(key)) return;

  try {
    await create();
    console.log(`    ✓ فیلد ساخته شد: ${collectionId}.${key}`);
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
  }
}

async function stringAttribute(collectionId, key, size, required, options = {}) {
  await ensureAttribute(collectionId, key, () =>
    databases.createStringAttribute({
      databaseId,
      collectionId,
      key,
      size,
      required,
      ...options,
    }),
  );
}

async function integerAttribute(collectionId, key, required, options = {}) {
  await ensureAttribute(collectionId, key, () =>
    databases.createIntegerAttribute({
      databaseId,
      collectionId,
      key,
      required,
      ...options,
    }),
  );
}

async function floatAttribute(collectionId, key, required, options = {}) {
  await ensureAttribute(collectionId, key, () =>
    databases.createFloatAttribute({
      databaseId,
      collectionId,
      key,
      required,
      ...options,
    }),
  );
}

async function booleanAttribute(collectionId, key, required, options = {}) {
  await ensureAttribute(collectionId, key, () =>
    databases.createBooleanAttribute({
      databaseId,
      collectionId,
      key,
      required,
      ...options,
    }),
  );
}

async function datetimeAttribute(collectionId, key, required) {
  await ensureAttribute(collectionId, key, () =>
    databases.createDatetimeAttribute({
      databaseId,
      collectionId,
      key,
      required,
    }),
  );
}

async function relationAttribute(
  collectionId,
  key,
  relatedCollectionId,
  type = "manyToOne",
  onDelete = "restrict",
) {
  await ensureAttribute(collectionId, key, () =>
    databases.createRelationshipAttribute({
      databaseId,
      collectionId,
      relatedCollectionId,
      type,
      twoWay: false,
      key,
      onDelete,
    }),
  );
}

async function ensureIndex(collectionId, key, type, attributes, orders) {
  const indexes = await databases.listIndexes({
    databaseId,
    collectionId,
    queries: [Query.limit(100)],
  });
  if (indexes.indexes.some((index) => index.key === key)) return;

  try {
    await databases.createIndex({
      databaseId,
      collectionId,
      key,
      type,
      attributes,
      ...(orders ? { orders } : {}),
    });
    console.log(`    ✓ index ساخته شد: ${collectionId}.${key}`);
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
  }
}

async function ensureSchema() {
  const definitions = [
    [COLLECTIONS.menuCategories, "دسته‌بندی‌های منو"],
    [COLLECTIONS.menuItems, "آیتم‌های منو"],
    [COLLECTIONS.tables, "میزها"],
    [COLLECTIONS.orders, "سفارش‌ها"],
    [COLLECTIONS.orderItems, "اقلام سفارش"],
    [COLLECTIONS.discountCodes, "کدهای تخفیف"],
  ];

  for (const [collectionId, name] of definitions) {
    await ensureCollection(collectionId, name);
  }

  await stringAttribute(COLLECTIONS.menuCategories, "name", 128, true);
  await integerAttribute(COLLECTIONS.menuCategories, "order", true, {
    min: 0,
  });
  await booleanAttribute(COLLECTIONS.menuCategories, "isActive", true);

  await stringAttribute(COLLECTIONS.menuItems, "name", 128, true);
  await stringAttribute(COLLECTIONS.menuItems, "description", 2000, false);
  await integerAttribute(COLLECTIONS.menuItems, "price", true, { min: 0 });
  await relationAttribute(
    COLLECTIONS.menuItems,
    "categoryId",
    COLLECTIONS.menuCategories,
  );
  await stringAttribute(COLLECTIONS.menuItems, "imageUrl", 2048, false);
  await booleanAttribute(COLLECTIONS.menuItems, "isAvailable", true);
  await booleanAttribute(COLLECTIONS.menuItems, "isActive", true);

  await stringAttribute(COLLECTIONS.tables, "tableNumber", 32, true);
  await stringAttribute(COLLECTIONS.tables, "token", 128, true);
  await booleanAttribute(COLLECTIONS.tables, "isActive", true);
  await stringAttribute(COLLECTIONS.tables, "status", 16, true);

  await relationAttribute(
    COLLECTIONS.orders,
    "tableId",
    COLLECTIONS.tables,
  );
  await stringAttribute(COLLECTIONS.orders, "status", 16, true);
  await stringAttribute(COLLECTIONS.orders, "discountType", 16, true);
  await relationAttribute(
    COLLECTIONS.orders,
    "discountCodeId",
    COLLECTIONS.discountCodes,
    "manyToOne",
    "setNull",
  );
  await floatAttribute(COLLECTIONS.orders, "discountPercent", false, {
    min: 0,
    max: 100,
  });
  await integerAttribute(COLLECTIONS.orders, "discountAmount", false, {
    min: 0,
  });
  await integerAttribute(COLLECTIONS.orders, "subtotal", true, { min: 0 });
  await integerAttribute(COLLECTIONS.orders, "taxAmount", true, { min: 0 });
  await integerAttribute(COLLECTIONS.orders, "total", true, { min: 0 });
  await datetimeAttribute(COLLECTIONS.orders, "createdAt", true);
  await datetimeAttribute(COLLECTIONS.orders, "settledAt", false);

  await relationAttribute(
    COLLECTIONS.orderItems,
    "orderId",
    COLLECTIONS.orders,
  );
  await relationAttribute(
    COLLECTIONS.orderItems,
    "menuItemId",
    COLLECTIONS.menuItems,
  );
  await integerAttribute(COLLECTIONS.orderItems, "quantity", true, {
    min: 1,
  });
  await integerAttribute(COLLECTIONS.orderItems, "unitPrice", true, {
    min: 0,
  });

  await stringAttribute(COLLECTIONS.discountCodes, "code", 64, true);
  await floatAttribute(COLLECTIONS.discountCodes, "percent", true, {
    min: 0,
    max: 100,
  });
  await booleanAttribute(COLLECTIONS.discountCodes, "isActive", true);
  await datetimeAttribute(COLLECTIONS.discountCodes, "expiresAt", false);

  await ensureIndex(COLLECTIONS.menuCategories, "order_index", "key", [
    "order",
  ]);
  await ensureIndex(COLLECTIONS.tables, "token_unique", "unique", ["token"]);
  await ensureIndex(COLLECTIONS.tables, "status_index", "key", ["status"]);
  await ensureIndex(COLLECTIONS.orders, "status_created_index", "key", [
    "status",
    "createdAt",
  ]);
  await ensureIndex(COLLECTIONS.discountCodes, "code_unique", "unique", [
    "code",
  ]);
}

async function ensureBucket() {
  try {
    const bucket = await storage.getBucket({ bucketId });
    console.log(`✓ bucket موجود است: ${bucket.name} (${bucketId})`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    const bucket = await storage.createBucket({
      bucketId,
      name: "تصاویر منو",
      permissions: ["read(\"any\")"],
      fileSecurity: false,
      enabled: true,
      maximumFileSize: 10 * 1024 * 1024,
      allowedFileExtensions: ["jpg", "jpeg", "png", "webp", "avif"],
    });
    console.log(`✓ bucket ساخته شد: ${bucket.name} (${bucketId})`);
  }
}

function createTableToken() {
  return crypto.randomBytes(32).toString("base64url");
}

async function ensureTables() {
  if (!Number.isInteger(tableCount) || tableCount < 1 || tableCount > 100) {
    throw new Error("APPWRITE_TABLE_COUNT باید عددی بین ۱ تا ۱۰۰ باشد.");
  }

  for (let tableIndex = 1; tableIndex <= tableCount; tableIndex += 1) {
    const tableNumber = String(tableIndex);
    const existing = await databases.listDocuments({
      databaseId,
      collectionId: COLLECTIONS.tables,
      queries: [Query.equal("tableNumber", [tableNumber]), Query.limit(1)],
    });

    if (existing.documents.length > 0) {
      continue;
    }

    await databases.createDocument({
      databaseId,
      collectionId: COLLECTIONS.tables,
      documentId: `table-${String(tableIndex).padStart(2, "0")}`,
      data: {
        tableNumber,
        token: createTableToken(),
        isActive: true,
        status: "empty",
      },
    });
    console.log(`  ✓ میز ${tableNumber} seed شد`);
  }
}

async function ensureAdminUser() {
  const email = requiredEnv("APPWRITE_ADMIN_EMAIL");
  const password = requiredEnv("APPWRITE_ADMIN_PASSWORD");
  const name = env("APPWRITE_ADMIN_NAME", "مدیر کافه");
  const userId = env("APPWRITE_ADMIN_USER_ID", "cafe-admin");

  try {
    const user = await users.get({ userId });
    console.log(`✓ کاربر ادمین موجود است: ${user.email}`);
    return;
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }

  try {
    const user = await users.create({
      userId,
      email,
      password,
      name,
    });
    console.log(`✓ کاربر ادمین ساخته شد: ${user.email}`);
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
    const result = await users.list({
      queries: [Query.equal("email", [email]), Query.limit(1)],
    });
    if (result.users.length === 0) throw error;
    console.log(`✓ کاربر ادمین از قبل موجود است: ${email}`);
  }
}

async function main() {
  console.log("شروع راه‌اندازی Appwrite برای Cafe Moon...");
  await ensureDatabase();
  await ensureSchema();
  await ensureTables();
  await ensureBucket();
  await ensureAdminUser();
  console.log("راه‌اندازی Appwrite با موفقیت انجام شد.");
}

main().catch((error) => {
  console.error("✗ راه‌اندازی Appwrite ناموفق بود.");
  console.error(error?.message ?? error);
  process.exitCode = 1;
});
