import { Throttle } from '@nestjs/throttler';

/**
 * Applies strict rate-limiting to the decorated route or controller.
 * It overrides the global 'short' throttler with strict configurations
 * read from the environment variables, ensuring maximum protection for sensitive endpoints.

 * Note: We explicitly DO NOT skip the global 'long' throttler here. Because the strict
 * TTL and Limit are configurable via environment variables, an ops team might change the strict
 * rules to a very short time window (e.g., 3 requests per 1 second). If they did that, the global
 * 'long' throttler must remain active to protect against sustained attacks over longer windows.
 */
export const StrictThrottle = () =>
  Throttle({
    short: {
      ttl: parseInt(process.env.THROTTLE_STRICT_TTL_SEC!, 10) * 1000,
      limit: parseInt(process.env.THROTTLE_STRICT_LIMIT_REQ!, 10),
    },
  });
