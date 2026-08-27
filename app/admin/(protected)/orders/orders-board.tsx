"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Printer, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useRealtime } from "@/hooks/use-realtime";
import { Invoice } from "@/components/invoice";
import { formatTime, formatToman } from "@/lib/format";
import type { OrderWithItems } from "@/lib/types";
import {
  deleteOrderAction,
  refreshOrders,
  settleOrderAction,
} from "./actions";
import { toast } from "sonner";

export function OrdersBoard({
  initialActive,
  initialSettled,
}: {
  initialActive: OrderWithItems[];
  initialSettled: OrderWithItems[];
}) {
  const router = useRouter();
  const [activeOrders, setActiveOrders] = useState(initialActive);
  const [settledOrders, setSettledOrders] = useState(initialSettled);
  const [invoiceOrder, setInvoiceOrder] = useState<OrderWithItems | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Keep client state aligned with server data after router.refresh().
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveOrders(initialActive);
    setSettledOrders(initialSettled);
  }, [initialActive, initialSettled]);

  // بعد از هر رویداد Realtime، سفارش‌ها از سرور فچ مجدد می‌شوند
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const [active, settled] = await Promise.all([
            refreshOrders("active"),
            refreshOrders("settled"),
          ]);
          setActiveOrders(active);
          setSettledOrders(settled);
        } catch {
          toast.error("به‌روزرسانی سفارش‌ها انجام نشد.");
        }
      });
    }, 400);
  }, []);

  useRealtime("orders", [], scheduleRefresh);
  useRealtime("orderItems", [], scheduleRefresh);

  const settle = (orderId: string) => {
    startTransition(async () => {
      try {
        await settleOrderAction(orderId);
        router.refresh();
        toast.success( "سفارش تسویه شد.");
      } catch {
        toast.error( "تسویه ناموفق بود.");
      }
    });
  };

  const remove = (orderId: string) => {
    startTransition(async () => {
      try {
        await deleteOrderAction(orderId);
        router.refresh();
        toast.success( "سفارش حذف شد.");
      } catch {
        toast.error( "حذف ناموفق بود.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">سفارش‌ها</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          سفارش‌های فعال به‌صورت لحظه‌ای به‌روزرسانی می‌شوند.
        </p>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            فعال ({activeOrders.length.toLocaleString("fa-IR")})
          </TabsTrigger>
          <TabsTrigger value="settled">
            تسویه‌شده امروز ({settledOrders.length.toLocaleString("fa-IR")})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-3">
          <AnimatePresence initial={false}>
            {activeOrders.map((order) => (
              <motion.div
                key={order.$id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
              >
                <OrderCard
                  order={order}
                  actions={
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          <Link href={`/admin/orders/${order.$id}`} />
                        }
                      >
                        مدیریت
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="چاپ فاکتور"
                        onClick={() => setInvoiceOrder(order)}
                      >
                        <Printer size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        aria-label="حذف سفارش"
                        onClick={() => remove(order.$id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                      <Button size="sm" onClick={() => settle(order.$id)}>
                        تسویه
                      </Button>
                    </>
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {activeOrders.length === 0 && (
            <EmptyOrders text="فعلاً سفارش فعالی وجود ندارد." />
          )}
        </TabsContent>

        <TabsContent value="settled" className="mt-4 space-y-3">
          {settledOrders.map((order) => (
            <OrderCard
              key={order.$id}
              order={order}
              actions={
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInvoiceOrder(order)}
                  >
                    <Printer size={16} />
                    فاکتور
                  </Button>
                </>
              }
            />
          ))}
          {settledOrders.length === 0 && (
            <EmptyOrders text="امروز سفارش تسویه‌شده‌ای نیست." />
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!invoiceOrder}
        onOpenChange={(open) => !open && setInvoiceOrder(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="print:hidden">
            <DialogTitle>فاکتور</DialogTitle>
          </DialogHeader>
          {invoiceOrder && (
            <>
              <Invoice order={invoiceOrder} tableNumber={invoiceOrder.tableNumber} />
              <div className="print:hidden">
                <Button className="w-full" onClick={() => window.print()}>
                  <Printer size={16} />
                  چاپ فاکتور
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyOrders({ text }: { text: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>بدون سفارش</EmptyTitle>
        <EmptyDescription>{text}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function OrderCard({
  order,
  actions,
}: {
  order: OrderWithItems;
  actions: React.ReactNode;
}) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList size={18} />
          </div>
          <div>
            <p className="flex items-center gap-2 font-bold">
              میز {order.tableNumber}
              <Badge
                variant={order.status === "active" ? "default" : "secondary"}
              >
                {order.status === "active" ? "فعال" : "تسویه‌شده"}
              </Badge>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTime(order.createdAt)} —{" "}
              {itemCount.toLocaleString("fa-IR")} قلم
              {order.discountType !== "none" &&
                ` — تخفیف ${(order.discountPercent ?? 0).toLocaleString("fa-IR")}٪`}
            </p>
          </div>
        </div>
        <p className="font-bold">{formatToman(order.total)}</p>
        <div className="flex items-center gap-1">{actions}</div>
      </CardContent>
    </Card>
  );
}
