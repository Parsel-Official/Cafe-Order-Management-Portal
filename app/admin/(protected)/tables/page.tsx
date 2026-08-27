import { getTables } from "@/lib/appwrite/admin-data";
import { TablesManager } from "./tables-manager";

export const dynamic = "force-dynamic";

export default async function AdminTablesPage() {
  const tables = await getTables();
  return <TablesManager initialTables={tables} />;
}
