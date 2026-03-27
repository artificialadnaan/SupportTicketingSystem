import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE = "";

export async function apiRequest(
  path: string,
  options: RequestInit & { adminPassword?: string } = {}
) {
  const { adminPassword, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (adminPassword) {
    headers["x-admin-password"] = adminPassword;
  }

  // Don't set Content-Type for FormData — browser sets it with boundary
  if (!(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  const platform = navigator.platform || "Unknown";
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  return `${ua} | Platform: ${platform} | Screen: ${screenRes}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
