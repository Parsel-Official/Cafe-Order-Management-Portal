"use server";

import { Account, Client } from "node-appwrite";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("cafe_moon_session")?.value;

  if (session) {
    try {
      const client = new Client()
        .setEndpoint( process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT! )
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
        .setSession(session);
      await new Account(client).deleteSession({ sessionId: "current" });
    } catch {
    }
  }

  cookieStore.delete("cafe_moon_session");
  redirect("/admin/login");
}
