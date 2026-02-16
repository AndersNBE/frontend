export type Category = "politics" | "sports" | "finance" | "entertainment";

export type MarketStatus = "open" | "closed" | "settled";

export type Market = {
  id: string;
  title: string;
  status: MarketStatus;
  yesPrice: number;
  noPrice: number;
  description?: string;
  category?: Category;
  volumeKr?: number;
};
