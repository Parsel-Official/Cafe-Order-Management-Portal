"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { submitOrder } from "./actions";
import type { MenuItem, PublicMenu } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Cart = Record<string, number>;

export function CustomerOrder({ menu }: { menu: PublicMenu }) {
  const [cart, setCart] = useState<Cart>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const selectedCount = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0,
  );
  const selectedItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, quantity]) => quantity > 0)
        .map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
    [cart],
  );

  const changeQuantity = (item: MenuItem, delta: number) => {
    setCart((current) => {
      const quantity = Math.max(
        0,
        Math.min(99, (current[item.$id] ?? 0) + delta),
      );
      const next = { ...current };
      if (quantity === 0) delete next[item.$id];
      else next[item.$id] = quantity;
      return next;
    });
  };

  const setQuantity = (item: MenuItem, value: string) => {
    const quantity = Number.parseInt(value, 10);
    if (!Number.isFinite(quantity)) return;
    setCart((current) => ({
      ...current,
      [item.$id]: Math.max(0, Math.min(99, quantity)),
    }));
  };

  const submit = () => {
    setError("");
    startTransition(async () => {
      try {
        await submitOrder({ token: menu.table.token, items: selectedItems });
        setCart({});
        setSubmitted(true);
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "ثبت سفارش انجام نشد.",
        );
      }
    });
  };

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card>
            <CardContent className="flex flex-col items-center py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="mb-5 flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary"
              >
                <Check size={28} />
              </motion.div>
              <h1 className="text-2xl font-bold">سفارش شما ثبت شد</h1>
              <p className="mt-3 text-muted-foreground">
                سفارش شما با موفقیت ثبت شد. برای ویرایش یا افزودن به سفارش،
                لطفاً به صندوق‌دار مراجعه کنید.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/40 pb-32 text-foreground">
      <header className="bg-primary/10 px-5 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-primary">Cafe Moon</p>
          <h1 className="mt-2 text-3xl font-bold">
            منوی میز {menu.table.tableNumber}
          </h1>
          <p className="mt-2 text-muted-foreground">
            آیتم‌های مورد نظر را انتخاب کنید.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 p-5">
        {menu.categories
          .filter((category) => category.items.length > 0)
          .map((category, categoryIndex) => (
            <motion.section
              key={category.$id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: categoryIndex * 0.05 }}
            >
              <h2 className="mb-3 text-xl font-bold">{category.name}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {category.items.map((item) => {
                  const quantity = cart[item.$id] ?? 0;
                  return (
                    <Card key={item.$id}>
                      <CardContent className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold">{item.name}</h3>
                          {item.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                          <p className="mt-3 font-semibold text-primary">
                            {item.price.toLocaleString("fa-IR")} تومان
                          </p>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-muted p-1">
                          <Button
                            aria-label={`افزایش ${item.name}`}
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => changeQuantity(item, 1)}
                            type="button"
                          >
                            <Plus size={18} />
                          </Button>
                          <Input
                            aria-label={`تعداد ${item.name}`}
                            className="h-8 w-10 border-none bg-transparent text-center font-bold shadow-none"
                            inputMode="numeric"
                            value={quantity}
                            onChange={(event) =>
                              setQuantity(item, event.target.value)
                            }
                          />
                          <Button
                            aria-label={`کاهش ${item.name}`}
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => changeQuantity(item, -1)}
                            type="button"
                          >
                            <Minus size={18} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.section>
          ))}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 left-5 right-5 z-10"
          >
            <Alert variant="destructive">
              <AlertDescription className="text-center">
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold">
            <ShoppingBag size={20} />
            {selectedCount.toLocaleString("fa-IR")} آیتم
          </div>
          <Button
            disabled={selectedCount === 0 || isPending}
            onClick={submit}
            size="lg"
            type="button"
          >
            {isPending ? "در حال ثبت..." : "ثبت سفارش"}
          </Button>
        </div>
      </div>
    </main>
  );
}
