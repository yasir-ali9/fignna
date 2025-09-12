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

  try {
    // Validate URL format
    const urlObj = new URL(url);

    // Only allow HTTPS URLs from trusted domains
    if (urlObj.protocol !== "https:") return undefined;

    // Check if it's a Google profile image URL
    if (urlObj.hostname.includes("googleusercontent.com")) {
      // Remove existing size parameters and add new high-quality size
      const baseUrl = url.split("=")[0];
      return `${baseUrl}=s${size}-c`;
    }

    // Return original URL if it's from a trusted domain
    return url;
  } catch (error) {
    // Invalid URL format
    console.warn("Invalid image URL provided:", url);
    return undefined;
  }
}
