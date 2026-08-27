export const appwriteConfig = {
  endpoint:
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId:
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  menuBucketId: process.env.APPWRITE_MENU_BUCKET_ID!,
  collections: {
    categories: "menuCategories",
    items: "menuItems",
    tables: "tables",
    orders: "orders",
    orderItems: "orderItems",
    discountCodes: "discountCodes",
  },
};

export function assertAppwriteServerConfig() {
  const missing = [
    ["APPWRITE_ENDPOINT", appwriteConfig.endpoint],
    ["APPWRITE_PROJECT_ID", appwriteConfig.projectId],
    ["APPWRITE_API_KEY", appwriteConfig.apiKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Appwrite config is incomplete: ${missing.join(", ")}`);
  }
}
