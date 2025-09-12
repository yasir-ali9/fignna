/**
 * Rate Limiting Middleware
 * Implements rate limiting to prevent API abuse
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

// In-memory store for rate limiting (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function createRateLimit(config: RateLimitConfig) {
  return function rateLimit(request: NextRequest): NextResponse | null {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const now = Date.now();

    // Clean up old entries
    for (const [key, value] of requestCounts.entries()) {
      if (value.resetTime < now) {
        requestCounts.delete(key);
      }
    }

    // Get or create rate limit entry for this IP
    const entry = requestCounts.get(ip) || {
      count: 0,
      resetTime: now + config.windowMs,
    };

    // Check if within rate limit
    if (entry.count >= config.maxRequests && entry.resetTime > now) {
      return NextResponse.json(
        {
          success: false,
          error: config.message || "Too many requests. Please try again later.",
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((entry.resetTime - now) / 1000).toString(),
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": Math.max(
              0,
              config.maxRequests - entry.count - 1
            ).toString(),
            "X-RateLimit-Reset": entry.resetTime.toString(),
          },
        }
      );
    }

    // Update count
    entry.count++;
    requestCounts.set(ip, entry);

    return null; // Allow request to proceed
  };
}

// Pre-configured rate limiters
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: "API rate limit exceeded. Please try again in 15 minutes.",
});

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 auth attempts per 15 minutes
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});
