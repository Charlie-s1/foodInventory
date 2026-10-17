import { useEffect, useState } from "react";
import { getItems, type Item, getItemsByLocation } from "../api/items";
import { createLocation, updateLocation, getLocations, type Location } from "../api/locations";
import { VscAdd, VscLoading } from "react-icons/vsc";

const PantreePage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Location form state
  const [showForm, setShowForm] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [locationForm, setLocationForm] = useState({
    name: "",
    parent_id: undefined as number | undefined,
    icon: "",
  });

  // Fetch items based on selected location or all items if no location selected
  useEffect(() => {
    fetchItems();
  }, [selectedLocationId]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (selectedLocationId !== null) {
        // Get items for the selected location
        const locationItems = await getItemsByLocation(selectedLocationId);
        setItems(locationItems || []);
      } else {
        // Get all items
        const allItems = await getItems();
        setItems(allItems || []);
      }
    } catch (err: any) {
      console.error("Error fetching items:", err);
      setError(err.message || "Failed to fetch items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = async (locationId: number | null) => {
    if (selectedLocationId === locationId) {
      setSelectedLocationId(null);
    } else {
      setSelectedLocationId(locationId);
    }
  };

  const handleAddLocation = () => {
    setEditingLocationId(null);
    setLocationForm({ name: "", parent_id: undefined, icon: "" });
    setShowForm(true);
  };

  // const handleEditLocation = (locationId: number) => {
  //   getLocation(locationId)
  //     .then((loc) => {
  //       setLocationForm({
  //         name: loc.name || "",
  //         parent_id: loc.parent_id ?? undefined,
  //         icon: loc.icon || "",
  //       });
  //       setEditingLocationId(loc.id);
  //       setShowForm(true);
  //     })
  //     .catch(console.error);
  // };

  // Need to import getLocation - will add it below

  // const handleBarcodeChange = (barcode: string) => {
  //   setSelectedBarcode(barcode);
  // };

  const handleSubmitLocation = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingLocationId !== null) {
        // Update existing location
        await updateLocation(editingLocationId, locationForm as any);
      } else {
        // Create new location
        await createLocation(locationForm as any);
      }

      setShowForm(false);
      fetchLocations();
    } catch (err: any) {
      console.error("Error saving location:", err);
      alert(err.message || "Failed to save location");
    }
  };

  const fetchLocations = async () => {
    try {
      const locs = await getLocations();
      setLocations(locs || []);
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  if (isLoading)
    return (
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <VscLoading className="animate-spin text-purple-500 text-4xl" />
      </div>
    );

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Location Filter */}
      {!isLoading && (
        <div className="">
          <div className="flex gap-2 overflow-auto pb-2">
            <div className="flex items-center justify-between ">
              <button
                onClick={handleAddLocation}
                className="flex items-center gap-2 h-full px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <VscAdd />
              </button>
            </div>
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleLocationSelect(loc.id)}
                className={`p-3 shrink-0 rounded-lg border text-left transition-all ${
                  selectedLocationId === loc.id
                    ? "bg-purple-50 border-purple-500 shadow-sm"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">
                      {loc.parent_id ? `${loc.parent_name}` : ""}
                    </p>
                    <p className="font-medium text-gray-800">{loc.name || "Unnamed Location"}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {/* Location Actions */}

          {/* Items List */}
          {!isLoading && !error && (
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="border rounded-xl p-6 text-center">
                  <p className="text-gray-700 font-medium mb-2">
                    {selectedLocationId ? "No items in this location" : "No Items Found"}
                  </p>
                  {selectedLocationId && (
                    <button
                      onClick={() => handleLocationSelect(null)}
                      className="text-blue-600 hover:underline text-sm mt-2"
                    >
                      Show all items
                    </button>
                  )}
                </div>
              ) : (
                items.map((item) => <ItemCard key={item.id} item={item} />)
              )}
            </div>
          )}

          {/* Location Form Modal */}
          {showForm && (
            <div
              onClick={() => setShowForm(false)}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
              >
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {editingLocationId ? "Edit Location" : "Add New Location"}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitLocation} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={locationForm.name}
                      onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                      placeholder="e.g., Fridge, Pantry, Closet"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Location (optional)
                    </label>
                    {locations.filter((l) => !l.parentI_id).length > 0 ? (
                      <select
                        value={locationForm.parent_id || ""}
                        onChange={(e) =>
                          setLocationForm({
                            ...locationForm,
                            parent_id: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">No parent (root level)</option>
                        {locations
                          .filter((l) => !l.parent_id)
                          .map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name} ({loc.id})
                            </option>
                          ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-500">No root locations available</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon URL (optional)
                    </label>
                    <input
                      type="url"
                      value={locationForm.icon}
                      onChange={(e) => setLocationForm({ ...locationForm, icon: e.target.value })}
                      placeholder="https://example.com/icon.png"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingLocationId ? "Save Changes" : "Create Location"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Item Card Component
interface ItemCardProps {
  item: Item;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const formatDate = (timestamp: number | string) => {
    if (!timestamp) return "";

    // Convert to number if string
    const ts = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
    const now = Date.now();
    const diffMs = ts - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Handle expired items
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} ago`;
    }

    // Handle future dates with relative time
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === 7) return "In one week";
    if (diffDays < 7) return `In ${diffDays} day${diffDays !== 1 ? "s" : ""}`;

    // Show date for further dates
    const date = new Date(ts);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Include year if different from current year
    return date.toLocaleDateString(undefined, { 
      month: "short", 
      day: "numeric",
      year: (date.getFullYear() !== today.getFullYear()) ? "numeric" : undefined
    });
  };

  // Get badge color based on days until expiration
  const getBadgeColor = (diffDays: number): string => {
    if (diffDays < 0) return "bg-black text-white"; // Expired
    if (diffDays === 0) return "bg-red-100 text-red-800"; // Today
    if (diffDays === 1) return "bg-orange-100 text-orange-800"; // Tomorrow
    if (diffDays <= 7) return "bg-yellow-100 text-yellow-800"; // Within a week
    if (diffDays <= 30) return "bg-blue-100 text-blue-800"; // Within a month
    return "bg-green-100 text-green-800"; // Far away
  };

  const badgeColor = item.expires_at
    ? getBadgeColor(
        Math.ceil((new Date(item.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      )
    : "bg-gray-100 text-gray-500";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 pb-6 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex gap-2 items-center relative">
        {item.icon && (
          <div>
            <img
              src={item.icon}
              alt={`${item.name} icon`}
              className="w-16 h-16 object-contain bg-gray-50 rounded"
            />
          </div>
        )}
        <div className="w-full">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-800">
              {item.brand ? `${item.brand} - ` : ""}
              {item.name || "Unnamed Item"}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Quantity:</span>
              <span className="ml-1 font-medium">
                {item.quantity} {item.unit || "unit"}
              </span>
            </div>

            <div>
              <span className="text-gray-500">Category:</span>
              <span className="ml-1">{item.category || "N/A"}</span>
            </div>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-tl-xl absolute -right-4 -bottom-6 ${badgeColor}`}
          >
            {item.expires_at ? `Exp: ${formatDate(+item.expires_at)}` : "No expiry"}
          </span>
        </div>
      </div>
    </div>
  );
};

export { PantreePage };
