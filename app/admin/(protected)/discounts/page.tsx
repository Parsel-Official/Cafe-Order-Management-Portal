import { getDiscountCodes } from "@/lib/appwrite/admin-data";
import { DiscountsManager } from "./discounts-manager";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  const codes = await getDiscountCodes();
  return <DiscountsManager initialCodes={codes} />;
}
