import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
  barcode?: string;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  location: string;
  debt: number;
};

export type InvoiceItem = {
  id?: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  returned_quantity?: number;
};

export type Invoice = {
  id: number;
  customer_id?: number;
  customer_name: string;
  invoice_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: 'delivered' | 'partial_return' | 'full_return';
  payment_method: 'cash' | 'visa' | 'credit';
  amount_paid: number;
  change_due: number;
  items?: InvoiceItem[];
  created_at?: string;
};
