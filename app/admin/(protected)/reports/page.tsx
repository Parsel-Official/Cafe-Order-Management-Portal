import { getOrders } from "@/lib/appwrite/admin-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { formatTime, formatToman } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const orders = await getOrders("settled", true);
  const total = orders.reduce((sum, order) => sum + order.total, 0);
  const totalDiscounts = orders.reduce(
    (sum, order) => sum + (order.discountAmount ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">گزارش فروش امروز</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          سفارش‌های تسویه‌شده امروز.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="تعداد سفارش" value={orders.length.toLocaleString("fa-IR")} />
        <StatCard
          title="مجموع تخفیف"
          value={formatToman(totalDiscounts)}
        />
        <StatCard title="جمع کل فروش" value={formatToman(total)} highlight />
      </div>

      {orders.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>امروز فروشی ثبت نشده</EmptyTitle>
            <EmptyDescription>
              پس از تسویه اولین سفارش، اینجا نمایش داده می‌شود.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">سفارش‌های تسویه‌شده امروز</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {orders.map((order) => (
              <div
                key={order.$id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">میز {order.tableNumber}</span>
                  <Badge variant="secondary">{formatTime(order.settledAt || order.createdAt)}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString("fa-IR")} قلم
                  </span>
                </div>
                <span className="font-bold">
                  {formatToman(order.total)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  highlight = false,
}: {
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/40" : ""}>
      <CardContent>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`mt-1 font-bold ${highlight ? "text-xl text-primary" : "text-lg"}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
