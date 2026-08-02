import { z } from 'zod';

const DATE_FORMAT_REGEX = /^\d{2}-\d{2}-\d{4}$/;

const isLeapYear = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const isRealDate = (value: string): boolean => {
  const [day, month, year] = value.split('-').map(Number);

  if (month < 1 || month > 12) {
    return false;
  }

  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return day >= 1 && day <= daysInMonth[month - 1];
};

export const CreateTransactionRequestSchema = z
  .object({
    type: z.enum(['ingreso', 'egreso']),
    amount: z.number().gt(0, 'amount debe ser un número mayor a 0'),
    moneySourceId: z.string().trim().min(1, 'moneySourceId es requerido'),
    currency: z.enum(['ARS', 'USD']),
    categoryId: z.string().trim().min(1, 'categoryId es requerido'),
    date: z
      .string()
      .regex(DATE_FORMAT_REGEX, 'date debe tener el formato DD-MM-YYYY')
      .refine(isRealDate, 'date no corresponde a una fecha real'),
    description: z
      .string()
      .trim()
      .min(1, 'description es requerido')
      .max(500, 'description no puede superar los 500 caracteres'),
  })
  .strict();

export type CreateTransactionRequestDto = z.infer<typeof CreateTransactionRequestSchema>;
