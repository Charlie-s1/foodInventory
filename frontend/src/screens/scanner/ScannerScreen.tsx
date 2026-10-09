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
    <p>
      {scannedProduct?.found && (
        <p>
          {scannedProduct.product?.product_name} ({scannedProduct.product?.brands})
        </p>
      )}
      {scannedProduct && !scannedProduct.found && <p>Not in the database. Add it manually.</p>}
    </p>
  );
};

export { ScanPage };
