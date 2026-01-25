import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "MNT"): string {
  return new Intl.NumberFormat("mn-MN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("mn-MN").format(amount);
}

export function formatMonth(monthStr: string): string {
  const months: Record<string, string> = {
    "01": "1-р сар",
    "02": "2-р сар",
    "03": "3-р сар",
    "04": "4-р сар",
    "05": "5-р сар",
    "06": "6-р сар",
    "07": "7-р сар",
    "08": "8-р сар",
    "09": "9-р сар",
    "10": "10-р сар",
    "11": "11-р сар",
    "12": "12-р сар",
  };
  const parts = monthStr.split("-");
  if (parts.length === 2) {
    const year = parts[0];
    const month = parts[1];
    return `${year} оны ${months[month] || month}`;
  }
  return monthStr;
}
