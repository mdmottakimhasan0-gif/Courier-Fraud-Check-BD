import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-BD").format(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function maskPhone(phone: string) {
  return `${phone.slice(0, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
}
