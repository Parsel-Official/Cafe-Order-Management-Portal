import { Client, Databases, Query } from "node-appwrite";
import {
  appwriteConfig,
  assertAppwriteServerConfig,
} from "@/lib/appwrite/config";

export function getAppwriteServerClient() {
  assertAppwriteServerConfig();
  return new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.apiKey);
}

export function getServerDatabases() {
  return new Databases(getAppwriteServerClient());
}

export async function withAppwriteRetry<T>(
  operation: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const status = typeof error === "object" && error !== null && "code" in error
        ? Number(error.code)
        : 0;
      const isTransient =
        error instanceof TypeError ||
        status === 408 ||
        status === 429 ||
        status >= 500;

      if (!isTransient || attempt === attempts - 1) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 250 * 2 ** attempt),
      );
    }
  }

  throw lastError;
}

export { Query };
