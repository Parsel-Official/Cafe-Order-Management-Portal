import { Account, Client } from "node-appwrite";
import { cookies } from "next/headers";
import { appwriteConfig } from "@/lib/appwrite/config";

export async function getAdminAccount() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("cafe_moon_session");
  if (!sessionCookie) return null;

  const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setSession(sessionCookie.value);

  try {
    return await new Account(client).get();
  } catch {
    return null;
  }
}
