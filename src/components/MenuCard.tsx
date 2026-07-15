import type { MenuItem } from "@/types/menu";
import { handleImageError, getPlaceholderImage } from "@/services/google-drive";

interface MenuCardProps {
  item: MenuItem;
  isAr: boolean;
  onAddToCart: (id: string) => void;
  iqdLabel: string;
  addToCartLabel: string;
}

export function MenuCard({ item, isAr, onAddToCart, iqdLabel, addToCartLabel }: MenuCardProps) {
  const name = isAr && item.nameAr ? item.nameAr : item.name;
  const desc = isAr && item.descriptionAr ? item.descriptionAr : item.description;

  return (
    <article
      data-reveal
      className="group relative glass rounded-3xl overflow-hidden flex flex-col md:flex-row hover:border-gold/40 transition-colors"
    >
      <div className="relative md:w-44 h-56 md:h-auto shrink-0 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={name}
            loading="lazy"
            onError={(e) => handleImageError(e, item.imageFileId)}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
        ) : (
          <img
            src={getPlaceholderImage()}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/50 md:from-transparent md:via-transparent md:to-[oklch(0.14_0.012_60)]" />
        {!item.available && (
          <div className="absolute inset-0 bg-black/60 grid place-items-center">
            <span className="text-[10px] tracking-[0.3em] text-foreground/70 uppercase">Unavailable</span>
          </div>
        )}
        {item.popular && (
          <div className="absolute top-3 left-3 bg-gold/90 text-primary-foreground text-[9px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full">
            Popular
          </div>
        )}
        {item.isNew && (
          <div className="absolute top-3 right-3 bg-foreground/90 text-background text-[9px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full">
            New
          </div>
        )}
      </div>
      <div className="flex-1 p-6 md:p-7 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3
              className={`text-2xl md:text-3xl leading-tight ${isAr ? "font-arabic" : ""}`}
              style={{ fontFamily: isAr ? undefined : "var(--font-display)", fontStyle: "italic" }}
            >
              {name}
            </h3>
            <div className="text-right whitespace-nowrap">
              {item.oldPrice && item.discount ? (
                <div className="flex flex-col items-end">
                  <span className="text-foreground/40 text-sm line-through font-mono">{item.oldPrice.toLocaleString()}</span>
                  <span className="text-gold text-lg font-mono">
                    {item.price.toLocaleString()}
                    <span className="text-[10px] tracking-[0.2em] ml-1 text-gold/70">{iqdLabel}</span>
                  </span>
                </div>
              ) : (
                <span className="text-gold text-lg font-mono">
                  {item.price.toLocaleString()}
                  <span className="text-[10px] tracking-[0.2em] ml-1 text-gold/70">{iqdLabel}</span>
                </span>
              )}
            </div>
          </div>
          <p className={`text-sm text-foreground/60 leading-relaxed ${isAr ? "font-arabic" : ""}`}>{desc}</p>
          {item.rating && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-gold text-sm">{item.rating}</span>
              <span className="text-[10px] text-foreground/40">/5</span>
            </div>
          )}
        </div>
        <button
          onClick={() => item.available && onAddToCart(item.id)}
          disabled={!item.available}
          className={`mt-5 self-start rounded-full border border-gold/40 text-gold hover:bg-gold hover:text-primary-foreground px-6 py-2.5 text-[11px] tracking-[0.3em] transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gold ${isAr ? "font-arabic tracking-normal" : "uppercase"}`}
        >
          + {addToCartLabel}
        </button>
      </div>
    </article>
  );
}
