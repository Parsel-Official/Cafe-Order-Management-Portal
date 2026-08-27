import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";

export const metadata: Metadata = {
  title: "کافه مون | تجربه‌ای متفاوت از قهوه و شب",
  description:
    "کافه مون؛ فضایی برای قهوه، موسیقی، گفتگو و لحظه‌هایی که ماندگار می‌شوند.",
};

export default function Home() {
  return <HomePage />;
}
