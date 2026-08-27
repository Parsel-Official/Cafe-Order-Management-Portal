import { notFound } from "next/navigation";
import { getPublicMenu } from "@/lib/appwrite/data";
import { CustomerOrder } from "./customer-order";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let menu;

  try {
    menu = await getPublicMenu(token);
  } catch (error) {
    if (error instanceof Error && error.message === "TABLE_INACTIVE") {
      return <ErrorMessage message="این میز در حال حاضر غیرفعال است." />;
    }
    if (error instanceof Error && error.message === "TABLE_NOT_FOUND") {
      notFound();
    }
    if (error instanceof Error && error.message === "TABLE_HAS_ACTIVE_ORDER") {
      return (
        <ErrorMessage message="این میز سفارش باز دارد. برای ویرایش یا افزودن به سفارش، لطفاً به صندوق‌دار مراجعه کنید." />
      );
    }
    throw error;
  }

  return <CustomerOrder menu={menu} />;
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6 text-center">
      <Card>
        <CardContent>
          <p className="text-lg font-semibold">{message}</p>
        </CardContent>
      </Card>
    </main>
  );
}
