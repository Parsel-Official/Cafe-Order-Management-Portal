"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Eye, EyeClosed } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginAdmin } from "./actions";

export function LoginForm() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showPassword , setShowPassword] = useState(false)

  const onSubmit = (formData: FormData) => {
    setError("");
    startTransition(async () => {
      try {
        await loginAdmin(formData);
      } catch (submissionError) {
        unstable_rethrow(submissionError);
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "ورود ناموفق بود.",
        );
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <Card>
        <CardHeader>
          <p className="text-sm text-primary">Cafe Moon</p>
          <CardTitle className="text-2xl font-bold">ورود صندوق‌دار</CardTitle>
          <CardDescription>
            برای ورود، ایمیل و رمز ادمین را وارد کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.25 }}
              >
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input id="email" name="email" required type="email" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="relative">
                <Input
                id="password"
                name="password"
                required
                minLength={8}
                type={showPassword ? "text" : "password"}
                dir="ltr"
              />
              <Button
                onClick={() => setShowPassword(!showPassword)}
              type="button" variant={'ghost'} className={"absolute right-0 text-foreground hover:bg-accent! hover:text-foreground!"}>
                {showPassword ? <Eye/> : <EyeClosed/>}
              </Button>
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={isPending}
            >
              {isPending ? "در حال ورود..." : "ورود به پنل"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
import { unstable_rethrow } from "next/navigation";
