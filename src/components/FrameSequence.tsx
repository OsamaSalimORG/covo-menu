import { useEffect, useMemo, useRef, useState } from "react";

const FRAME_COUNT = 86;

function isMobile(): boolean {
  return window.innerWidth < 768;
}

function getFrameUrls(): string[] {
  const base = import.meta.env.BASE_URL;
  return Array.from({ length: FRAME_COUNT }, (_, i) =>
    `${base}frames/frame-${String(i + 1).padStart(3, "0")}.jpg`
  );
}

export function useFrameSequence() {
  return useMemo(getFrameUrls, []);
}

export interface FrameCanvasProps {
  progress: number;
  className?: string;
}

export function FrameCanvas({ progress, className }: FrameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [ready, setReady] = useState(false);
  const urls = useFrameSequence();
  const lastDrawnRef = useRef<number>(-1);
  const mobileRef = useRef(false);

  useEffect(() => {
    mobileRef.current = isMobile();
  }, []);

  // Preload frames — mobile: load every 2nd frame first, then fill gaps
  useEffect(() => {
    let cancelled = false;
    const imgs: HTMLImageElement[] = urls.map(() => {
      const img = new Image();
      img.decoding = "async";
      return img;
    });
    imagesRef.current = imgs;

    const mobile = isMobile();
    const primaryStep = mobile ? 2 : 1;

    // Load primary pass (all on desktop, every 2nd on mobile)
    let loaded = 0;
    const totalPrimary = Math.ceil(urls.length / primaryStep);

    function onLoadPrimary() {
      loaded++;
      if (loaded === 1 && !cancelled) setReady(true);
      if (loaded >= totalPrimary && !cancelled && mobile) {
        // Load remaining frames
        for (let i = 1; i < urls.length; i += 2) {
          if (!imgs[i].src) {
            imgs[i].src = urls[i];
          }
        }
      }
    }

    for (let i = 0; i < urls.length; i += primaryStep) {
      imgs[i].onload = onLoadPrimary;
      imgs[i].src = urls[i];
    }

    // Desktop: load all immediately
    if (!mobile) {
      for (let i = 1; i < urls.length; i++) {
        imgs[i].src = urls[i];
      }
    }

    return () => { cancelled = true; };
  }, [urls]);

  // Draw the appropriate frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const total = urls.length;
    const target = Math.min(total - 1, Math.max(0, Math.round(progress * (total - 1))));
    if (target === lastDrawnRef.current) return;

    const imgs = imagesRef.current;
    let idx = target;
    while (idx > 0 && !imgs[idx]?.complete) idx--;
    const img = imgs[idx];
    if (!img || !img.complete || !img.naturalWidth) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const dpr = Math.min(mobileRef.current ? 1.5 : 2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
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
    const onResize = () => { lastDrawnRef.current = -1; };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
