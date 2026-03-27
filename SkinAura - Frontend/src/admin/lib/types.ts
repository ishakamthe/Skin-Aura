export type IngredientSafety = "low" | "moderate" | "high" | "unknown";

export interface Ingredient {
  name: string;
  safety: IngredientSafety;
  description: string;
}

// Pipeline step — backend sets this to "ready" immediately (no async AI pipeline)
export type PipelineStep =
  | "queued"
  | "extracting_text"
  | "structuring_data"
  | "scoring"
  | "ready";

// Statuses the Flask backend uses
export type ProductStatus = "approved" | "pending" | "rejected" | "failed";

// Matches the shape Flask actually returns from /products and /admin/products/pending
export interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  description: string;
  safety: number;
  eco: number;
  image: string;
  image_front?: string;
  image_back?: string;
  status: ProductStatus;
  pipeline_step?: PipelineStep;
  pipeline_error?: string | null;
  ingredients: Ingredient[];
}

export interface Stats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  recent: Array<{
    id: number;
    name: string | null;
    brand: string | null;
    status: ProductStatus;
  }>;
}

export interface ApprovePayload {
  name: string;
  brand: string;
  category: string;
  description: string;
  safety: number;
  eco: number;
  ingredients: Ingredient[];
}
