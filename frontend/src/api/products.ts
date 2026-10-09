export interface Product {
  code?: string;
  product_name?: string;
  brands?: string;
  quantity?: string;
  image_front_small_url?: string;
}

export interface LookupResponse {
  found: boolean;
  product: Product | null;
  cached: boolean;
  stale?: boolean;
}

export async function lookupProduct(barcode: string): Promise<LookupResponse> {
  const res = await fetch(`/api/products/${barcode}`);
  if (res.status === 429) {
    // const body = await res.json().catch(() => ({}));
    throw new Error("Lookup busy");
  }
  if (!res.ok) throw new Error(`Lookup failed: ${res.status}`);
  return res.json();
}
