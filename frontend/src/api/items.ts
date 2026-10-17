export interface Item {
  id: string;
  household_id: string;
  location_id: string;
  barcode: string;
  name?: string;
  brand?: string;
  icon?: string;
  quantity: number;
  unit?: string;
  category?: string;
  expires_at?: string;
  added_at: number;
  added_by: number;
}

export interface CreateItemPayload {
  barcode: string;
  name?: string;
  brand?: string;
  category?: string;
  quantity: number;
  unit?: string;
  icon?: string;
  location_id?: number;
  household_id: number;
  expires_at?: string;
}

export interface UpdateItemPayload extends Partial<CreateItemPayload> {
  quantity?: number;
}

export async function getItems(barcode?: string): Promise<Item[] | []> {
  const res = await fetch(`/api/items/${barcode || ""}`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Get item failed: ${res.status}`);
  return res.json();
}

export async function createItem(payload: CreateItemPayload): Promise<Item> {
  const res = await fetch(`/api/addItem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) throw new Error("Item already exists");
  if (!res.ok) {
    const message = await res.json();
    throw new Error(`(${res.status}) ${message.error}`);
  }
  return res.json();
}

export async function updateItem(barcode: string, payload: UpdateItemPayload): Promise<Item> {
  const res = await fetch(`/api/items/${barcode}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 429) throw new Error("Lookup busy");
  if (res.status === 404) throw new Error("Item not found");
  if (res.status === 409) throw new Error("Item already exists with this barcode");
  if (!res.ok) throw new Error(`Update item failed: ${res.status}`);
  return res.json();
}

export async function deleteItem(barcode: string): Promise<void> {
  const res = await fetch(`/api/items/${barcode}`, {
    method: "DELETE",
  });
  if (res.status === 429) throw new Error("Lookup busy");
  if (res.status === 400) throw new Error("Cannot delete item with existing relationships");
  if (!res.ok) throw new Error(`Delete item failed: ${res.status}`);
}

// Get items filtered by a specific location
export async function getItemsByLocation(locationId: number): Promise<Item[]> {
  const res = await fetch(`/api/items/locations/${locationId}?household=${1}`); // TODO: get household from context
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Get items by location failed: ${res.status}`);
  return res.json();
}

// Get all locations to show as filter options
export async function getAllLocations(): Promise<any[]> {
  const res = await fetch("/api/locations");
  if (!res.ok) return [];
  return res.json();
}
