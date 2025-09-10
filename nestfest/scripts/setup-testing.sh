#!/bin/bash

# NestFest Testing Framework Setup Script
# This script sets up a comprehensive testing environment for the NestFest application

echo "🚀 Setting up NestFest Testing Framework..."

# Install testing dependencies
echo "📦 Installing testing dependencies..."
npm install --save-dev \
  vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  playwright @playwright/test \
  jest-environment-jsdom \
  msw

# Create test directories
echo "📁 Creating test directory structure..."
mkdir -p tests/{__tests__,e2e,setup,mocks}
mkdir -p tests/__tests__/{components,pages,api,hooks}

# Create Vitest configuration
echo "⚙️ Creating Vitest configuration..."
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
EOF

# Create Vitest setup file
echo "🔧 Creating Vitest setup file..."
cat > tests/setup/vitest.setup.ts << 'EOF'
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from '../mocks/server'

// Setup MSW server
beforeAll(() => server.listen())
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
EOF

# Create test utilities
echo "🛠️ Creating test utilities..."
cat > tests/setup/test-utils.tsx << 'EOF'
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
EOF

# Create MSW server setup
echo "🌐 Creating MSW mock server..."
cat > tests/mocks/handlers.ts << 'EOF'
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'mock-jwt-token'
      }
    })
  }),

  // Competitions endpoint
  http.get('/api/competitions', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          name: 'Test Competition',
          status: 'open',
          description: 'Test competition description'
        }
      ]
    })
  }),

  // Catch-all for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`)
    return new HttpResponse(null, { status: 404 })
  }),
]
EOF

cat > tests/mocks/server.ts << 'EOF'
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
EOF

# Create Playwright configuration
echo "🎭 Creating Playwright configuration..."
cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
EOF

# Create sample component test
echo "🧪 Creating sample component test..."
cat > tests/__tests__/components/Button.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest'
import { render, screen } from '../../setup/test-utils'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const { user } = render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
EOF

# Create sample E2E test
echo "🎭 Creating sample E2E test..."
cat > tests/e2e/auth.spec.ts << 'EOF'
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('Login')
  })

  test('should display validation errors for empty form', async ({ page }) => {
    await page.goto('/login')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
  })
})
EOF

# Create sample API test
echo "🔌 Creating sample API test..."
cat > tests/__tests__/api/auth.test.ts << 'EOF'
import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'

describe('/api/auth/login', () => {
  it('should return 400 for invalid credentials', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should return 200 for valid credentials', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'correctpassword'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.token).toBeDefined()
  })
})
EOF

# Update package.json scripts
echo "📝 Updating package.json scripts..."
cat > temp_scripts.json << 'EOF'
{
  "test": "vitest",
  "test:watch": "vitest --watch",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage",
  "e2e": "playwright test",
  "e2e:ui": "playwright test --ui",
  "e2e:debug": "playwright test --debug",
  "e2e:ci": "playwright test --reporter=github",
  "test:all": "npm run test && npm run e2e",
  "type-check": "tsc --noEmit"
}
EOF

# Create GitHub Actions workflow
echo "🚀 Creating GitHub Actions workflow..."
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Type check
      run: npm run type-check
    
    - name: Lint
      run: npm run lint
    
    - name: Unit tests
      run: npm run test:coverage
    
    - name: Build
      run: npm run build
    
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    
    - name: E2E tests
      run: npm run e2e:ci
    
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
    - uses: actions/checkout@v4
    - uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
EOF

echo "✅ Testing framework setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review and customize test configurations"
echo "2. Add test-specific environment variables"
echo "3. Run 'npm run test' to verify unit test setup"
echo "4. Run 'npm run e2e' to verify E2E test setup"
echo "5. Configure Vercel secrets for deployment"
echo ""
echo "🔗 Useful commands:"
echo "  npm run test          # Run unit tests"
echo "  npm run test:watch    # Run unit tests in watch mode"
echo "  npm run e2e           # Run E2E tests"
echo "  npm run test:all      # Run all tests"
echo "  npm run type-check    # Check TypeScript"