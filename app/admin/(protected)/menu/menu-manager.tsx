"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coffee, ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { relationId } from "@/lib/types";
import { normalizeAppwriteImageUrl } from "@/lib/appwrite/image-url";
import {
  saveCategory,
  saveItem,
  setCategoryActive,
  setItemFlags,
  uploadMenuItemImage,
} from "./actions";

type MenuData = Array<MenuCategory & { items: MenuItem[] }>;

export function MenuManager({ initialMenu }: { initialMenu: MenuData }) {
  const router = useRouter();
  const [menu, setMenu] = useState(initialMenu);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // The server refresh provides the authoritative menu snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenu(initialMenu);
  }, [initialMenu]);

  const [categoryDialog, setCategoryDialog] = useState<
    { open: boolean; category?: MenuCategory } | undefined
  >();
  const [itemDialog, setItemDialog] = useState<
    { open: boolean; item?: MenuItem; categoryId?: string } | undefined
  >();

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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">مدیریت منو</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            دسته‌بندی‌ها و آیتم‌های منو را مدیریت کنید.
          </p>
        </div>
        <Button
          onClick={() => setCategoryDialog({ open: true })}
          variant="outline"
        >
          <Plus size={18} />
          دسته جدید
        </Button>
      </div>

      {menu.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>منو خالی است</EmptyTitle>
            <EmptyDescription>
              برای شروع، اولین دسته‌بندی منو را بسازید.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <div className="space-y-6">
        {menu.map((category) => (
          <motion.div
            key={category.$id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {category.name}
                      {!category.isActive && (
                        <Badge variant="secondary">غیرفعال</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      ترتیب: {category.order.toLocaleString("fa-IR")} —{" "}
                      {category.items.length.toLocaleString("fa-IR")} آیتم
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`ویرایش ${category.name}`}
                      onClick={() =>
                        setCategoryDialog({ open: true, category })
                      }
                    >
                      <Pencil size={16} />
                    </Button>
                    <Switch
                      aria-label={`فعال بودن ${category.name}`}
                      checked={category.isActive}
                      onCheckedChange={(checked) =>
                        run(
                          () => setCategoryActive(category.$id, checked),
                          "وضعیت دسته به‌روزرسانی شد.",
                        )
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        setItemDialog({ open: true, categoryId: category.$id })
                      }
                    >
                      <Plus size={16} />
                      آیتم
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {category.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    هنوز آیتمی در این دسته نیست.
                  </p>
                ) : (
                  <div className="divide-y">
                    {category.items.map((item) => (
                      <ItemRow
                        key={item.$id}
                        item={item}
                        onEdit={() => setItemDialog({ open: true, item })}
                        onToggleAvailable={(checked) =>
                          run(
                            () => setItemFlags(item.$id, { isAvailable: checked }),
                            checked ? "آیتم موجود شد." : "آیتم ناموجود شد.",
                          )
                        }
                        onToggleActive={(checked) =>
                          run(
                            () => setItemFlags(item.$id, { isActive: checked }),
                            checked ? "آیتم به منو برگشت." : "آیتم از منو حذف شد.",
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {categoryDialog?.open && (
          <CategoryDialog
            key="category"
            category={categoryDialog.category}
            onClose={() => setCategoryDialog(undefined)}
          />
        )}
        {itemDialog?.open && (
          <ItemDialog
            key="item"
            item={itemDialog.item}
            categories={menu.map(({ $id, name }) => ({ $id, name }))}
            defaultCategoryId={itemDialog.categoryId}
            onClose={() => setItemDialog(undefined)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ItemRow({
  item,
  onEdit,
  onToggleAvailable,
  onToggleActive,
}: {
  item: MenuItem;
  onEdit: () => void;
  onToggleAvailable: (checked: boolean) => void;
  onToggleActive: (checked: boolean) => void;
}) {
  const [available, setAvailable] = useState(item.isAvailable);
  const [active, setActive] = useState(item.isActive);

  return (
    <motion.div layout className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={normalizeAppwriteImageUrl(item.imageUrl)}
          alt=""
          className="size-12 shrink-0 rounded-lg border object-cover"
        />
      ) : (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Coffee size={18} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          {item.price.toLocaleString("fa-IR")} تومان
        </p>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          موجود
          <Switch
            checked={available}
            onCheckedChange={(checked) => {
              setAvailable(checked);
              onToggleAvailable(checked);
            }}
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          فعال
          <Switch
            checked={active}
            onCheckedChange={(checked) => {
              setActive(checked);
              onToggleActive(checked);
            }}
          />
        </label>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`ویرایش ${item.name}`}
          onClick={onEdit}
        >
          <Pencil size={16} />
        </Button>
        {!active && <Trash2 size={16} className="text-muted-foreground/50" />}
      </div>
    </motion.div>
  );
}

function CategoryDialog({
  category,
  onClose,
}: {
  category?: MenuCategory;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? "");
  const [order, setOrder] = useState(String(category?.order ?? 1));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      try {
        await saveCategory({
          id: category?.$id,
          name,
          order: Number(order) || 0,
        });
        router.refresh();
        onClose();
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "ذخیره ناموفق بود.",
        );
      }
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "ویرایش دسته" : "دسته جدید"}</DialogTitle>
          <DialogDescription>
            نام و ترتیب نمایش دسته‌بندی را مشخص کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">نام</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-order">ترتیب نمایش</Label>
            <Input
              id="category-order"
              inputMode="numeric"
              value={order}
              onChange={(event) => setOrder(event.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button onClick={submit} disabled={isPending || !name.trim()}>
            {isPending ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemDialog({
  item,
  categories,
  defaultCategoryId,
  onClose,
}: {
  item?: MenuItem;
  categories: Array<{ $id: string; name: string }>;
  defaultCategoryId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(
    item ? relationId(item.categoryId) : defaultCategoryId ?? "",
  );
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(formatPrice(item?.price ?? ""));
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      try {
        await saveItem({
          id: item?.$id,
          name,
          description,
          price: parsePrice(price),
          categoryId,
          imageUrl,
          isAvailable: item?.isAvailable ?? true,
          isActive: item?.isActive ?? true,
        });
        router.refresh();
        onClose();
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "ذخیره ناموفق بود.",
        );
      }
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "ویرایش آیتم" : "آیتم جدید"}</DialogTitle>
          <DialogDescription>اطلاعات آیتم منو را وارد کنید.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>دسته‌بندی</Label>
            <Select value={categoryId} onValueChange={(value) => setCategoryId(value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="انتخاب دسته" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.$id} value={category.$id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-name">نام</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-description">توضیحات</Label>
            <Textarea
              id="item-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-price">قیمت (تومان)</Label>
            <Input
            id="item-price"
            inputMode="numeric"
            dir="ltr"
            className="text-left"
            value={price}
              onChange={(event) => setPrice(formatPrice(event.target.value))}
            />
          </div>
          <Separator />
          <ImageUpload
            imageUrl={imageUrl}
            onUploaded={setImageUrl}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button
            onClick={submit}
            disabled={isPending || !name.trim() || !categoryId}
          >
            {isPending ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function parsePrice(value: string | number) {
  const normalized = String(value).replaceAll(",", "").replace(/[^\d]/g, "");
  return Number(normalized) || 0;
}

function formatPrice(value: string | number) {
  const numericValue = parsePrice(value);
  return numericValue ? numericValue.toLocaleString("en-US") : "";
}

function ImageUpload({
  imageUrl,
  onUploaded,
}: {
  imageUrl: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadMenuItemImage(formData);
      onUploaded(result.imageUrl);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "آپلود تصویر ناموفق بود.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>تصویر آیتم (اختیاری)</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(event) => handleFileChange(event.target.files?.[0])}
      />
      {imageUrl ? (
        <motion.div
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-fit overflow-hidden rounded-xl border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={normalizeAppwriteImageUrl(imageUrl)}
            alt="پیش‌نمایش تصویر آیتم"
            className="h-32 w-48 object-cover"
          />
          <Button
            variant="destructive"
            size="icon-sm"
            aria-label="حذف تصویر"
            disabled={uploading}
            onClick={() => {
              onUploaded("");
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute top-1 left-1"
          >
            <Trash2 size={14} />
          </Button>
        </motion.div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              در حال آپلود...
            </>
          ) : (
            <>
              <ImagePlus size={20} />
              انتخاب تصویر (JPG، PNG، WebP — حداکثر ۱۰MB)
            </>
          )}
        </button>
      )}
      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}
    </div>
  );
}
