"use server";

import { Account, Client } from "node-appwrite";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { appwriteConfig } from "@/lib/appwrite/config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function loginAdmin(formData: FormData) {
  const payload = loginSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!appwriteConfig.endpoint || !appwriteConfig.projectId) {
    throw new Error("تنظیمات Appwrite کامل نیست.");
  }
  const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.apiKey)
  const account = new Account(client);
  let session;

  try {
    session = await account.createEmailPasswordSession(payload);
  } catch (error) {
    console.error("Admin login failed:", error);
    throw new Error("ایمیل یا رمز عبور صحیح نیست.");
  }

  if (!session.secret) {
    throw new Error("Appwrite session secret دریافت نشد.");
  }

  const cookieStore = await cookies();
  cookieStore.set("cafe_moon_session", session.secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/admin");
}
