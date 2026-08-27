"use client";

import { Client } from "appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";

export function getAppwriteClient() {
  if (!appwriteConfig.endpoint || !appwriteConfig.projectId) {
    throw new Error("Appwrite client config is incomplete.");
  }

  return new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);
}
