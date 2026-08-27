# Cafe Moon

MVP سیستم مدیریت سفارش کافه با Next.js و Appwrite self-hosted.

## راه‌اندازی Appwrite

ابتدا مقادیر `.env.local` را بر اساس `.env.example` تنظیم کنید. برای اجرای setup، API key باید دسترسی‌های Databases، Storage و Users را داشته باشد.

```bash
npm run setup:appwrite
```

این دستور به‌صورت امن و قابل تکرار، دیتابیس، collectionهای منو/میز/سفارش/تخفیف، indexها، bucket تصاویر منو، ۱۴ میز ثابت با token تصادفی امن و کاربر ادمین را می‌سازد. منابعی که از قبل وجود داشته باشند دوباره ساخته نمی‌شوند.

توکن هر میز هویت ثابت همان میز است و با اجرای دوباره setup تغییر نمی‌کند. در صورت نیاز به تغییر دستی تعداد میزهای seed‌شده، مقدار `APPWRITE_TABLE_COUNT` را تنظیم کنید.

## قرارداد QR و سفارش میز

لینک QR باید به شکل `https://cafemoon.ir/orders/{token}` باشد و فقط token تصادفی را در URL قرار دهد؛ شماره میز در URL استفاده نمی‌شود. مسیر `/orders/[token]` ابتدا token را در `tables` resolve می‌کند و میز غیرفعال یا token نامعتبر را رد می‌کند.

هر میز فقط یک سفارش `active` جاری دارد. باز کردن QR یا اسکن مجدد، وضعیت میز را تغییر نمی‌دهد. اولین ثبت سفارش واقعی سفارش active را می‌سازد و میز را `occupied` می‌کند؛ ثبت‌های بعدی مشتریان همان میز، اقلام را به همان سفارش active اضافه می‌کنند. پس از تسویه، سفارش `settled` می‌شود و میز دوباره `empty` خواهد شد.

اسکریپت از `APPWRITE_ENDPOINT` و `APPWRITE_PROJECT_ID` نیز پشتیبانی می‌کند؛ در صورت نبودن آن‌ها، مقادیر `NEXT_PUBLIC_APPWRITE_ENDPOINT` و `NEXT_PUBLIC_APPWRITE_PROJECT_ID` استفاده می‌شوند.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
