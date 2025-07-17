// Rate limiting configuration
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfterMs: number;
}

// Default rate limiting settings
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60000, // Per minute
  retryAfterMs: 5000, // Wait 5 seconds after rate limit
};

// Request tracking interface
interface RequestRecord {
  timestamp: number;
  count: number;
}

// Rate limiter class
export class RateLimiter {
  private requests: Map<string, RequestRecord> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = DEFAULT_RATE_LIMIT) {
    this.config = config;
  }

  // Check if request is allowed
  public isAllowed(identifier: string = 'default'): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record) {
      this.requests.set(identifier, { timestamp: now, count: 1 });
      return true;
    }

    // Check if window has expired
    if (now - record.timestamp > this.config.windowMs) {
      this.requests.set(identifier, { timestamp: now, count: 1 });
      return true;
    }

    // Check if within limits
    if (record.count < this.config.maxRequests) {
      record.count++;
      return true;
    }

    return false;
  }

  // Get time until next allowed request
  public getTimeUntilReset(identifier: string = 'default'): number {
    const record = this.requests.get(identifier);
    if (!record) return 0;

    const timeElapsed = Date.now() - record.timestamp;
    return Math.max(0, this.config.windowMs - timeElapsed);
  }

  // Get remaining requests in current window
  public getRemainingRequests(identifier: string = 'default'): number {
    const record = this.requests.get(identifier);
    if (!record) return this.config.maxRequests;

    const now = Date.now();
    if (now - record.timestamp > this.config.windowMs) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - record.count);
  }

  // Clear all records (useful for testing)
  public clear(): void {
    this.requests.clear();
  }

  // Get rate limit info
  public getRateLimitInfo(identifier: string = 'default'): {
    remaining: number;
    resetTime: number;
    isLimited: boolean;
  } {
    const remaining = this.getRemainingRequests(identifier);
    const resetTime = this.getTimeUntilReset(identifier);
    const isLimited = !this.isAllowed(identifier);

    return {
      remaining,
      resetTime,
      isLimited,
    };
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();

// Rate limiting decorator for functions
export function withRateLimit<T extends (...args: any) => Promise<any>>(
  fn: T,
  identifier?: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const id = identifier || 'default';
    
    if (!globalRateLimiter.isAllowed(id)) {
      const resetTime = globalRateLimiter.getTimeUntilReset(id);
      throw new Error(
        `Rate limit exceeded. Please try again in ${Math.ceil(resetTime /1000)} seconds.`
      );
    }

    return fn(...args);
  }) as T;
}

// Exponential backoff utility
export class ExponentialBackoff {
  private baseDelay: number;
  private maxDelay: number;
  private maxAttempts: number;

  constructor(
    baseDelay: number = 10,
    maxDelay: number = 30000,
    maxAttempts: number = 5
  ) {
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    this.maxAttempts = maxAttempts;
  }

  public async execute<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, delay: number) => void
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.message?.includes('Invalid API key') ||
            error.message?.includes('insufficient permissions')) {
          throw error;
        }

        if (attempt === this.maxAttempts) {
          throw lastError;
        }

        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt - 1),
          this.maxDelay
        );

        if (onRetry) {
          onRetry(attempt, delay);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// Global exponential backoff instance
export const globalBackoff = new ExponentialBackoff(); 