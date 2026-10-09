import { useEffect, useRef, useState } from "react";
import { BarcodeDetector } from "barcode-detector/ponyfill";
import { VscLoading } from "react-icons/vsc";

const Scanner = ({ onScan }: { onScan: (code: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          {<VscLoading className="animate-spin text-purple-500 text-4xl" />}
        </div>
      )}
      <video
        className="w-auto min-w-full min-h-full absolute z-10"
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
