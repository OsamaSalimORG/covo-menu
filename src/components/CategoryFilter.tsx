import type { CategoryItem } from "@/services/google-sheets";

interface CategoryFilterProps {
  categories: CategoryItem[];
  active: string;
  onSelect: (cat: string) => void;
  isAr: boolean;
}

export function CategoryFilter({ categories, active, onSelect, isAr }: CategoryFilterProps) {
  return (
    <div className="max-w-3xl mx-auto mt-10 px-6 flex flex-wrap justify-center gap-2">
      {categories.map((c) => {
        const label = isAr ? c.labelAr : c.labelEn;
        const isActive = c.key === active;
        return (
          <button
            key={c.key}
            onClick={() => onSelect(c.key)}
            className={`text-[11px] tracking-[0.3em] px-5 py-2 rounded-full border transition ${
              isActive
                ? "border-gold text-gold bg-gold/5"
                : "border-black/10 text-muted-foreground hover:border-black/25 hover:text-foreground"
            } ${isAr ? "font-arabic tracking-normal" : "uppercase"}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
