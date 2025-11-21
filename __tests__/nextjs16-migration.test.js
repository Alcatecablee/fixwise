const NextJS16Migrator = require('../scripts/migrate-nextjs-16.js');
const fs = require('fs').promises;
const path = require('path');

describe('Next.js 16 Migration', () => {
  let migrator;
  let testDir;

  beforeEach(async () => {
    migrator = new NextJS16Migrator({ verbose: false, dryRun: true });
    testDir = path.join(__dirname, 'fixtures', 'nextjs16-test');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('middleware.ts to proxy.ts migration', () => {
    test('should rename middleware.ts to proxy.ts', async () => {
      const middlewareContent = `
export function middleware(request) {
  return NextResponse.next();
}
`;
      
      const middlewarePath = path.join(testDir, 'middleware.ts');
      await fs.writeFile(middlewarePath, middlewareContent);

      const result = await migrator.migrate(testDir);

      expect(result.changes).toContainEqual(
        expect.objectContaining({
          type: 'middleware_to_proxy',
          description: expect.stringContaining('proxy.ts')
        })
      );
    });

    test('should update function export from middleware to proxy', async () => {
      const middlewareContent = `
export function middleware(request) {
  return NextResponse.next();
}
`;
      
      const middlewarePath = path.join(testDir, 'middleware.ts');
      await fs.writeFile(middlewarePath, middlewareContent);

      // Temporarily set dryRun to false to test actual transformation
      migrator.dryRun = false;
      await migrator.migrate(testDir);

      const proxyPath = path.join(testDir, 'proxy.ts');
      const proxyContent = await fs.readFile(proxyPath, 'utf8');

      expect(proxyContent).toContain('export function proxy(');
      expect(proxyContent).not.toContain('export function middleware(');
    });

    test('should add Node.js runtime declaration', async () => {
      const middlewareContent = `
export function middleware(request) {
  return NextResponse.next();
}
`;
      
      const middlewarePath = path.join(testDir, 'middleware.ts');
      await fs.writeFile(middlewarePath, middlewareContent);

      migrator.dryRun = false;
      await migrator.migrate(testDir);

      const proxyPath = path.join(testDir, 'proxy.ts');
      const proxyContent = await fs.readFile(proxyPath, 'utf8');

      expect(proxyContent).toContain('export const runtime = "nodejs"');
    });
  });

  describe('experimental.ppr to Cache Components', () => {
    test('should detect and remove experimental.ppr', async () => {
      const configContent = `
const nextConfig = {
  experimental: {
    ppr: true
  }
};

module.exports = nextConfig;
`;
      
      const configPath = path.join(testDir, 'next.config.js');
      await fs.writeFile(configPath, configContent);

      const result = await migrator.migrate(testDir);

      expect(result.changes).toContainEqual(
        expect.objectContaining({
          type: 'ppr_to_cache_components',
          description: expect.stringContaining('Cache Components')
        })
      );
    });

    test('should replace ppr with Cache Components config', async () => {
      const configContent = `
const nextConfig = {
  experimental: {
    ppr: 'incremental'
  }
};

module.exports = nextConfig;
`;
      
      const configPath = path.join(testDir, 'next.config.js');
      await fs.writeFile(configPath, configContent);

      migrator.dryRun = false;
      await migrator.migrate(testDir);

      const newConfigContent = await fs.readFile(configPath, 'utf8');

      expect(newConfigContent).not.toContain('ppr:');
      expect(newConfigContent).toContain('dynamicIO: true');
    });
  });

  describe('caching API migration', () => {
    test('should detect unstable_cache usage', async () => {
      const componentContent = `
import { unstable_cache } from 'next/cache';

export async function getData() {
  return unstable_cache(async () => {
    return fetch('/api/data');
  }, ['data']);
}
`;
      
      const componentPath = path.join(testDir, 'component.ts');
      await fs.writeFile(componentPath, componentContent);

      migrator.dryRun = false;
      const result = await migrator.migrate(testDir);

      const newContent = await fs.readFile(componentPath, 'utf8');
      expect(newContent).toContain("'use cache'");
    });
  });

  describe('async API updates', () => {
    test('should add comments for async params', async () => {
      const pageContent = `
export default function Page({ params }) {
  return <div>{params.slug}</div>;
}
`;
      
      const pagePath = path.join(testDir, 'page.tsx');
      await fs.writeFile(pagePath, pageContent);

      migrator.dryRun = false;
      await migrator.migrate(testDir);

      const newContent = await fs.readFile(pagePath, 'utf8');
      expect(newContent).toContain('params and searchParams are now async');
    });

    test('should add comments for cookies/headers', async () => {
      const routeContent = `
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  return Response.json({ ok: true });
}
`;
      
      const routePath = path.join(testDir, 'route.ts');
      await fs.writeFile(routePath, routeContent);

      migrator.dryRun = false;
      await migrator.migrate(testDir);

      const newContent = await fs.readFile(routePath, 'utf8');
      expect(newContent).toContain('cookies() and headers() are now async');
    });
  });

  describe('complete migration workflow', () => {
    test('should handle project without middleware gracefully', async () => {
      const result = await migrator.migrate(testDir);
      
      // Should not fail, just skip middleware migration
      expect(result.success).toBe(true);
    });

    test('should generate summary of changes', async () => {
      // Create multiple files to migrate
      await fs.writeFile(
        path.join(testDir, 'middleware.ts'),
        'export function middleware(req) {}'
      );
      await fs.writeFile(
        path.join(testDir, 'next.config.js'),
        'module.exports = { experimental: { ppr: true } }'
      );

      const result = await migrator.migrate(testDir);

      expect(result.summary).toBeDefined();
      expect(result.summary.total).toBeGreaterThan(0);
      expect(result.summary.byType).toBeDefined();
    });
  });
});
