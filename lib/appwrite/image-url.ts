const storagePath = "/storage/";

export function createAppwriteFileUrl(
  endpoint: string,
  bucketId: string,
  fileId: string,
) {
  const baseUrl = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
  return new URL(
    `storage/buckets/${bucketId}/files/${fileId}/view`,
    baseUrl,
  );
}

export function normalizeAppwriteImageUrl(value?: string) {
  if (!value) return "";

  try {
    const url = new URL(value);
    if (!url.pathname.startsWith(storagePath)) return value;

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    if (!endpoint) return value;

    const endpointUrl = new URL(endpoint);
    if (url.origin !== endpointUrl.origin) return value;

    const endpointPath = endpointUrl.pathname.replace(/\/+$/u, "");
    if (endpointPath && !url.pathname.startsWith(`${endpointPath}/`)) {
      url.pathname = `${endpointPath}${url.pathname}`;
    }

    return url.toString();
  } catch {
    return value;
  }
}
