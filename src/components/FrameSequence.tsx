import { useEffect, useMemo, useRef, useState } from "react";

const FRAME_COUNT = 86;

function getFrameUrls(): string[] {
  return Array.from({ length: FRAME_COUNT }, (_, i) =>
    `/frames/frame-${String(i + 1).padStart(3, "0")}.jpg`
  );
}

export function useFrameSequence() {
  return useMemo(getFrameUrls, []);
}

export interface FrameCanvasProps {
  /** 0 -> 1 progress across the pinned scroll range */
  progress: number;
  className?: string;
}

/**
 * A pinned <canvas> that plays a JPEG sequence based on scroll progress.
 * Preloads eagerly for buttery smoothness. Handles HiDPI.
 */
export function FrameCanvas({ progress, className }: FrameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [ready, setReady] = useState(false);
  const urls = useFrameSequence();
  const lastDrawnRef = useRef<number>(-1);

  // Preload frames
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const imgs: HTMLImageElement[] = urls.map((url, i) => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      img.onload = () => {
        loaded++;
        // Show as soon as first frame ready; keep loading rest in background
        if (i === 0 && !cancelled) setReady(true);
      };
      return img;
    });
    imagesRef.current = imgs;
    return () => {
      cancelled = true;
    };
  }, [urls]);

  // Draw the appropriate frame whenever progress changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const total = urls.length;
    const target = Math.min(total - 1, Math.max(0, Math.round(progress * (total - 1))));
    if (target === lastDrawnRef.current) return;

    // Pick the nearest already-loaded frame (avoids blanks while preloading)
    let idx = target;
    const imgs = imagesRef.current;
    while (idx > 0 && !imgs[idx]?.complete) idx--;
    const img = imgs[idx];
    if (!img || !img.complete || !img.naturalWidth) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    // cover-fit
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max((w * dpr) / iw, (h * dpr) / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (w * dpr - dw) / 2;
    const dy = (h * dpr - dh) / 2;
    ctx.fillStyle = "#0a0806";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, dx, dy, dw, dh);
    lastDrawnRef.current = target;
  }, [progress, ready, urls.length]);

  // Redraw on resize
  useEffect(() => {
    const onResize = () => {
      lastDrawnRef.current = -1;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}