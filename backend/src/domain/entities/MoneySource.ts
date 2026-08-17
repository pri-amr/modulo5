export interface MoneySource {
  id: string;
  userId: string;
  name: string;
  virtual: boolean;
  amountARS: number;
  amountUSD: number;
}
