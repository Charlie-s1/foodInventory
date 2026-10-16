import { useCallback, useState } from "react";
import { lookupProduct, type LookupResponse } from "../../api/products";
import { Scanner } from "../../components/scanner";
import { createItem, type CreateItemPayload } from "../../api/items";
import { VscLoading } from "react-icons/vsc";
import { MdCheckCircle, MdClose } from "react-icons/md";
import { tmpProduct } from "../../api/tmp.food";

const ScanPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<LookupResponse | null>(tmpProduct);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemDetails, setItemDetails] = useState<CreateItemPayload>({
    barcode: scannedProduct?.product?.code || "",
    name: scannedProduct?.product?.product_name || "",
    brand: scannedProduct?.product?.brands || "",
    category: scannedProduct?.product?.categories || "",
    unit: "unit",
    quantity: 1,
    icon: scannedProduct?.product?.image_url || "",
    household_id: 1,
  });

  const handleScan = useCallback(async (code: string) => {
    setIsLoading(true);
    setIsScanning(false);
    try {
      const response = await lookupProduct(code);
      if (response.found && response.product) {
        setScannedProduct(response);
        setIsLoading(false);
        // Show the add item form after successful scan of a known product
        setItemDetails({
          barcode: code,
          name: response.product.product_name ?? "",
          brand: response.product.brands ?? "",
          category: response.product.categories ?? "",
          unit: "unit",
          quantity: 1,
          icon: response.product.image_url ?? "",
          household_id: 1,
        });
        setIsAddingItem(true);
      } else {
        console.log("Product not found");
      }
    } catch (err) {
      console.log(err);
    }
  }, []);

  const handleAddItem = useCallback(async () => {
    try {
      await createItem(itemDetails);
      // Reset and rescan
      setIsAddingItem(false);
      setScannedProduct(null);
      setIsLoading(true);
      setIsScanning(true);
    } catch (err: any) {
      console.error(err);
    }
  }, [itemDetails]);

  const handleScanAgain = useCallback(() => {
    setIsAddingItem(false);
    setScannedProduct(null);
    setIsLoading(true);
    setIsScanning(true);
  }, []);

  const handleDiscard = useCallback(() => {
    setIsAddingItem(false);
    setScannedProduct(null);
  }, []);

  if (isScanning) return <Scanner onScan={handleScan} setIsPageLoading={setIsLoading} />;
  if (isLoading)
    return (
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <VscLoading className="animate-spin text-purple-500 text-4xl" />
      </div>
    );

  if (!scannedProduct?.found && !isAddingItem) {
    return (
      <div className="bg-white p-8 max-w-md w-full text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Product Not Found</h2>
        <button
          className="w-full font-semibold py-3 px-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focusbg-ingigo-500"
          onClick={handleScanAgain}
        >
          Scan Again
        </button>
      </div>
    );
  }

  // Show item details form or success message
  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-md w-full overflow-hidden bg-white border border-gray-200 shadow-lg">
        {scannedProduct?.found && scannedProduct.product && (
          <>
            <div className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-xl px-4 py-3 w-full border border-gray-200">
                  <span className="text-sm text-gray-500 font-medium">Brand</span>
                  <p className="text-lg font-semibold text-gray-800 truncate">
                    {scannedProduct.product.brands}
                  </p>
                </div>
                <div className="rounded-xl px-4 py-3 w-full border border-gray-200">
                  <span className="text-sm text-gray-500 font-medium">Product</span>
                  <p className="text-lg font-semibold text-gray-800 truncate">
                    {scannedProduct.product.product_name}
                  </p>
                </div>
                <img
                  src={scannedProduct.product.image_url}
                  alt={scannedProduct.product.product_name}
                  className="w-full h-64 object-contain rounded-xl bg-white border border-gray-100"
                />
              </div>
            </div>

            {/* Item details form */}
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add to Inventory</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={itemDetails.quantity}
                      onChange={(e) =>
                        setItemDetails({ ...itemDetails, quantity: parseInt(e.target.value) || 1 })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={itemDetails.unit}
                      onChange={(e) => setItemDetails({ ...itemDetails, unit: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="unit">Unit</option>
                      <option value="pcs">Pieces</option>
                      <option value="kg">Kilograms</option>
                      <option value="g">Grams</option>
                      <option value="l">Liters</option>
                      <option value="ml">Milliliters</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={itemDetails.category}
                    onChange={(e) => setItemDetails({ ...itemDetails, category: e.target.value })}
                    placeholder="e.g., Produce, Dairy, Pantry"
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onClick={handleScanAgain}
                >
                  Scan Another
                </button>
                <button
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center space-x-2"
                  onClick={handleAddItem}
                >
                  <MdCheckCircle className="text-xl" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { ScanPage };
