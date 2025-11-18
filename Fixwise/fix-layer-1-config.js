#!/usr/bin/env node

/**
 * Layer 1: Configuration Fixes
 * - TypeScript configuration optimization
 * - Next.js configuration cleanup
 * - Package.json optimization
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Layer 1: Configuration Fixes');

// Fix TypeScript configuration
function fixTsConfig() {
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
  
  if (fs.existsSync(tsConfigPath)) {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    
    // Ensure modern TypeScript settings
    tsConfig.compilerOptions = {
      ...tsConfig.compilerOptions,
      target: "ES2020",
      lib: ["dom", "dom.iterable", "es6", "ES2020"],
      downlevelIteration: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      strict: true,
      noEmit: true,
      incremental: true,
      skipLibCheck: true,
      isolatedModules: true,
      jsx: "preserve",
      plugins: [{ "name": "next" }],
      baseUrl: ".",
      paths: {
        "@/*": ["./src/*"]
      }
    };
    
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
    console.log('✅ Fixed tsconfig.json');
  }
}

// Fix Next.js configuration
function fixNextConfig() {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  
  if (fs.existsSync(nextConfigPath)) {
    const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Remove deprecated appDir option
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    domains: [],
  },
  // Optimize for production
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
`;
    
    fs.writeFileSync(nextConfigPath, nextConfigContent);
    console.log('✅ Fixed next.config.js');
  }
}

// Fix package.json scripts and dependencies
function fixPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Optimize scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint",
      "lint:fix": "next lint --fix",
      "type-check": "tsc --noEmit",
      "fix-all": "node scripts/fix-layer-1-config.js && node scripts/fix-layer-2-patterns.js && node scripts/fix-layer-3-components.js",
      "clean": "rm -rf .next out dist"
    };
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Optimized package.json');
  }
}

// Run all Layer 1 fixes
try {
  fixTsConfig();
  fixNextConfig();
  fixPackageJson();
  console.log('🎉 Layer 1 fixes completed successfully!');
} catch (error) {
  console.error('❌ Layer 1 fixes failed:', error.message);
  process.exit(1);
} 