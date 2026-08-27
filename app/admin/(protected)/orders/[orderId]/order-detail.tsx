"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Percent, Plus, Printer, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRealtime } from "@/hooks/use-realtime";
import { Invoice } from "@/components/invoice";
import { formatToman } from "@/lib/format";
import type { OrderWithItems } from "@/lib/types";
import {
  addItemsToOrderAction,
  applyDiscount,
  deleteOrderItemAction,
  settleOrderAction,
  updateOrderItemQuantity,
} from "../actions";

type MenuForPicker = Array<{
  $id: string;
  name: string;
  items: Array<{ $id: string; name: string; price: number }>;
}>;

export function OrderDetail({
  initialOrder,
  menu,
}: {
  initialOrder: OrderWithItems;
  menu: MenuForPicker;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [addDialog, setAddDialog] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Keep client state aligned with server data after router.refresh().
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(initialOrder);
  }, [initialOrder]);

  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => {
      import("../actions").then(async ({ refreshOrders }) => {
        const orders = await refreshOrders(
          order.status as "active" | "settled",
        );
        const fresh = orders.find((item) => item.$id === order.$id);
        if (fresh) setOrder(fresh);
      });
    }, 400);
  }, [order.$id, order.status]);

  useRealtime("orderItems", [`orderId=${order.$id}`], () => refetch());
  useRealtime("orders", [`$id=${order.$id}`], () => refetch());

  const run = (action: () => Promise<void>, successMessage?: string) => {
    startTransition(async () => {
      try {
        await action();
        router.refresh();
        if (successMessage) toast.success(successMessage);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "عملیات ناموفق بود.",
        );
      }
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href="/admin/orders" aria-label="بازگشت" />}
          >
            <ArrowRight size={18} />
          </Button>
          <div>
            <h1 className="text-xl font-bold">سفارش میز {order.tableNumber}</h1>
            <p className="text-muted-foreground text-sm">
              وضعیت: {order.status === "active" ? "فعال" : "تسویه‌شده"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setInvoiceOpen(true)}>
            <Printer size={16} />
            چاپ فاکتور
          </Button>
          {order.status === "active" && (
            <Button
              onClick={() =>
                run(() => settleOrderAction(order.$id), "سفارش تسویه شد.")
              }
            >
              تسویه سفارش
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">اقلام سفارش</CardTitle>
            {order.status === "active" && (
              <Button size="sm" onClick={() => setAddDialog(true)}>
                <Plus size={16} />
                افزودن آیتم
              </Button>
            )}
          </CardHeader>
          <CardContent className="divide-y">
            <AnimatePresence initial={false}>
              {order.items.map((item) => (
                <motion.div
                  key={item.$id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {item.name ?? "آیتم"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {item.unitPrice.toLocaleString("fa-IR")} تومان
                    </p>
                  </div>
                  {order.status === "active" ? (
                    <Input
                      aria-label={`تعداد ${item.name}`}
                      className="h-9 w-14 text-center"
                      inputMode="numeric"
                      defaultValue={item.quantity}
                      key={`${item.$id}-${item.quantity}`}
                      onBlur={(event) => {
                        const quantity = Number.parseInt(
                          event.target.value,
                          10,
                        );
                        if (
                          Number.isFinite(quantity) &&
                          quantity !== item.quantity
                        ) {
                          run(() =>
                            updateOrderItemQuantity(
                              item.$id,
                              order.$id,
                              quantity,
                            ),
                          );
                        }
                      }}
                    />
                  ) : (
                    <span>×{item.quantity.toLocaleString("fa-IR")}</span>
                  )}
                  <span className="w-28 text-left font-semibold">
                    {(item.unitPrice * item.quantity).toLocaleString("fa-IR")}
                  </span>
                  {order.status === "active" && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`حذف ${item.name}`}
                      onClick={() =>
                        run(() => deleteOrderItemAction(item.$id, order.$id))
                      }
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {order.items.length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                این سفارش آیتمی ندارد.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <DiscountCard order={order} run={run} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">صورت‌حساب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="جمع اقلام" value={formatToman(order.subtotal)} />
              {order.discountType !== "none" && (
                <Row
                  label={`تخفیف (${(order.discountPercent ?? 0).toLocaleString("fa-IR")}٪)`}
                  value={`- ${formatToman(order.discountAmount ?? 0)}`}
                />
              )}
              <Row label="مالیات (۱۰٪)" value={formatToman(order.taxAmount)} />
              <div className="flex items-center justify-between border-t pt-2 font-bold">
                <span>مبلغ نهایی</span>
                <span>{formatToman(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddItemsDialog
        open={addDialog}
        menu={menu}
        onClose={() => setAddDialog(false)}
        onSubmit={(items) =>
          run(async () => {
            await addItemsToOrderAction(order.$id, items);
            setAddDialog(false);
          })
        }
      />

      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="print:hidden">
            <DialogTitle>فاکتور</DialogTitle>
          </DialogHeader>
          <Invoice order={order} tableNumber={order.tableNumber} />
          <div className="print:hidden">
            <Button className="w-full" onClick={() => window.print()}>
              <Printer size={16} />
              چاپ فاکتور
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-muted-foreground flex items-center justify-between">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function DiscountCard({
  order,
  run,
}: {
  order: OrderWithItems;
  run: (action: () => Promise<void>, message?: string) => void;
}) {
  const [mode, setMode] = useState<"none" | "code" | "manual">(
    order.discountType,
  );
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Percent size={16} />
          تخفیف
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as typeof mode)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="none" className="flex-1">
              بدون تخفیف
            </TabsTrigger>
            <TabsTrigger value="code" className="flex-1">
              کد
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1">
              دستی
            </TabsTrigger>
          </TabsList>
          <TabsContent value="code" className="mt-3 space-y-2">
            <Label htmlFor="discount-code">کد تخفیف</Label>
            <Input
              id="discount-code"
              dir="ltr"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
            <Button
              size="sm"
              className="w-full"
              disabled={!code.trim()}
              onClick={() =>
                run(async () => {
                  await applyDiscount({
                    type: "code",
                    orderId: order.$id,
                    code: code.trim(),
                  });
                }, "کد تخفیف اعمال شد.")
              }
            >
              اعمال کد
            </Button>
          </TabsContent>
          <TabsContent value="manual" className="mt-3 space-y-2">
            <Label htmlFor="discount-percent">درصد تخفیف</Label>
            <Input
              id="discount-percent"
              dir="ltr"
              className="text-left"
              inputMode="numeric"
              placeholder="0"
              value={percent}
              onChange={(event) =>
                setPercent(
                  event.target.value
                    .replace(/[۰-۹]/gu, (digit) =>
                      String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)),
                    )
                    .replace(/[٠-٩]/gu, (digit) =>
                      String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)),
                    )
                    .replace(/[^\d]/g, "")
                    .slice(0, 3),
                )
              }
            />
            <Button
              size="sm"
              className="w-full"
              disabled={!percent}
              onClick={() =>
                run(async () => {
                  await applyDiscount({
                    type: "manual",
                    orderId: order.$id,
                    percent: Number.parseInt(percent, 10),
                  });
                }, "تخفیف دستی اعمال شد.")
              }
            >
              اعمال درصد
            </Button>
          </TabsContent>
        </Tabs>
        {order.discountType !== "none" && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() =>
              run(async () => {
                await applyDiscount({ type: "none", orderId: order.$id });
                setCode("");
                setPercent("");
              }, "تخفیف حذف شد.")
            }
          >
            <X size={16} />
            حذف تخفیف
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function AddItemsDialog({
  open,
  menu,
  onClose,
  onSubmit,
}: {
  open: boolean;
  menu: MenuForPicker;
  onClose: () => void;
  onSubmit: (items: Array<{ menuItemId: string; quantity: number }>) => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const selectedCategory =
    menu.find((category) => category.$id === categoryId) ?? null;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>افزودن آیتم به سفارش</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select
            value={categoryId}
            onValueChange={(value) => {
              setCategoryId(value ?? "");
              setItemId("");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="دسته‌بندی" />
            </SelectTrigger>
            <SelectContent>
              {menu.map((category) => (
                <SelectItem key={category.$id} value={category.$id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={itemId}
            onValueChange={(value) => setItemId(value ?? "")}
            disabled={!selectedCategory}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="آیتم" />
            </SelectTrigger>
            <SelectContent>
              {selectedCategory?.items.map((item) => (
                <SelectItem key={item.$id} value={item.$id}>
                  {item.name} — {item.price.toLocaleString("fa-IR")} تومان
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            inputMode="numeric"
            placeholder="تعداد"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button
            disabled={!itemId || !quantity}
            onClick={() =>
              onSubmit([
                { menuItemId: itemId, quantity: Number(quantity) || 1 },
              ])
            }
          >
            افزودن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
