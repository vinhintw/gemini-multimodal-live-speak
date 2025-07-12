import { Message } from "@/components/gemini-chat";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getStatusColor = (
  connectionStatus: "connected" | "connecting" | "disconnected"
) => {
  switch (connectionStatus) {
    case "connected":
      return "bg-green-500";
    case "connecting":
      return "bg-yellow-500";
    default:
      return "bg-red-500";
  }
};

export const getMessageStyle = (type: Message["type"]) => {
  switch (type) {
    case "user":
      return "bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800";
    case "assistant":
      return "bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800";
    case "function":
      return "bg-purple-100 dark:bg-purple-900 border-purple-200 dark:border-purple-800";
    case "error":
      return "bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800";
    default:
      return "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
  }
};
