import { getOrders } from "@/lib/appwrite/admin-data";
import { OrdersBoard } from "./orders-board";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const [activeOrders, settledOrders] = await Promise.all([
    getOrders("active"),
    getOrders("settled", true),
  ]);
  return (
    <OrdersBoard
      initialActive={activeOrders}
      initialSettled={settledOrders}
    />
  );
}
