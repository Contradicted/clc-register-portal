import { clsx } from 'clsx'
import { subYears } from 'date-fns'
import dayjs from 'dayjs'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function generateUserID() {
    const min = 100000000;
    const max = 999999999;
    const id = Math.floor(Math.random() * (max - min + 1)) + min

    return id.toString()
}

export const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export const formatName = (string) => {
  if (!string) return "";
  return string
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function generateApplicationID() {
  const min = 100000; // Minimum 7-digit number (100000)
  const max = 9999999; // Maximum 7-digit number (9999999)

  // Generate a random number between min and max
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  // Add a leading zero to ensure it's 7 digits
  const applicationID = "0" + randomNumber.toString().padStart(6, "0");

  return applicationID;
}

export const isAdult = (value) => {
  // Calculate the date 18 years ago
  const eighteenYearsAgo = subYears(new Date(), 18);
  // Convert the value to a Date object if it's not already
  const selectedDate = new Date(value);

  // Compare the selected date with the date 18 years ago
  return selectedDate <= eighteenYearsAgo;
};

export const formatDate = (date) => {
  return dayjs(date).format("DD-MM-YYYY");
};

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
    ["Waiting_for_Change"]: "Waiting for Change",
    ["Re_Submitted"]: "Re-Submitted",
    ["Approved_for_Interview"]: "Approved for Interview",
    ["Invited_for_Interview"]: "Invited for Interview",
    ["Sent_conditional_letter"]: "Sent Conditional Letter",
    ["Sent_enrollment_letter"]: "Sent Enrollment Letter",
    ["Invited_for_Interview"]: "Invited for Interview",
    ["Interview_successful"]: "Interview Successful",
    ["Enrolled"]: "Enrolled",
    ["Unfinished"]: "Unfinished",
    ["Finished"]: "Finished",
    ["Void"]: "Void",
  };

  return statusMap[status];
};

export const formatStudyMode = (mode) => {
    const modeMap = {
        full_time: 'Full Time',
        part_time: 'Part Time',
        hybrid_learning: 'Hybrid Learning'
    }

    return modeMap[mode] || mode
}

export const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
