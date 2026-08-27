import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getAdminAccount } from "@/lib/appwrite/auth";
import { logoutAdmin } from "./actions";
import { AdminNav } from "./admin-nav";
import { Button } from "@/components/ui/button";

export default async function AdminProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const account = await getAdminAccount();
  if (!account) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-l bg-background p-4 md:flex">
        <div className="px-2 py-4">
          <p className="text-sm text-primary">Cafe Moon</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {account.email}
          </p>
        </div>
        <AdminNav />
        <div className="mt-auto pt-4">
          <form action={logoutAdmin}>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LogOut size={18} />
              خروج
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b bg-background/95 p-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between">
            <p className="font-bold text-primary">Cafe Moon</p>
            <form action={logoutAdmin}>
              <Button variant="ghost" size="icon-sm" aria-label="خروج">
                <LogOut size={18} />
              </Button>
            </form>
          </div>
          <AdminNav horizontal />
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
