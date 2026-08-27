import { notFound } from "next/navigation";
import { getAdminMenu, getOrderDetail } from "@/lib/appwrite/admin-data";
import { OrderDetail } from "./order-detail";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const [order, menu] = await Promise.all([
    getOrderDetail(orderId),
    getAdminMenu(),
  ]);
  if (!order) notFound();

  return (
    <OrderDetail
      initialOrder={order}
      menu={menu.map((category) => ({
        $id: category.$id,
        name: category.name,
        items: category.items
          .filter((item) => item.isActive)
          .map((item) => ({
            $id: item.$id,
            name: item.name,
            price: item.price,
          })),
      }))}
    />
  );
}
