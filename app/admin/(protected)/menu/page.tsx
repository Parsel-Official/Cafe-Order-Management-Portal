import { getAdminMenu } from "@/lib/appwrite/admin-data";
import { MenuManager } from "./menu-manager";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const menu = await getAdminMenu();
  return <MenuManager initialMenu={menu} />;
}
