"use client";

export default function OrdersError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">دریافت سفارش‌ها انجام نشد</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          اتصال به سرور موقتاً برقرار نشد.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          تلاش دوباره
        </button>
      </div>
    </main>
  );
}
