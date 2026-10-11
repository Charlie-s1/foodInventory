import { useCallback, useState } from "react";
import { lookupProduct, type LookupResponse } from "../../api/products";
import { Scanner } from "../../components/scanner";

const ScanPage = () => {
  const [isScanning, setIsScanning] = useState(true);
  const [scannedProduct, setScannedProduct] = useState<LookupResponse | null>(null);

  const handleScan = useCallback(async (code: string) => {
    console.log(code);
    setIsScanning(false);
    console.log(scannedProduct);
    try {
      setScannedProduct(await lookupProduct(code));
    } catch (err) {
      console.log(err);
    }
  }, []);

  if (isScanning) return <Scanner onScan={handleScan} />;

  return (
    <div className=" h-full  flex items-center justify-center p-4">
      {scannedProduct?.found && (
        <div className="rounded-2xl max-w-md w-full overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3 w-full border border-gray-200">
                <span className="text-sm text-gray-500 font-medium">Brand</span>
                <p className="text-lg font-semibold text-gray-800 truncate">
                  {scannedProduct.product?.brands}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 w-full border border-gray-200">
                <span className="text-sm text-gray-500 font-medium">Product</span>
                <p className="text-lg font-semibold text-gray-800 truncate">
                  {scannedProduct.product?.product_name}
                </p>
              </div>
              <img
                src={scannedProduct.product?.image_url}
                alt={scannedProduct.product?.product_name}
                className="w-full h-64 object-contain rounded-xl bg-white border border-gray-100"
              />
              <button
                className="w-full font-semibold py-3 px-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focusbg-ingigo-500"
                onClick={() => {
                  setIsScanning(true);
                  setScannedProduct(null);
                }}
              >
                Scan Again
              </button>
            </div>
          </div>
        </div>
      )}
      {!scannedProduct?.found && (
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600">
            This product is not in the database. You can add it manually.
          </p>
        </div>
      )}
    </div>
  );
};

export { ScanPage };
