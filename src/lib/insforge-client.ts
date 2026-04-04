import { createClient } from "@insforge/sdk";

const baseUrl = import.meta.env.VITE_INSFORGE_OSS_HOST as string | undefined;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string | undefined;

export const insforgeConfigured = Boolean(baseUrl && anonKey);

/** InsForge BaaS client (database, auth, storage, AI). Requires VITE_ env vars. */
export const insforge = createClient({
  baseUrl: baseUrl ?? "https://invalid.insforge.app",
  anonKey: anonKey ?? "missing-anon-key",
});
