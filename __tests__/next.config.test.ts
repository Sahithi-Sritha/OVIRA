/**
 * @jest-environment node
 */
import type { NextConfig } from 'next'

// Import the config
const nextConfig: NextConfig = require('../next.config.ts').default

describe('next.config.ts', () => {
  describe('Configuration Structure', () => {
    it('should export a valid Next.js config object', () => {
      expect(nextConfig).toBeDefined()
      expect(typeof nextConfig).toBe('object')
    })

    it('should have experimental config', () => {
      expect(nextConfig.experimental).toBeDefined()
    })

    it('should have TypeScript config', () => {
      expect(nextConfig.typescript).toBeDefined()
    })

    it('should have ESLint config', () => {
      expect(nextConfig.eslint).toBeDefined()
    })
  })

  describe('Experimental Features', () => {
    it('should enable optimizePackageImports', () => {
      expect(nextConfig.experimental?.optimizePackageImports).toBeDefined()
      expect(Array.isArray(nextConfig.experimental?.optimizePackageImports)).toBe(true)
    })

    it('should optimize specific packages', () => {
      const optimizedPackages = nextConfig.experimental?.optimizePackageImports as string[]
      expect(optimizedPackages).toContain('lucide-react')
      expect(optimizedPackages).toContain('date-fns')
      expect(optimizedPackages).toContain('@react-pdf/renderer')
    })

    it('should optimize all critical dependencies', () => {
      const optimizedPackages = nextConfig.experimental?.optimizePackageImports as string[]
      expect(optimizedPackages.length).toBe(3)
    })
  })

  describe('TypeScript Configuration', () => {
    it('should not ignore build errors', () => {
      expect(nextConfig.typescript?.ignoreBuildErrors).toBe(false)
    })

    it('should enforce type checking during builds', () => {
      // This ensures type safety is maintained
      expect(nextConfig.typescript?.ignoreBuildErrors).not.toBe(true)
    })
  })

  describe('ESLint Configuration', () => {
    it('should not ignore ESLint during builds', () => {
      expect(nextConfig.eslint?.ignoreDuringBuilds).toBe(false)
    })

    it('should enforce code quality checks', () => {
      // This ensures linting is performed
      expect(nextConfig.eslint?.ignoreDuringBuilds).not.toBe(true)
    })
  })

  describe('Source Maps', () => {
    it('should disable production browser source maps', () => {
      expect(nextConfig.productionBrowserSourceMaps).toBe(false)
    })

    it('should reduce bundle overhead', () => {
      // Disabled source maps reduce bundle size and improve performance
      expect(nextConfig.productionBrowserSourceMaps).not.toBe(true)
    })
  })

  describe('Performance Optimizations', () => {
    it('should have at least one package import optimization', () => {
      const optimizedPackages = nextConfig.experimental?.optimizePackageImports as string[]
      expect(optimizedPackages.length).toBeGreaterThan(0)
    })

    it('should optimize large icon libraries', () => {
      const optimizedPackages = nextConfig.experimental?.optimizePackageImports as string[]
      // lucide-react is a large icon library that benefits from optimization
      expect(optimizedPackages).toContain('lucide-react')
    })

    it('should optimize date manipulation libraries', () => {
      const optimizedPackages = nextConfig.experimental?.optimizePackageImports as string[]
      // date-fns is commonly tree-shakeable
      expect(optimizedPackages).toContain('date-fns')
    })

    it('should optimize PDF generation libraries', () => {
      const optimizedPackages = nextConfig.experimental?.optimizePackageImports as string[]
      // PDF libraries can be large
      expect(optimizedPackages).toContain('@react-pdf/renderer')
    })
  })

  describe('Build Quality', () => {
    it('should maintain code quality standards', () => {
      // Both TypeScript and ESLint should be enforced
      expect(nextConfig.typescript?.ignoreBuildErrors).toBe(false)
      expect(nextConfig.eslint?.ignoreDuringBuilds).toBe(false)
    })

    it('should not allow bypassing quality checks', () => {
      // Neither should be set to true
      expect(nextConfig.typescript?.ignoreBuildErrors === true).toBe(false)
      expect(nextConfig.eslint?.ignoreDuringBuilds === true).toBe(false)
    })
  })

  describe('Development Experience', () => {
    it('should have configuration for faster builds', () => {
      // Package import optimization improves build speed
      expect(nextConfig.experimental?.optimizePackageImports).toBeDefined()
    })

    it('should reduce production bundle size', () => {
      // Disabled source maps reduce production bundle size
      expect(nextConfig.productionBrowserSourceMaps).toBe(false)
    })
  })

  describe('Configuration Consistency', () => {
    it('should have all expected top-level properties', () => {
      const expectedProps = ['experimental', 'productionBrowserSourceMaps', 'typescript', 'eslint']
      expectedProps.forEach(prop => {
        expect(nextConfig).toHaveProperty(prop)
      })
    })

    it('should not have unexpected experimental features', () => {
      const experimentalKeys = Object.keys(nextConfig.experimental || {})
      // Only optimizePackageImports should be present
      expect(experimentalKeys).toEqual(['optimizePackageImports'])
    })

    it('should not have dangerous configurations', () => {
      // Ensure no dangerous flags are set
      expect(nextConfig.typescript?.ignoreBuildErrors).not.toBe(true)
      expect(nextConfig.eslint?.ignoreDuringBuilds).not.toBe(true)
    })
  })

  describe('Package Optimization Specifics', () => {
    it('should optimize packages that are used in the application', () => {
      const optimizedPackages = nextConfig.experimental?.optimizePackageImports as string[]
      
      // These packages should be present in package.json dependencies
      const expectedPackages = ['lucide-react', 'date-fns', '@react-pdf/renderer']
      expectedPackages.forEach(pkg => {
        expect(optimizedPackages).toContain(pkg)
      })
    })

    it('should not optimize packages that are not used', () => {
      const optimizedPackages = nextConfig.experimental?.optimizePackageImports as string[]
      
      // Common packages that are NOT in this project
      const unexpectedPackages = ['lodash', 'moment', '@mui/material']
      unexpectedPackages.forEach(pkg => {
        expect(optimizedPackages).not.toContain(pkg)
      })
    })
  })

  describe('Type Safety', () => {
    it('should match NextConfig type', () => {
      // This test ensures the config object structure is valid
      const config: NextConfig = nextConfig
      expect(config).toBeDefined()
    })
  })
})