import { clsx } from 'clsx'
import { subYears } from 'date-fns'
import dayjs from 'dayjs'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function generateUserID() {
    const min = 1000000
    const max = 1999999
    const id = Math.floor(Math.random() * (max - min + 1)) + min

    return id.toString()
}

export function generateApplicationID() {
    const min = 100000 // Minimum 7-digit number (100000)
    const max = 9999999 // Maximum 7-digit number (9999999)

    // Generate a random number between min and max
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min

    // Add a leading zero to ensure it's 7 digits
    const applicationID = '0' + randomNumber.toString().padStart(6, '0')

    return applicationID
}

export const isAdult = (value) => {
    // Calculate the date 18 years ago
    const eighteenYearsAgo = subYears(new Date(), 18)
    // Convert the value to a Date object if it's not already
    const selectedDate = new Date(value)

    // Compare the selected date with the date 18 years ago
    return selectedDate <= eighteenYearsAgo
}

export const formatDate = (date) => {
    return dayjs(date).format('DD-MM-YYYY')
}

export const formatDateLong = (date) => {
  return dayjs(date).format("DD MMMM YYYY");
};

export const formatDateTime = (dateTime) => {
  return dayjs(dateTime).format("DD-MM-YYYY [at] HH:mm");
};

export const routeToTitle = (pathname) => {
  // Remove leading slash and split by '/'
  const parts = pathname.slice(1).split("/");

  if (parts.length === 0 || parts[0] === "") {
    return "Dashboard";
  }

  // Always use the first part of the route
  const title = parts[0].replace(/-/g, " ");

  // Capitalize each word
  return title
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const getDisplayStatus = (status) => {
  const statusMap = {
    ["Submitted"]: "Submitted",
    ["Approved"]: "Approved",
    ["Rejected"]: "Rejected",
    ["Waiting_For_Change"]: "Waiting for Change",
    ["Re_Submitted"]: "Re-Submitted",
  };

  return statusMap[status];
};
