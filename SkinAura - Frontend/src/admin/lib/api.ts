import type { ApprovePayload, Product, Stats } from "./types";

// Flask backend — always on port 5000 locally.
// Override with VITE_API_URL for production deploys.
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Public ──────────────────────────────────────────────────────────────────

export async function getApprovedProducts(): Promise<Product[]> {
  return request("/products");
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function getStats(): Promise<Stats> {
  return request("/admin/stats");
}

export async function getPendingProducts(): Promise<Product[]> {
  return request("/admin/products/pending");
}

export async function addProduct(payload: {
  name: string;
  brand: string;
  category: string;
  description: string;
  safety: number;
  eco: number;
  image: string;
}): Promise<{ id: number; status: string }> {
  return request("/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Upload front & back product images to the backend.
 * Returns the new product's ID.
 */
export async function scanProduct(
  frontImage: File,
  backImage: File
): Promise<{ product_id: number }> {
  const form = new FormData();
  form.append("front_image", frontImage);
  form.append("back_image", backImage);
  // Note: do NOT set Content-Type header — the browser sets it with the correct boundary
  return request("/admin/products/scan", { method: "POST", body: form });
}

/**
 * Fetch a single product by ID (used for polling pipeline_step after upload).
 */
export async function getProduct(id: number): Promise<Product> {
  return request(`/admin/products/${id}`);
}

export async function approveProduct(id: number, payload: ApprovePayload): Promise<void> {
  await request(`/admin/products/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function rejectProduct(id: number): Promise<void> {
  await request(`/admin/products/${id}/reject`, { method: "POST" });
}
