"use client";

import type { OrderWithItems } from "@/lib/types";
import { formatDateTime, formatToman } from "@/lib/format";
import { Separator } from "@/components/ui/separator";

/**
 * فاکتور قابل چاپ — با window.print و کلاس print-area در globals.css.
 */
export function Invoice({
  order,
  tableNumber,
}: {
  order: OrderWithItems;
  tableNumber: string;
}) {
  const discountPercent =
    order.discountType === "none" ? 0 : order.discountPercent ?? 0;

  return (
    <div className="print-area mx-auto w-full max-w-sm bg-background p-4 text-foreground">
      <div className="text-center">
        <h2 className="text-lg font-bold">کافه مون</h2>
        <p className="mt-1 text-xs text-muted-foreground">فاکتور سفارش</p>
        <Separator className="my-3" />
        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
          <span>میز: {tableNumber}</span>
          <span>شماره: {order.$id.slice(-8)}</span>
          <span>تاریخ: {order.createdAt ? formatDateTime(order.createdAt) : "-"}</span>
          {order.settledAt && (
            <span>تسویه: {formatDateTime(order.settledAt)}</span>
          )}
        </div>
      </div>

      <table className="mt-4 w-full text-xs">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="py-1 text-right font-medium">آیتم</th>
            <th className="py-1 text-center font-medium">تعداد</th>
            <th className="py-1 text-center font-medium">قیمت واحد</th>
            <th className="py-1 text-left font-medium">جمع</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.$id} className="border-b border-dashed">
              <td className="py-1.5 text-right">{item.name ?? "آیتم"}</td>
              <td className="py-1.5 text-center">
                {item.quantity.toLocaleString("fa-IR")}
              </td>
              <td className="py-1.5 text-center">
                {item.unitPrice.toLocaleString("fa-IR")}
              </td>
              <td className="py-1.5 text-left">
                {(item.unitPrice * item.quantity).toLocaleString("fa-IR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 space-y-1.5 text-xs">
        <Row label="جمع اقلام" value={formatToman(order.subtotal)} />
        {discountPercent > 0 && (
          <Row
            label={`تخفیف (${discountPercent.toLocaleString("fa-IR")}٪${
              order.discountType === "code" ? " — کد" : ""
            })`}
            value={`- ${formatToman(order.discountAmount ?? 0)}`}
          />
        )}
        <Row label="مالیات (۱۰٪)" value={formatToman(order.taxAmount)} />
        <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm font-bold">
          <span>مبلغ نهایی</span>
          <span>{formatToman(order.total)}</span>
        </div>
      </div>

      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        از انتخاب شما سپاسگزاریم ☾ Cafe Moon
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
