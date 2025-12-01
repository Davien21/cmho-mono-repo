import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as yup from "yup";
import { UnitLevel } from "@/types/inventory";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function getAxiosError(error: any) {
  const axiosError = error as any;
  const message = axiosError.response?.data.message;
  if (!message) return;

  if (message === "Resource not found") {
    return "Something went wrong. Please try again or contact support";
  }

  return message;
}

export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  return searchParams.toString();
}

export const formatNaira = (amount: number) => {
  return `₦${amount.toLocaleString()}`;
};

export const formatKobo = (amount: number) => {
  return `₦${(amount / 100).toLocaleString()}`;
};

export const getYupCurrencyValidator = (label: string) => {
  return yup
    .number()
    .typeError(`${label} must be a number`)
    .required(`${label} is required`)
    .transform((value, originalValue) => {
      if (typeof originalValue === "string")
        return Number(originalValue.replace(/,/g, ""));
      return value;
    });
};

export const pluralize = (word: string, count: number) => {
  let plural = `${word}s`;
  if (word === "this") plural = "these";
  if (word === "has") plural = "have";

  return count === 1 ? word : plural;
};

export const pluralizePhrase = (phrase: string, count: number) => {
  const words = phrase.split(" ");
  const pluralizedWords = words.map((word) => {
    if (word === "this") return "these";
    return count === 1 ? word : `${word}s`;
  });
  return pluralizedWords.join(" ");
};

export const getRTKQueryErrorMessage = (error: any): string | null => {
  const errorMessage = error?.data?.message;
  if (errorMessage) return errorMessage;

  return null;
};

export const formatDate = (date: string | Date | null) => {
  if (!date) return "Invalid date";

  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const duplicateArray = <T>(array: T[], times: number): T[] => {
  return Array.from({ length: times }, () => [...array]).flat();
};

/**
 * Returns the appropriate unit name (singular or plural) based on quantity
 * @param unit - The unit object containing name and plural properties
 * @param quantity - The quantity to check (number or string)
 * @returns The singular name if quantity is 1, otherwise the plural name
 */
export function formatUnitName(
  unit: UnitLevel | { name: string; plural: string },
  quantity: number | string
): string {
  const numQuantity =
    typeof quantity === "string" ? parseFloat(quantity) : quantity;

  // Use plural if quantity is not exactly 1 (including 0, negative, or any value != 1)
  return numQuantity === 1 ? unit.name : unit.plural;
}
