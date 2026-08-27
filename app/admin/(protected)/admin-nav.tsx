"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Coffee,
  LayoutDashboard,
  Percent,
  Table2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ClipboardList },
  { href: "/admin/tables", label: "میزها", icon: Table2 },
  { href: "/admin/menu", label: "منو", icon: Coffee },
  { href: "/admin/discounts", label: "کدهای تخفیف", icon: Percent },
  { href: "/admin/reports", label: "گزارش روز", icon: ClipboardList },
];

export function AdminNav({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        horizontal
          ? "scrollbar-none -mx-1 mt-3 flex gap-1 overflow-x-auto px-1 pb-1"
          : "flex flex-col gap-1",
      )}
    >
      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon size={18} />
            {item.label}
            {active && (
              <motion.span
                layoutId={horizontal ? "admin-nav-h" : "admin-nav-v"}
                className="absolute inset-y-1 right-0 w-0.5 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
