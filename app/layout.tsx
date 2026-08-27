import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";

const yekan = localFont({
  src: "../public/fonts/yekan-bakh/yekan-bakh.woff",
  display: "swap",
  variable: "--font-yekan",
});

export const metadata: Metadata = {
  title: "صفحه اصلی - کافه مون",
  description: "مشاهده منو آنلاین کافه مون - مشاهده صفحات و سفارش اینترنتی",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${yekan.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster
          position="top-left"
          richColors
          className="font-[inherit]! select-none"
        />
      </body>
    </html>
  );
}
