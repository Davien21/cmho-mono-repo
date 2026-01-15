export enum MediaCategory {
  INVENTORY = "inventory",
  BALANCE_SHEET = "balance_sheet",
  STOCK_UPDATE = "stock_update",
}

export interface IMedia {
  url: string;
  size: number;
  type: string;
  public_id: string;
  filename: string;
  category: MediaCategory;
  duration?: any;
}
