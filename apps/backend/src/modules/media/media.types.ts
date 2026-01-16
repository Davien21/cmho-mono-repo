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
  name?: string;
  category: MediaCategory;
  duration?: any;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
