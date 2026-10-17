// Location types
export interface Location {
  id: number;
  household_id: number;
  parent_id?: number;
  name: string;
  icon?: string;
  sort_order: number;
  children?: Location[];
  parentI_id?: number;
  parent_name?: string;
  parentIcon?: string;
}

export interface CreateLocationPayload {
  name: string;
  parent_id?: number | null;
  icon?: string;
}

export interface UpdateLocationPayload extends Partial<CreateLocationPayload> {}

// Fetch all locations (nested tree structure)
export async function getLocations(): Promise<Location[]> {
  const res = await fetch("/api/locations");
  if (!res.ok) throw new Error(`Get locations failed: ${res.status}`);
  return res.json();
}

// Fetch a single location by ID
export async function getLocation(id: number): Promise<Location> {
  const res = await fetch(`/api/locations/${id}`);
  if (res.status === 404) throw new Error("Location not found");
  if (!res.ok) throw new Error(`Get location failed: ${res.status}`);
  return res.json();
}

// Fetch root locations (top-level categories only)
export async function getRootLocations(): Promise<Location[]> {
  const res = await fetch("/api/locations/root");
  if (!res.ok) throw new Error(`Get root locations failed: ${res.status}`);
  return res.json();
}

// Fetch child locations under a specific parent
export async function getChildLocations(parentId: number): Promise<Location[]> {
  const res = await fetch(`/api/locations/${parentId}/children`);
  if (res.status === 404) throw new Error("Parent location not found");
  if (!res.ok) throw new Error(`Get child locations failed: ${res.status}`);
  return res.json();
}

// Create a new location
export async function createLocation(payload: CreateLocationPayload): Promise<Location> {
  const res = await fetch("/api/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) throw new Error("Location with this name already exists");
  if (!res.ok) throw new Error(`Create location failed: ${res.status}`);
  return res.json();
}

// Update an existing location
export async function updateLocation(
  id: number,
  payload: UpdateLocationPayload,
): Promise<Location> {
  const res = await fetch(`/api/locations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 404) throw new Error("Location not found");
  if (res.status === 409) throw new Error("A location with this name already exists");
  if (!res.ok) throw new Error(`Update location failed: ${res.status}`);
  return res.json();
}

// Delete a location
export async function deleteLocation(id: number): Promise<void> {
  const res = await fetch(`/api/locations/${id}`, {
    method: "DELETE",
  });
  if (res.status === 400) throw new Error("Cannot delete location with items");
  if (res.status === 404) throw new Error("Location not found");
  if (!res.ok) throw new Error(`Delete location failed: ${res.status}`);
}

// Move a location under a different parent
export async function moveLocation(id: number, parentId: number | null): Promise<Location> {
  const payload = { parentId };
  const res = await fetch(`/api/locations/${id}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 404) throw new Error("Location not found or parent not found");
  if (res.status === 409)
    throw new Error("A location with this name already exists in the target category");
  if (!res.ok) throw new Error(`Move location failed: ${res.status}`);
  return res.json();
}
