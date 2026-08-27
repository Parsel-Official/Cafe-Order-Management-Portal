"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  IconArrowDown,
  IconArrowLeft,
  IconCoffee,
  IconMapPin,
  IconBrandInstagram,
  IconPhone,
  IconSparkles,
  IconStar,
  IconUsers,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const experiences = [
  { icon: IconCoffee, title: "قهوه‌های خاص", text: "عطر قهوه، شروع یک شب متفاوت." },
  {
    icon: IconSparkles,
    title: "طعم‌های متنوع",
    text: "برای هر سلیقه، یک انتخاب به‌یادماندنی.",
  },
  { icon: IconUsers, title: "فضای صمیمی", text: "جایی برای گفتگوهای خوب و آرامش." },
];

const gallery = [
  {
    src: "/images/posters/cafe-poster-1.png",
    alt: "پوستر تجربه‌های متفاوت کافه مون",
    className: "md:col-span-7 md:row-span-2",
  },
  {
    src: "/images/posters/cafe-poster-2.png",
    alt: "پوستر انتخاب کافه مون",
    className: "md:col-span-5",
  },
  {
    src: "/images/posters/cafe-poster-3.png",
    alt: "پوستر شب‌های کافه مون",
    className: "md:col-span-5",
  },
];

export function HomePage() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 700], [0, 120]);
  const heroScale = useTransform(scrollY, [0, 700], [1, 1.08]);

  return (
    <div className="overflow-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-8">
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-border/60 bg-background/75 px-4 py-2.5 shadow-lg backdrop-blur-xl sm:px-6"
        >
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-192.png"
              width={38}
              height={38}
              alt="لوگوی کافه مون"
              className="rounded-full"
            />
            <span className="hidden text-sm font-bold tracking-wide sm:inline">
              کافه مون
            </span>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#story">
              داستان ما
            </a>
            <a
              className="transition-colors hover:text-foreground"
              href="#experience"
            >
              تجربه مون
            </a>
            <a
              className="transition-colors hover:text-foreground"
              href="#gallery"
            >
              گالری
            </a>
            <a
              className="transition-colors hover:text-foreground"
              href="#location"
            >
              مسیر دسترسی
            </a>
          </div>
          <Button size="sm" render={<a href="tel:02177703406" />}>
            <IconPhone />
            <span className="hidden sm:inline">تماس با ما</span>
          </Button>
        </motion.nav>
      </header>

      <main>
        <section className="relative isolate flex min-h-[760px] items-end overflow-hidden px-5 pt-36 pb-16 sm:min-h-screen sm:px-10 sm:pb-24">
          <motion.div
            style={{ y: heroY, scale: heroScale }}
            className="absolute inset-0 -z-20"
          >
            <Image
              src="/images/posters/cafe-poster-3.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center opacity-40"
            />
          </motion.div>
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,oklch(0.145_0_0_/_0.25)_0%,oklch(0.145_0_0_/_0.76)_65%,var(--background)_100%)]" />
          <div className="mx-auto grid w-full max-w-7xl items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={reveal}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <Badge variant="outline" className="mb-6 rounded-full px-4 py-1.5">
                یک شب، یک انتخاب، یک خاطره
              </Badge>
              <h1 className="text-5xl leading-[1.12] font-black tracking-tight sm:text-7xl lg:text-8xl">
                لحظه‌ها را
                <span className="block text-primary">آهسته‌تر زندگی کن.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground sm:text-lg">
                کافه مون جایی‌ست برای قهوه‌های خاص، موسیقی زنده و گفتگوهایی که
                دوست داری طولانی‌تر شوند.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" render={<a href="#experience" />}>
                  کشف تجربه مون
                  <IconArrowLeft />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  render={<a href="#location" />}
                >
                  پیدا کردن ما
                  <IconMapPin />
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 32, rotate: 3 }}
              animate={{ opacity: 1, x: 0, rotate: -3 }}
              transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
              className="relative mx-auto hidden w-full max-w-sm lg:block"
            >
              <div className="absolute -inset-5 rounded-[2rem] border border-primary/20" />
              <div className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] border border-primary/30 bg-card shadow-2xl shadow-primary/10">
                <Image
                  src="/images/posters/cafe-poster-2.png"
                  alt="پوستر انتخاب کافه مون"
                  fill
                  sizes="380px"
                  className="object-cover"
                />
              </div>
            </motion.div>
          </div>
          <motion.a
            href="#story"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs text-muted-foreground"
          >
            <span>برای کشف بیشتر</span>
            <IconArrowDown className="animate-bounce" size={16} />
          </motion.a>
        </section>

        <section id="story" className="mx-auto max-w-7xl px-5 py-24 sm:px-10 sm:py-36">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            transition={{ duration: 0.6 }}
            className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]"
          >
            <div>
              <p className="mb-4 text-sm tracking-[0.2em] text-primary uppercase">
                The Moon Story
              </p>
              <h2 className="max-w-md text-4xl leading-tight font-bold sm:text-6xl">
                قهوه فقط
                <span className="block text-muted-foreground">بهانه ماست.</span>
              </h2>
            </div>
            <div className="max-w-2xl lg:pt-12">
              <p className="text-xl leading-10 text-muted-foreground sm:text-2xl">
                ما باور داریم بهترین شب‌ها از یک انتخاب ساده شروع می‌شوند؛ یک
                فنجان قهوه، یک صندلی دنج و آدم‌هایی که بودنشان حال فضا را بهتر
                می‌کند.
              </p>
              <Separator className="my-8" />
              <div className="flex flex-wrap gap-8 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <IconStar className="text-primary" size={16} />
                  تجربه‌ای برای ماندن
                </span>
                <span className="flex items-center gap-2">
                  <IconSparkles className="text-primary" size={16} />
                  انتخابی با سلیقه
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="experience" className="border-y border-border/60 bg-card/40">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-10 sm:py-32 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={reveal}
              transition={{ duration: 0.6 }}
            >
              <p className="mb-4 text-sm tracking-[0.2em] text-primary uppercase">
                The Experience
              </p>
              <h2 className="text-4xl font-bold sm:text-6xl">
                هر میز،
                <span className="block text-muted-foreground">یک داستان.</span>
              </h2>
              <div className="mt-10 space-y-7">
                {experiences.map(({ icon: Icon, title, text }, index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="flex gap-4"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/40 text-primary">
                      <Icon size={19} />
                    </div>
                    <div>
                      <h3 className="font-bold">{title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7 }}
              className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-primary/20"
            >
              <Image
                src="/images/posters/cafe-poster-1.png"
                alt="فضای انتخاب و تجربه در کافه مون"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute right-6 bottom-6 left-6">
                <p className="text-2xl font-bold">ما اینجا لذت را کامل می‌کنیم.</p>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="gallery" className="mx-auto max-w-7xl px-5 py-24 sm:px-10 sm:py-36">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={reveal}
            transition={{ duration: 0.6 }}
            className="mb-10 flex flex-wrap items-end justify-between gap-5"
          >
            <div>
              <p className="mb-4 text-sm tracking-[0.2em] text-primary uppercase">
                Visual Journal
              </p>
              <h2 className="text-4xl font-bold sm:text-6xl">شب‌های مون</h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-muted-foreground">
              بخشی از حال‌وهوایی که در کافه مون منتظر شماست؛ از انتخاب تا آخرین
              جرعه.
            </p>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-12 md:grid-rows-2">
            {gallery.map((item, index) => (
              <motion.div
                key={item.src}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={`group relative min-h-72 overflow-hidden rounded-2xl border border-border/60 bg-card ${item.className}`}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition duration-700 group-hover:scale-105 group-hover:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/65 to-transparent opacity-70" />
                <span className="absolute right-5 bottom-5 text-sm text-primary">
                  ۰{index + 1}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="location" className="border-t border-border/60 bg-primary/10">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-24 sm:px-10 sm:py-32 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={reveal}
              transition={{ duration: 0.6 }}
            >
              <p className="mb-4 text-sm tracking-[0.2em] text-primary uppercase">
                Find Your Way
              </p>
              <h2 className="max-w-2xl text-4xl leading-tight font-bold sm:text-7xl">
                شب خوب،
                <span className="block text-primary">از اینجا شروع می‌شود.</span>
              </h2>
              <p className="mt-6 max-w-xl leading-8 text-muted-foreground">
                برای پیدا کردن کافه مون روی نقشه بزنید یا برای هماهنگی با ما
                تماس بگیرید.
              </p>
            </motion.div>
            <Card className="border-primary/30 bg-background/70">
              <CardContent className="space-y-4 p-6">
                <Button
                  className="w-full justify-between"
                  size="lg"
                  render={
                    <a
                      href="https://maps.app.goo.gl/XrjMHrf77ZSdonf89"
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  مشاهده روی نقشه
                  <IconMapPin />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  size="lg"
                  render={<a href="tel:02177703406" />}
                >
                  02177703406
                  <IconPhone />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-8 sm:px-10">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-192.png"
              width={40}
              height={40}
              alt="لوگوی کافه مون"
              className="rounded-full"
            />
            <div>
              <p className="font-bold">کافه مون</p>
              <p className="text-xs text-muted-foreground">
                برای لحظه‌هایی که ارزش ماندن دارند.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <a
              className="transition-colors hover:text-primary"
              href="tel:02177703406"
              aria-label="تماس با کافه مون"
            >
              <IconPhone size={18} />
            </a>
            <a
              className="transition-colors hover:text-primary"
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="اینستاگرام"
            >
              <IconBrandInstagram size={18} />
            </a>
            <a
              className="transition-colors hover:text-primary"
              href="https://cofe-moon.ir"
              target="_blank"
              rel="noreferrer"
            >
              cofe-moon.ir
            </a>
          </div>
          <p className="w-full text-xs text-muted-foreground sm:w-auto">
            © {new Date().getFullYear()} Cafe Moon
          </p>
        </div>
      </footer>
    </div>
  );
}
