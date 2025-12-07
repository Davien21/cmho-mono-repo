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
 * Formats a date as a relative time string (e.g., "2 hours ago", "1 day ago")
 * @param date - The date to format (string, Date, or ISO string)
 * @returns A human-readable relative time string
 */
export const formatTimeAgo = (date: string | Date | null): string => {
  if (!date) return "Unknown time";

  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
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

  // Handle NaN or invalid numbers
  if (Number.isNaN(numQuantity)) {
    return unit.plural || unit.name || "";
  }

  // Use plural if quantity is not exactly 1 (including 0, negative, or any value != 1)
  // Fallback to singular if plural is empty or undefined
  if (numQuantity === 1) {
    return unit.name || "";
  }
  return (unit.plural && unit.plural.trim() !== "") ? unit.plural : (unit.name || "");
}
