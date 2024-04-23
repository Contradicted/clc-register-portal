import { clsx } from "clsx"
import { subYears } from "date-fns";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function generateUserID() {
  const min = 1000000;
  const max = 1999999;
  const id = Math.floor(Math.random() * (max - min + 1)) + min;

  return id.toString();
}

export const isAdult = (value) => {
  // Calculate the date 18 years ago
  const eighteenYearsAgo = subYears(new Date(), 18);
  // Convert the value to a Date object if it's not already
  const selectedDate = new Date(value);
  
  // Compare the selected date with the date 18 years ago
  return selectedDate <= eighteenYearsAgo;
};
