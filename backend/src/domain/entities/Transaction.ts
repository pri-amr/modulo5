export interface Transaction {
  id: string;
  userId: string;
  type: 'ingreso' | 'egreso';
  amount: number;
  moneySourceId: string;
  currency: 'ARS' | 'USD';
  categoryId: string;
  date: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
