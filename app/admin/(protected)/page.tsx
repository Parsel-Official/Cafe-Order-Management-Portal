import Link from "next/link";
import { ArrowLeft, ClipboardList, Coffee, Table2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminMenu, getOrders, getTables } from "@/lib/appwrite/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [activeOrders, tables, menu] = await Promise.all([
    getOrders("active"),
    getTables(),
    getAdminMenu(),
  ]);

  const occupied = tables.filter((table) => table.status === "occupied").length;
  const activeItems = menu
    .flatMap((c) => c.items)
    .filter((i) => i.isActive && i.isAvailable).length;
  const activeTotal = activeOrders.reduce((sum, order) => sum + order.total, 0);

  const stats = [
    {
      title: "سفارش‌های فعال",
      value: activeOrders.length,
      icon: ClipboardList,
      href: "/admin/orders",
    },
    {
      title: "میزهای اشغال‌شده",
      value: `${occupied.toLocaleString("fa-IR")}/${tables.length.toLocaleString("fa-IR")}`,
      icon: Table2,
      href: "/admin/tables",
    },
    {
      title: "آیتم‌های فعال منو",
      value: activeItems.toLocaleString("fa-IR"),
      icon: Coffee,
      href: "/admin/menu",
    },
    {
      title: "مبلغ سفارش‌های فعال",
      value: `${activeTotal.toLocaleString("fa-IR")} تومان`,
      icon: ClipboardList,
      href: "/admin/orders",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-primary text-sm">Cafe Moon</p>
        <h1 className="mt-1 text-2xl font-bold">پنل صندوق‌دار</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:border-primary/40 transition-colors">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {stat.title}
                    </p>
                    <p className="mt-1 text-xl font-bold">{stat.value}</p>
                  </div>
                  <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                    <Icon size={22} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">سفارش‌های فعال اخیر</CardTitle>
          <Link
            href="/admin/orders"
            prefetch
            className="text-primary flex items-center gap-1 text-sm hover:underline"
          >
            مشاهده همه
            <ArrowLeft size={16} />
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeOrders.slice(0, 5).map((order) => (
            <Link
              key={order.$id}
              href={`/admin/orders/${order.$id}`}
              className="hover:bg-muted/60 flex items-center justify-between rounded-lg border p-3 transition-colors"
            >
              <span className="font-semibold">میز {order.tableNumber}</span>
              <span className="text-muted-foreground text-sm">
                {order.items
                  .reduce((sum, item) => sum + item.quantity, 0)
                  .toLocaleString("fa-IR")}{" "}
                قلم
              </span>
              <span className="font-bold">
                {order.total.toLocaleString("fa-IR")} تومان
              </span>
            </Link>
          ))}
          {activeOrders.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              فعلاً سفارش فعالی وجود ندارد.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {tables.map((table) => (
          <Badge
            key={table.$id}
            variant={table.status === "occupied" ? "default" : "secondary"}
          >
            میز {table.tableNumber}
          </Badge>
        ))}
      </div>
    </div>
  );
}
