import { isMatch } from "../utils/lodash";
import {
  uploadDocToCloud,
  uploadToCloud,
  uploadVideoToCloud,
} from "../lib/cloudinary";

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const assembleBreedList = (dogBreeds: { [key: string]: string[] }) => {
  let breedList = [];

  for (const [breed, subBreeds] of Object.entries(dogBreeds)) {
    if (subBreeds.length === 0) {
      breedList.push(capitalize(breed));
    } else {
      for (const subBreed of subBreeds) {
        breedList.push(`${capitalize(subBreed)} ${capitalize(breed)}`);
      }
    }
  }
  return breedList;
};

export const getFancyTimeFromNoOfMinutes = (noOfMinutes: number) => {
  const hours = Math.floor(noOfMinutes / 60);
  const minutes = noOfMinutes % 60;
  let result = "";

  if (hours > 0) {
    result += `${hours}hours `;
  }
  if (minutes > 0) {
    result += `${minutes}minutes`;
  }

  return result.trim();
};

export const dogColors = [
  { name: "Black" },
  { name: "Brown" },
  { name: "White" },
  { name: "Black and Brown" },
];

export const dateStringToDate = (dateString: string) => {
  console.log({ dateString });
  if (typeof dateString !== "string") {
    throw new Error("Input must be a string");
  }

  const [day, month, year] = dateString.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return date;
};

export function getRandomDate(earliestYear = 5, latestYear = 1) {
  const today = new Date();
  const startYear = today.getFullYear() - earliestYear;
  const endYear = today.getFullYear() - latestYear;

  const randomYear =
    Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
  const randomMonth = Math.floor(Math.random() * 12);
  const randomDay = Math.floor(Math.random() * 28) + 1; // Keeping it simple, max day is 28 to avoid issues with February

  const randomDate = new Date(randomYear, randomMonth, randomDay);

  return randomDate;
}

export const MediaMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/*",
  "video/mp4",
  "video/webm",
];

export const DocMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

export const allMimeTypes = [...MediaMimeTypes, ...DocMimeTypes];

export const getMediaType = (mimetype: string) => {
  if (mimetype.includes("image")) {
    return "image";
  } else if (mimetype.includes("video")) {
    return "video";
  } else {
    return "doc";
  }
};

export const uploadFncs = {
  image: uploadToCloud,
  video: uploadVideoToCloud,
  doc: uploadDocToCloud,
};

export const duplicateItem = (item: any, times: number) => {
  const items = [];
  for (let i = 0; i < times; i++) {
    items.push(item);
  }
  return items;
};

export const ellipsify = (str: string, maxLength: number) => {
  if (str.length > maxLength) return str.slice(0, maxLength) + "..";

  return str;
};

export const isObjectFilled = (obj: { [key: string]: any }): boolean => {
  return !Object.keys(obj).some((key) => {
    const value = obj[key];
    if (
      typeof value === "object" &&
      value !== null &&
      !(value instanceof Date)
    ) {
      // Recursively check nested objects, except for null and Date objects
      return !isObjectFilled(value);
    } else {
      // Check if the value is falsy, which includes "", 0, null, undefined, and false
      return !value;
    }
  });
};

export function isSubset2(
  obj: { [key: string]: any },
  target: { [key: string]: any }
) {
  for (let key in obj) {
    if (!target.hasOwnProperty(key)) {
      return false;
    }
    if (typeof obj[key] === "object" && typeof target[key] === "object") {
      if (!isSubset(obj[key], target[key])) {
        return false;
      }
    } else {
      if (obj[key] !== target[key]) {
        return false;
      }
    }
  }
  return true;
}

export function isSubset(
  subset: Record<string, any>,
  object: Record<string, any>
): boolean {
  return isMatch(object, subset);
}

export const getCurrentPeriodEnd = (dateToUse?: Date | number) => {
  const now = dateToUse ? new Date(dateToUse) : new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
  return currentMonthEnd;
};

export const getNext30Days = (dateToUse?: Date | number) => {
  const now = dateToUse ? new Date(dateToUse) : new Date();
  const next30Days = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 30
  );
  return next30Days;
};

export const getDateXMonthsFromNow = (
  months: number,
  dateToUse?: Date | number
) => {
  const now = dateToUse ? new Date(dateToUse) : new Date();
  const nextXMonths = new Date(
    now.getFullYear(),
    now.getMonth() + months,
    now.getDate()
  );
  return nextXMonths;
}

export const getGracePeriodEnd = (dateToUse?: Date | number) => {
  const now = dateToUse ? new Date(dateToUse) : new Date();
  const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return new Date(
    firstDayNextMonth.getFullYear(),
    firstDayNextMonth.getMonth(),
    firstDayNextMonth.getDate() + 6
  );
};

export const convertUnixToDate = (unix: number) => {
  return new Date(unix * 1000);
};

export const add3DaysToUnixTimestamp = (unixTimestamp: number): Date => {
  const date = new Date(unixTimestamp * 1000); // Convert to milliseconds and create a Date object
  date.setDate(date.getDate() + 3); // Add 3 days
  return date;
};
