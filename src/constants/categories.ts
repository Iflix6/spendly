import type Ionicons from "@expo/vector-icons/Ionicons";

export type CategoryId =
  | "food"
  | "transport"
  | "shopping"
  | "bills"
  | "fun"
  | "health";

export interface Category {
  id: CategoryId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const CATEGORIES: readonly Category[] = [
  { id: "food", label: "Food", icon: "restaurant-outline", color: "#FF8A5B" },
  {
    id: "transport",
    label: "Transport",
    icon: "car-outline",
    color: "#4D9DE0",
  },
  { id: "shopping", label: "Shopping", icon: "bag-outline", color: "#B779E8" },
  { id: "bills", label: "Bills", icon: "receipt-outline", color: "#F5B83D" },
  {
    id: "fun",
    label: "Fun",
    icon: "game-controller-outline",
    color: "#FF5D8F",
  },
  { id: "health", label: "Health", icon: "medical-outline", color: "#3DCB8F" },
];

export const CATEGORY_IDS: readonly CategoryId[] = CATEGORIES.map(
  (category) => category.id,
);

export const CATEGORY_BY_ID: Record<CategoryId, Category> = CATEGORIES.reduce(
  (byId, category) => {
    byId[category.id] = category;
    return byId;
  },
  {} as Record<CategoryId, Category>,
);

export const CATEGORY_SPEND_RANGES: Record<
  CategoryId,
  { minCents: number; maxCents: number }
> = {
  food: { minCents: 400, maxCents: 3500 },
  transport: { minCents: 300, maxCents: 2800 },
  shopping: { minCents: 1500, maxCents: 14000 },
  bills: { minCents: 2000, maxCents: 18000 },
  fun: { minCents: 800, maxCents: 6000 },
  health: { minCents: 1000, maxCents: 9000 },
};

export const CATEGORY_SEED_WEIGHTS: Record<CategoryId, number> = {
  food: 0.28,
  transport: 0.18,
  shopping: 0.17,
  bills: 0.17,
  fun: 0.12,
  health: 0.08,
};

export const FIXED_MONTHLY_BILLS: readonly {
  categoryId: CategoryId;
  note: string;
  amountCents: number;
  day: number;
}[] = [
  { categoryId: "bills", note: "Electricity", amountCents: 9650, day: 1 },
  { categoryId: "bills", note: "Internet", amountCents: 4500, day: 5 },
  { categoryId: "fun", note: "Netflix", amountCents: 1599, day: 12 },
];
