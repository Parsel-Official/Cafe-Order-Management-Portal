export type MenuCategory = {
  $id: string;
  name: string;
  order: number;
  isActive: boolean;
};

export type MenuItem = {
  $id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  isAvailable: boolean;
  isActive: boolean;
};

export type PublicMenu = {
  table: {
    $id: string;
    tableNumber: string;
    token: string;
    isActive: boolean;
    status: "empty" | "occupied";
  };
  categories: Array<MenuCategory & { items: MenuItem[] }>;
  activeOrder: { $id: string; itemCount: number } | null;
};

export type Table = {
  $id: string;
  tableNumber: string;
  token: string;
  isActive: boolean;
  status: "empty" | "occupied";
};

export type Order = {
  $id: string;
  tableId: string | { $id: string };
  status: "active" | "settled";
  discountType: "none" | "code" | "manual";
  discountCodeId?: string | { $id: string } | null;
  discountPercent?: number | null;
  discountAmount?: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  settledAt?: string | null;
};

export type OrderItem = {
  $id: string;
  orderId: string | { $id: string };
  menuItemId: string | { $id: string };
  name?: string;
  quantity: number;
  unitPrice: number;
};

export type DiscountCode = {
  $id: string;
  code: string;
  percent: number;
  isActive: boolean;
  expiresAt?: string | null;
};

export type OrderWithItems = Order & {
  tableNumber: string;
  items: OrderItem[];
};

export function relationId(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$id" in value) {
    return String((value as { $id: string }).$id);
  }
  return "";
}
