import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Enhance Google profile image URL for better quality
export function enhanceGoogleImageUrl(
  url: string | undefined,
  size: number = 96
): string | undefined {
  if (!url) return undefined;

  // Check if it's a Google profile image URL
  if (url.includes("googleusercontent.com")) {
    // Remove existing size parameters and add new high-quality size
    const baseUrl = url.split("=")[0];
    return `${baseUrl}=s${size}-c`;
  }

  return url;
}
