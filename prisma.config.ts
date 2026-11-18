import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 CLI migrations use the DB URL from this config. Keep the existing
// pooler connection unless you separately configure a verified direct endpoint.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
});
