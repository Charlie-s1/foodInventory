import { useEffect, useRef, useState } from "react";
import { BarcodeDetector } from "barcode-detector/ponyfill";

const Scanner = ({ onScan }: { onScan: (code: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;
    let raf = 0;
    const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
      if (stopped) return stream?.getTracks().forEach((t) => t.stop());
      const video = videoRef.current!;
      video.srcObject = stream;
      await video?.play();

      const tick = async () => {
        if (stopped) return;
        const codes = await detector.detect(video);
        if (codes.length) return onScan(codes[0].rawValue);
        raf = requestAnimationFrame(tick);
      };
      tick();
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onScan]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <video
        className="w-auto min-w-full min-h-full bg-black absolute z-10"
        ref={videoRef}
        playsInline
        muted
        autoPlay
      />
    </div>
  );
};

const ScanPage = () => {
  const [code, setCode] = useState<string | null>(null);

  return code ? (
    <p>
      Scanned: {code} <button onClick={() => setCode(null)}>Scan Again</button>
    </p>
  ) : (
    <Scanner onScan={setCode} />
  );
};

export { ScanPage };
