"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Check, QrCode, Table2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRealtime } from "@/hooks/use-realtime";
import type { Table } from "@/lib/types";
import { forceFreeTable, setTableActive } from "./actions";

function mergeTable(tables: Table[], incoming: Table): Table[] {
  const index = tables.findIndex((table) => table.$id === incoming.$id);
  if (index === -1) return [...tables, incoming];
  const next = [...tables];
  next[index] = { ...next[index], ...incoming };
  return next;
}

export function TablesManager({ initialTables }: { initialTables: Table[] }) {
  const router = useRouter();
  const [tables, setTables] = useState(initialTables);
  const [qrTable, setQrTable] = useState<Table | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // The server refresh provides the authoritative table snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTables(initialTables);
  }, [initialTables]);

  useRealtime("tables", [], ({ events, payload }) => {
    if (events.some((event) => event.endsWith(".*.delete"))) {
      setTables((current) => current.filter((t) => t.$id !== payload.$id));
      return;
    }
    setTables((current) => mergeTable(current, payload as unknown as Table));
  });

  const menuUrl = (table: Table) => {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://cafemoon.ir";
    return `${base}/orders/${table.token}`;
  };

  const run = (action: () => Promise<void>, successMessage: string) => {
    startTransition(async () => {
      try {
        await action();
        router.refresh();
        toast.success(successMessage);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "عملیات ناموفق بود.",
        );
      }
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مدیریت میزها</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          وضعیت میزها به‌صورت لحظه‌ای به‌روزرسانی می‌شود.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence initial={false}>
          {tables.map((table) => (
            <motion.div
              key={table.$id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={
                  table.isActive
                    ? table.status === "occupied"
                      ? "border-primary/50"
                      : ""
                    : "opacity-60"
                }
              >
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Table2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold">میز {table.tableNumber}</p>
                        <Badge
                          variant={
                            table.status === "occupied" ? "default" : "secondary"
                          }
                          className="mt-1"
                        >
                          {table.status === "occupied" ? "مشغول" : "خالی"}
                        </Badge>
                      </div>
                    </div>
                    <label className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                      فعال
                      <Switch
                        aria-label={`فعال بودن میز ${table.tableNumber}`}
                        checked={table.isActive}
                        onCheckedChange={(checked) => {
                          setTables((current) =>
                            mergeTable(current, {
                              ...table,
                              isActive: checked,
                            } as Table),
                          );
                          run(
                            () => setTableActive(table.$id, checked),
                            "وضعیت میز به‌روزرسانی شد.",
                          );
                        }}
                      />
                    </label>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setQrTable(table)}
                    >
                      <QrCode size={16} />
                      نمایش QR
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={table.status !== "occupied"}
                      onClick={() =>
                        run(
                          () => forceFreeTable({ tableId: table.$id }),
                          "میز آزاد شد.",
                        )
                      }
                    >
                      <Check size={16} />
                      آزادسازی
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Dialog open={!!qrTable} onOpenChange={(open) => !open && setQrTable(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>QR میز {qrTable?.tableNumber}</DialogTitle>
            <DialogDescription>
              این کد را چاپ کرده و روی میز قرار دهید.
            </DialogDescription>
          </DialogHeader>
          {qrTable && (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-xl border bg-white p-4">
                <QRCodeSVG value={menuUrl(qrTable)} size={220} />
              </div>
              <p dir="ltr" className="break-all text-xs text-muted-foreground">
                {menuUrl(qrTable)}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
