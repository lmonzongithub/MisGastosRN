export type ExpenseCategoryCode =
  | 'CLOTHES'
  | 'FOOD'
  | 'TRANSPORT'
  | 'HEALTH'
  | 'ENTERTAINMENT'
  | 'OTHER';

export const EXPENSE_CATEGORIES: ExpenseCategoryCode[] = [
  'CLOTHES',
  'FOOD',
  'TRANSPORT',
  'HEALTH',
  'ENTERTAINMENT',
  'OTHER',
];

export const CATEGORY_LABELS: Record<ExpenseCategoryCode, string> = {
  CLOTHES: 'Ropa',
  FOOD: 'Comida',
  TRANSPORT: 'Transporte',
  HEALTH: 'Salud',
  ENTERTAINMENT: 'Entretenimiento',
  OTHER: 'Otros',
};

export function normalizeCategory(category?: string | null): ExpenseCategoryCode {
  switch (category) {
    case 'CLOTHES':
    case 'Ropa':
    case 'Clothes':
    case 'Roupas':
      return 'CLOTHES';

    case 'FOOD':
    case 'Comida':
    case 'Food':
      return 'FOOD';

    case 'TRANSPORT':
    case 'Transporte':
    case 'Transport':
      return 'TRANSPORT';

    case 'HEALTH':
    case 'Salud':
    case 'Health':
    case 'Saúde':
      return 'HEALTH';

    case 'ENTERTAINMENT':
    case 'Entretenimiento':
    case 'Entertainment':
    case 'Entretenimento':
      return 'ENTERTAINMENT';

    case 'OTHER':
    case 'Otros':
    case 'Other':
    case 'Outros':
      return 'OTHER';

    default:
      return 'OTHER';
  }
}

export function getCategoryLabel(category?: string | null): string {
  const normalized = normalizeCategory(category);
  return CATEGORY_LABELS[normalized];
}