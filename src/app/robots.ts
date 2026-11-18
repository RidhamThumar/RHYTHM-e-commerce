import type { MetadataRoute } from 'next';

// Portfolio sandbox: prevent crawlers indexing fake checkout and customer pages.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: ['/admin', '/account', '/checkout', '/login', '/signup', '/login-otp', '/verify-email', '/api', '/order-success'] }] };
}
