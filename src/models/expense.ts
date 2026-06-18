export type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: number;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: number;
  updatedAt?: number;
};