"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { toast } from "sonner";
import type { DiscountCode } from "@/lib/types";
import {
  createDiscountCode,
  deleteDiscountCode,
  setDiscountCodeActive,
} from "./actions";

export function DiscountsManager({
  initialCodes,
}: {
  initialCodes: DiscountCode[];
}) {
  const router = useRouter();
  const [codes, setCodes] = useState(initialCodes);
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // The server refresh provides the authoritative discount-code snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCodes(initialCodes);
  }, [initialCodes]);

  const run = (
    action: () => Promise<void>,
    successMessage: string,
    rollback?: () => void,
  ) => {
    startTransition(async () => {
      try {
        await action();
        router.refresh();
        toast.success(successMessage);
      } catch (error) {
        rollback?.();
        toast.error(
          error instanceof Error ? error.message : "عملیات ناموفق بود.",
        );
      }
    });
  };

  const submit = () => {
    const numericPercent = Number(percent);
    run(
      async () => {
        await createDiscountCode({ code, percent: numericPercent });
        setCode("");
        setPercent("");
      },
      "کد تخفیف ساخته شد.",
    );
  };

  const toggleCode = (discountCode: DiscountCode, checked: boolean) => {
    setCodes((current) =>
      current.map((currentCode) =>
        currentCode.$id === discountCode.$id
          ? { ...currentCode, isActive: checked }
          : currentCode,
      ),
    );
    run(
      () => setDiscountCodeActive(discountCode.$id, checked),
      "وضعیت کد به‌روزرسانی شد.",
      () =>
        setCodes((current) =>
          current.map((currentCode) =>
            currentCode.$id === discountCode.$id
              ? { ...currentCode, isActive: discountCode.isActive }
              : currentCode,
          ),
        ),
    );
  };

  const removeCode = (discountCode: DiscountCode) => {
    setCodes((current) =>
      current.filter((currentCode) => currentCode.$id !== discountCode.$id),
    );
    run(
      () => deleteDiscountCode(discountCode.$id),
      "کد حذف شد.",
      () =>
        setCodes((current) => {
          if (
            current.some(
              (currentCode) => currentCode.$id === discountCode.$id,
            )
          ) {
            return current;
          }
          return [...current, discountCode];
        }),
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">کدهای تخفیف</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          کدهای تخفیف قابل استفاده برای سفارش‌های فعال را مدیریت کنید.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ساخت کد جدید</CardTitle>
          <CardDescription>
            کد یکتا و درصد تخفیف را وارد کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1 space-y-2">
            <Label htmlFor="new-code">کد</Label>
            <Input
              id="new-code"
              dir="ltr"
              placeholder="WELCOME10"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
          </div>
          <div className="w-28 space-y-2">
            <Label htmlFor="new-percent">درصد</Label>
            <Input
              id="new-percent"
              dir="ltr"
              className="text-left"
              inputMode="numeric"
              placeholder="10"
              value={percent}
              onChange={(event) =>
                setPercent(event.target.value.replace(/[^\d]/g, "").slice(0, 3))
              }
            />
          </div>
          <Button
            onClick={submit}
            disabled={isPending || !code.trim() || !Number(percent)}
          >
            <Plus size={16} />
            ساخت
          </Button>
        </CardContent>
      </Card>

      {codes.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">%</EmptyMedia>
            <EmptyTitle>هنوز کدی ساخته نشده</EmptyTitle>
            <EmptyDescription>
              اولین کد تخفیف را از فرم بالا بسازید.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <AnimatePresence initial={false}>
          <motion.div layout>
            <Card>
              <CardContent className="pt-6">
                <div className="hidden md:block">
                  <Table className="min-w-[520px] table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[35%] text-right">
                          کد
                        </TableHead>
                        <TableHead className="w-[25%] text-right">
                          درصد
                        </TableHead>
                        <TableHead className="w-[20%] text-center">
                          فعال
                        </TableHead>
                        <TableHead className="w-[20%] text-center">
                          حذف
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {codes.map((discountCode) => (
                        <DiscountTableRow
                          key={discountCode.$id}
                          discountCode={discountCode}
                          onToggle={toggleCode}
                          onDelete={removeCode}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 md:hidden">
                  {codes.map((discountCode) => (
                    <motion.div
                      key={discountCode.$id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <p
                          dir="ltr"
                          className="truncate text-right font-mono font-bold"
                        >
                          {discountCode.code}
                        </p>
                        <Badge variant="secondary" className="mt-2">
                          {formatPercent(discountCode.percent)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          aria-label={`فعال بودن ${discountCode.code}`}
                          checked={discountCode.isActive}
                          onCheckedChange={(checked) =>
                            toggleCode(discountCode, checked)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          aria-label={`حذف ${discountCode.code}`}
                          onClick={() => removeCode(discountCode)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function DiscountTableRow({
  discountCode,
  onToggle,
  onDelete,
}: {
  discountCode: DiscountCode;
  onToggle: (discountCode: DiscountCode, checked: boolean) => void;
  onDelete: (discountCode: DiscountCode) => void;
}) {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-b transition-colors hover:bg-muted/50"
    >
      <TableCell dir="ltr" className="text-right font-mono font-bold">
        {discountCode.code}
      </TableCell>
      <TableCell className="text-right">
        <Badge variant="secondary">{formatPercent(discountCode.percent)}</Badge>
      </TableCell>
      <TableCell className="text-center">
        <Switch
          aria-label={`فعال بودن ${discountCode.code}`}
          checked={discountCode.isActive}
          onCheckedChange={(checked) => onToggle(discountCode, checked)}
        />
      </TableCell>
      <TableCell className="text-center">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:text-destructive"
          aria-label={`حذف ${discountCode.code}`}
          onClick={() => onDelete(discountCode)}
        >
          <Trash2 size={16} />
        </Button>
      </TableCell>
    </motion.tr>
  );
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("fa-IR", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / 100);
}
