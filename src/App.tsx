import { useEffect, useMemo, useRef, useState } from "react";
import { FrameCanvas, useFrameSequence } from "@/components/FrameSequence";
import { useMenuData, useMenuFilter } from "@/hooks/use-menu";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { MenuCard } from "@/components/MenuCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Sparticles } from "@/components/Sparticles";

function LoadingScreen({ ready, progress }: { ready: boolean; progress: number }) {
  const [show, setShow] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (ready) {
      setFading(true);
      const t = setTimeout(() => setShow(false), 800);
      return () => clearTimeout(t);
    }
  }, [ready]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-700"
      style={{ opacity: fading ? 0 : 1, backgroundColor: "var(--background)" }}
    >
      <span
        className="text-4xl md:text-5xl tracking-[0.25em] text-gold mb-6"
        style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
      >
        COVO
      </span>
      <div className="w-40 h-[2px] bg-black/10 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gold rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-[11px] tracking-[0.3em] text-muted-foreground">{progress}%</span>
    </div>
  );
}

const NAV = [
  { en: "Menu", ar: "القائمة", href: "#menu" },
  { en: "Reserve", ar: "احجز", href: "#reserve" },
];

export default function App() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const isAr = lang === "ar";
  const t = {
    tagline: isAr ? "مطعم كوفو · تجربة سينمائية فاخرة" : "Restaurant & Lounge",
    hero1: isAr ? "ادخل" : "STEP",
    hero2: isAr ? "إلى الداخل" : "INSIDE",
    scrollHint: isAr ? "مرّر للدخول" : "SCROLL TO ENTER",
    chapter1Title: isAr ? "الواجهة" : "THE FAÇADE",
    chapter1Body: isAr
      ? "حجر منحوت. ضوء دافئ. مساء يبدأ بلمسة كاميرا."
      : "Hand-cut stone. Warm light. An evening that begins with a single frame.",
    chapter2Title: isAr ? "الدخول" : "CROSS THE THRESHOLD",
    chapter2Body: isAr
      ? "خطوة واحدة تفصل بين المدينة والصمت المضاء."
      : "One step separates the city from the lit-in silence.",
    chapter3Title: isAr ? "المطبخ الحيّ" : "THE LIVE KITCHEN",
    chapter3Body: isAr
      ? "قوس من الحجر يفتح على مسرح النار والدقة."
      : "A stone arch opens onto a stage of fire and precision.",
    menuKicker: isAr ? "القائمة" : "THE MENU",
    menuTitle: isAr ? "مذاق كوفو" : "THE COVO SELECTION",
    menuSub: isAr
      ? "أطباق موقّعة، معكرونة، وحلويات — تُقدَّم كما يقدَّم فيلم."
      : "Signature plates, pasta, and dessert — plated the way a film is edited.",
    addToCart: isAr ? "أضف إلى الطلب" : "Add to Order",
    yourCart: isAr ? "طلبك" : "Your Order",
    empty: isAr ? "طلبك فارغ." : "Your order is empty.",
    total: isAr ? "الإجمالي" : "Total",
    checkout: isAr ? "إتمام الطلب" : "Reserve & Order",
    iqd: isAr ? "د.ع" : "IQD",
    loading: isAr ? "…جاري التحميل" : "Loading menu…",
    catAll: isAr ? "الكل" : "All",
    searchPlaceholder: isAr ? "ابحث عن طبق..." : "Search for a dish...",
    footerLine: isAr
      ? "كوفو · وُلد للحظات التي تستحق التوقف"
      : "COVO · CRAFTED FOR MOMENTS WORTH PAUSING FOR",
  };

  const frames = useFrameSequence();

  // Smooth scroll via lenis
  useEffect(() => {
    let raf = 0;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let cancelled = false;
    const mobile = window.innerWidth < 768;
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({
        lerp: mobile ? 0.15 : 0.09,
        wheelMultiplier: mobile ? 0.8 : 1,
        smoothWheel: true,
        touchMultiplier: 1.5,
      });
      const loop = (t: number) => {
        lenis?.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);

  // Scroll progress for cinematic pinned section
  const cinemaRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = cinemaRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = el.offsetHeight - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(total > 0 ? scrolled / total : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Menu data from Google Sheets
  const { items, loading, error, categories } = useMenuData();
  const { search, setSearch, activeCategory, setActiveCategory, filtered } = useMenuFilter(items);

  // Preload ALL frames + menu data
  const [loadProgress, setLoadProgress] = useState(0);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    const total = 86;
    let loaded = 0;

    const promises = Array.from({ length: total }, (_, i) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loaded++;
          setLoadProgress(Math.round((loaded / total) * 100));
          resolve();
        };
        img.src = `${base}frames/frame-${String(i + 1).padStart(3, "0")}.jpg`;
      });
    });

    Promise.all(promises).then(() => setPageReady(true));
  }, []);

  // Cart
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = items.reduce((sum, it) => sum + (cart[it.id] || 0) * it.price, 0);
  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const remove = (id: string) =>
    setCart((c) => {
      const n = (c[id] || 0) - 1;
      const { [id]: _drop, ...rest } = c;
      return n <= 0 ? rest : { ...c, [id]: n };
    });

  // Reveal-on-scroll for menu rows
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = menuRef.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
    targets.forEach((el) => el.classList.add("reveal-init"));
    let delay = 0;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        visible.forEach((e) => {
          (e.target as HTMLElement).style.transitionDelay = `${delay * 60}ms`;
          delay++;
          e.target.classList.add("reveal-in");
          io.unobserve(e.target);
        });
        if (visible.length) delay = 0;
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [filtered.length]);

  // Chapter opacities across the cinematic scroll
  const chapterOpacity = (start: number, end: number) => {
    const fadeIn = 0.06;
    if (progress < start - fadeIn) return 0;
    if (progress > end + fadeIn) return 0;
    if (progress < start) return (progress - (start - fadeIn)) / fadeIn;
    if (progress > end) return 1 - (progress - end) / fadeIn;
    return 1;
  };

  const canvasScale = 1 + progress * 0.14;
  const canvasBlur = progress > 0.92 ? (progress - 0.92) * 40 : 0;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div
      className={`relative min-h-screen bg-noir text-foreground ${isAr ? "font-arabic" : ""}`}
      dir={isAr ? "rtl" : "ltr"}
      lang={isAr ? "ar" : "en"}
    >
      <LoadingScreen ready={pageReady && !loading} progress={loadProgress} />

      {/* Fixed floating navbar */}
      <header className="fixed top-4 inset-x-0 z-50 px-4 md:px-8">
        <div className="max-w-6xl mx-auto glass rounded-full px-5 md:px-8 py-3 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <span
              className={`text-2xl md:text-3xl tracking-[0.25em] text-gold ${isAr ? "font-arabic" : ""}`}
              style={{ fontFamily: isAr ? undefined : "var(--font-display)" }}
            >
              COVO
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-[11px] tracking-[0.28em] text-foreground/60">
            {NAV.map((l) => (
              <a key={l.en} href={l.href} className="hover:text-foreground transition">
                {isAr ? l.ar : l.en.toUpperCase()}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(isAr ? "en" : "ar")}
              className="text-[11px] tracking-[0.25em] px-3 py-1 rounded-full border border-black/15 hover:border-gold/60 hover:text-gold transition"
            >
              {isAr ? "EN" : "ع"}
            </button>
          </div>
        </div>
      </header>

      {/* ============ CINEMATIC SCROLL ============ */}
      <section
        id="top"
        ref={cinemaRef}
        className="relative"
        style={{ height: isMobile ? "300vh" : "500vh" }}
      >
        <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
          <div
            className="absolute inset-0 will-change-transform"
            style={{
              transform: `scale(${canvasScale})`,
              filter: isMobile ? "none" : `blur(${canvasBlur}px)`,
              transition: "filter 200ms linear",
            }}
          >
            <FrameCanvas progress={progress} className="w-full h-full block" />
          </div>

          <div className="pointer-events-none absolute inset-0"
               style={{
                 background:
                   "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%), linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 20%, transparent 70%, rgba(0,0,0,0.7) 100%)",
               }}
          />
          <div className="pointer-events-none absolute inset-0 bg-radial-gold opacity-70 mix-blend-screen" />

          {/* Chapter 1 */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
            style={{ opacity: chapterOpacity(0, 0.22), transform: `translateY(${(1 - chapterOpacity(0, 0.22)) * 20}px)` }}
          >
            <p className="text-[11px] tracking-[0.5em] text-gold/80 mb-6">{t.tagline}</p>
            <h1
              className={`text-6xl md:text-[9rem] leading-[0.9] text-gold ${isAr ? "font-arabic" : ""}`}
              style={{ fontFamily: isAr ? undefined : "var(--font-display)", fontWeight: 400, letterSpacing: "0.02em" }}
            >
              {t.hero1}
              <br />
              <span className="italic text-foreground/95">{t.hero2}</span>
            </h1>
            <div className="mt-10 flex flex-col items-center gap-3 text-[11px] tracking-[0.4em] text-gold glow-pulse-strong">
              <span className="w-10 h-px bg-gold/80" />
              {t.scrollHint}
              <span className="w-10 h-px bg-gold/80" />
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gold mt-2 bounce-arrow drop-shadow-[0_0_12px_rgba(212,168,67,0.8)]"
              >
                <path d="M12 5v14" />
                <path d="m19 12-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Chapter 2 */}
          <div
            className="absolute inset-x-0 bottom-24 flex flex-col items-center justify-end text-center px-6"
            style={{ opacity: chapterOpacity(0.28, 0.48) }}
          >
            <div className="glass rounded-2xl px-8 py-6 max-w-xl">
              <p className="text-[10px] tracking-[0.5em] text-gold mb-3">— 01 —</p>
              <h2
                className={`text-3xl md:text-5xl mb-3 ${isAr ? "font-arabic" : ""}`}
                style={{ fontFamily: isAr ? undefined : "var(--font-display)", fontStyle: "italic" }}
              >
                {t.chapter1Title}
              </h2>
              <p className={`text-sm md:text-base text-foreground/70 ${isAr ? "font-arabic" : ""}`}>{t.chapter1Body}</p>
            </div>
          </div>

          {/* Chapter 3 */}
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center text-center px-6"
            style={{ opacity: chapterOpacity(0.5, 0.7) }}
          >
            <div className="glass rounded-2xl px-8 py-6 max-w-xl">
              <p className="text-[10px] tracking-[0.5em] text-gold mb-3">— 02 —</p>
              <h2
                className={`text-3xl md:text-5xl mb-3 ${isAr ? "font-arabic" : ""}`}
                style={{ fontFamily: isAr ? undefined : "var(--font-display)", fontStyle: "italic" }}
              >
                {t.chapter2Title}
              </h2>
              <p className={`text-sm md:text-base text-foreground/70 ${isAr ? "font-arabic" : ""}`}>{t.chapter2Body}</p>
            </div>
          </div>

          {/* Chapter 4 */}
          <div
            className="absolute inset-x-0 bottom-32 flex flex-col items-center text-center px-6"
            style={{ opacity: chapterOpacity(0.72, 0.92) }}
          >
            <div className="glass rounded-2xl px-8 py-6 max-w-xl">
              <p className="text-[10px] tracking-[0.5em] text-gold mb-3">— 03 —</p>
              <h2
                className={`text-3xl md:text-5xl mb-3 ${isAr ? "font-arabic" : ""}`}
                style={{ fontFamily: isAr ? undefined : "var(--font-display)", fontStyle: "italic" }}
              >
                {t.chapter3Title}
              </h2>
              <p className={`text-sm md:text-base text-foreground/70 ${isAr ? "font-arabic" : ""}`}>{t.chapter3Body}</p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="absolute top-1/2 right-4 md:right-8 -translate-y-1/2 flex flex-col items-center gap-3">
            <div className="w-px h-40 bg-white/10 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-full bg-gold"
                style={{ height: `${progress * 100}%`, boxShadow: "0 0 10px var(--gold)" }}
              />
            </div>
            <span className="text-[9px] tracking-[0.3em] text-foreground/40 [writing-mode:vertical-rl]">
              {String(Math.round(progress * 100)).padStart(2, "0")}%
            </span>
          </div>

          <div className="hidden md:block absolute bottom-6 left-6 text-[10px] tracking-[0.3em] text-foreground/30 font-mono">
            {String(Math.min(frames.length, Math.round(progress * (frames.length - 1)) + 1)).padStart(3, "0")} / {String(frames.length).padStart(3, "0")}
          </div>
        </div>
      </section>

      {/* ============ MENU ============ */}
      <section id="menu" className="relative bg-noir overflow-hidden">
        <Sparticles count={40} />
        <div className="relative -mt-24 pt-24 pb-16">
          <div className="max-w-4xl mx-auto text-center px-6 fade-up">
            <p className="text-[11px] tracking-[0.5em] text-gold mb-5">— {t.menuKicker} —</p>
            <h2
              className={`text-5xl md:text-7xl mb-4 ${isAr ? "font-arabic" : ""}`}
              style={{
                fontFamily: isAr ? undefined : "var(--font-display)",
                fontWeight: 300,
                letterSpacing: "0.02em",
              }}
            >
              {t.menuTitle}
            </h2>
            <div className="hairline max-w-xs mx-auto my-6" />
            <p className={`text-muted-foreground max-w-xl mx-auto ${isAr ? "font-arabic" : ""}`}>{t.menuSub}</p>
          </div>

          <CategoryFilter
            categories={categories}
            active={activeCategory}
            onSelect={setActiveCategory}
            isAr={isAr}
          />

          <div className="max-w-3xl mx-auto mt-6 px-6">
            <SearchBar
              value={search}
              onChange={setSearch}
              isAr={isAr}
              placeholder={t.searchPlaceholder}
            />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-24" ref={menuRef}>
          {loading && <LoadingSkeleton />}
          {error && <ErrorMessage message={error} onRetry={handleRetry} />}
          {!loading && !error && (
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {filtered.map((it) => (
                <MenuCard
                  key={it.id}
                  item={it}
                  isAr={isAr}
                  onAddToCart={add}
                  iqdLabel={t.iqd}
                  addToCartLabel={t.addToCart}
                />
              ))}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && items.length > 0 && (
            <p className="text-center text-muted-foreground py-10 text-sm">No items found.</p>
          )}
          {!loading && !error && items.length === 0 && (
            <p className="text-center text-muted-foreground py-10 text-sm">No menu items available.</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer id="reserve" className="relative border-t border-black/5 bg-ink">
        <div className="max-w-6xl mx-auto px-6 py-14 text-center">
          <div
            className={`text-3xl tracking-[0.35em] text-gold mb-3 ${isAr ? "font-arabic" : ""}`}
            style={{ fontFamily: isAr ? undefined : "var(--font-display)" }}
          >
            COVO
          </div>
          <p className={`text-[11px] tracking-[0.35em] text-muted-foreground ${isAr ? "font-arabic tracking-normal" : ""}`}>
            {t.footerLine}
          </p>
          <div className="hairline max-w-xs mx-auto my-6" />
          <p className="text-[10px] tracking-[0.3em] text-muted-foreground/60 font-mono">
            © {new Date().getFullYear()} COVO · ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>

      {/* Floating cart */}
      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full glass-strong text-gold grid place-items-center hover:scale-105 transition float-slow shadow-lg"
        aria-label="Open order"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gold text-primary-foreground text-[10px] w-5 h-5 rounded-full grid place-items-center font-semibold">
            {cartCount}
          </span>
        )}
      </button>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <aside
            className="drawer-in relative w-full max-w-md bg-white border-l border-black/10 h-full shadow-2xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-2xl ${isAr ? "font-arabic" : ""}`}
                style={{ fontFamily: isAr ? undefined : "var(--font-display)", fontStyle: "italic" }}
              >
                {t.yourCart}
              </h3>
              <button onClick={() => setCartOpen(false)} className="text-muted-foreground hover:text-gold">✕</button>
            </div>
            <div className="space-y-4">
              {Object.keys(cart).length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-10">{t.empty}</p>
              )}
              {items.filter((it) => cart[it.id]).map((it) => {
                const name = isAr && it.nameAr ? it.nameAr : it.name;
                return (
                  <div key={it.id} className="flex items-center gap-3 glass rounded-xl p-3">
                    {it.imageUrl && <img src={it.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className={`truncate ${isAr ? "font-arabic" : ""}`}>{name}</p>
                      <p className="text-xs text-gold font-mono">{(it.price * cart[it.id]).toLocaleString()} {t.iqd}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => remove(it.id)} className="w-7 h-7 rounded-full border border-black/15 hover:border-gold hover:text-gold">−</button>
                      <span className="w-5 text-center text-sm">{cart[it.id]}</span>
                      <button onClick={() => add(it.id)} className="w-7 h-7 rounded-full border border-black/15 hover:border-gold hover:text-gold">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            {cartCount > 0 && (
              <div className="mt-8 space-y-4">
                <div className="hairline" />
                <div className="flex items-center justify-between">
                  <span className="text-xs tracking-[0.3em] text-muted-foreground">{t.total.toUpperCase()}</span>
                  <span className="text-2xl text-gold font-mono">{subtotal.toLocaleString()} {t.iqd}</span>
                </div>
                <button className={`w-full rounded-full bg-gold text-primary-foreground py-3.5 text-[11px] tracking-[0.35em] hover:bg-gold-soft transition ${isAr ? "font-arabic tracking-normal" : "uppercase"}`}>
                  {t.checkout}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
