import { useEffect, useState } from "react";
import { getItems, type Item } from "../api/items";
import { VscLoading } from "react-icons/vsc";

const PantreePage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch items when barcode is provided
  useEffect(() => {
    // if (!selectedBarcode) return;

    const fetchItems = async () => {
      try {
        setIsLoading(true);
        setError(null);

        getItems().then((items) => {
          setItems(items || []);
        });
        // For now, fetch all items (you can filter by household later if needed)
        // TODO: Add barcode filtering after backend supports it
      } catch (err: any) {
        console.error("Error fetching items:", err);
        setError(err.message || "Failed to fetch items");
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Handle barcode change - fetch for that household
  // const handleBarcodeChange = (barcode: string) => {
  //   setSelectedBarcode(barcode);
  // };

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

      {/* Items List */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="border  rounded-xl p-6 text-center">
              <p className="text-black-800 font-medium mb-2">No Items Found</p>
            </div>
          ) : (
            items.map((item) => <ItemCard key={item.id} item={item} />)
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
    const date =
      typeof timestamp === "number"
        ? timestamp / 1000
        : new Date(timestamp).toISOString().slice(0, 16);
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-2 items-center ">
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
            <span
              className={`text-xs px-2 py-1 rounded ${
                item.expites_at ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
              }`}
            >
              {item.expites_at ? `Expires: ${formatDate(item.expites_at)}` : "No expiry"}
            </span>
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

            <div>
              <span className="text-gray-500">Barcode:</span>
              <span className="ml-1 font-mono text-xs">{item.barcode}</span>
            </div>

            <div>
              <span className="text-gray-500">Added:</span>
              <span className="ml-1 text-xs">{formatDate(item.added_at)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
        <span>ID: {item.id}</span>
        <span>Household: {item.household_id}</span>
      </div>
    </div>
  );
};

export { PantreePage };
