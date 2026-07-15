import { config } from "@/config";
import type { MenuItem, SheetRow } from "@/types/menu";

function buildDriveUrl(fileId: string): string {
  if (!fileId) return "";
  const url = config.googleDrive.imageUrlFormat.replace("{FILE_ID}", fileId);
  return url;
}

function parseSheetRow(row: SheetRow, index: number): MenuItem {
  const fileId = row["ImageID"] || row["ImageFileId"] || row["image_id"] || "";
  return {
    id: String(index),
    name: row["Item Name"] || row["Name"] || row["name"] || "",
    nameAr: row["Name Arabic"] || row["name_ar"] || null,
    description: row["Description"] || row["description"] || "",
    descriptionAr: row["Description Arabic"] || row["description_ar"] || null,
    category: row["Category"] || row["category"] || "Other",
    categoryAr: row["Category Arabic"] || row["category_ar"] || null,
    price: Number(row["Price"] || row["price"] || 0),
    imageFileId: fileId,
    imageUrl: fileId ? buildDriveUrl(fileId) : "",
    available: (row["Available"] || row["available"] || "true").toLowerCase() !== "false",
    sortOrder: Number(row["Sort"] || row["sort_order"] || index),
    discount: row["Discount"] ? Number(row["Discount"]) : null,
    oldPrice: row["Old Price"] ? Number(row["Old Price"]) : null,
    popular: (row["Popular"] || row["popular"] || "").toLowerCase() === "true",
    isNew: (row["New"] || row["new_item"] || "").toLowerCase() === "true",
    calories: row["Calories"] ? Number(row["Calories"]) : null,
    ingredients: row["Ingredients"] || row["ingredients"] || null,
    allergens: row["Allergens"] || row["allergens"] || null,
    preparationTime: row["Prep Time"] || row["preparation_time"] ? Number(row["Prep Time"] || row["preparation_time"]) : null,
    rating: row["Rating"] || row["rating"] ? Number(row["Rating"] || row["rating"]) : null,
  };
}

let cachedData: { data: MenuItem[]; timestamp: number } | null = null;

export async function fetchMenuData(): Promise<MenuItem[]> {
  const now = Date.now();
  if (cachedData && now - cachedData.timestamp < config.cache.menuDataTTL) {
    return cachedData.data;
  }

  const { spreadsheetId, apiKey, sheetName } = config.googleSheets;
  const range = `${sheetName}!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Sheets API error: ${response.status}`);
  }

  const json = await response.json();
  const values: string[][] = json.values || [];

  if (values.length < 2) {
    return [];
  }

  const headers = values[0];
  const rows = values.slice(1);

  const items = rows.map((row, i) => {
    const rowObj: SheetRow = {};
    headers.forEach((h, j) => {
      rowObj[h] = row[j] || "";
    });
    return parseSheetRow(rowObj, i);
  });

  const sorted = items.sort((a, b) => a.sortOrder - b.sortOrder);

  cachedData = { data: sorted, timestamp: now };
  return sorted;
}

export interface CategoryItem {
  key: string;
  labelEn: string;
  labelAr: string;
}

export function getCategories(items: MenuItem[]): CategoryItem[] {
  const map = new Map<string, CategoryItem>();
  items.forEach((i) => {
    if (!map.has(i.category)) {
      map.set(i.category, {
        key: i.category,
        labelEn: i.category,
        labelAr: i.categoryAr || i.category,
      });
    }
  });
  return [
    { key: "all", labelEn: "All", labelAr: "الكل" },
    ...Array.from(map.values()),
  ];
}
