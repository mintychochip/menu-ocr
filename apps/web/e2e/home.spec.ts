import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display hero section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Menu OCR' })).toBeVisible()
    await expect(page.getByText('Transform your paper menus into beautiful digital experiences')).toBeVisible()
  })

  test('should display file upload area', async ({ page }) => {
    await expect(page.getByText('Click to upload or drag and drop')).toBeVisible()
    await expect(page.getByText('JPEG, PNG, WebP, or PDF')).toBeVisible()
  })

  test('should allow file upload', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    
    // Create a test image file
    const testImage = {
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG magic bytes
    }
    
    await fileInput.setInputFiles(testImage)
    
    // Should show file in list
    await expect(page.getByText('test-menu.png')).toBeVisible()
  })

  test('should display feature cards', async ({ page }) => {
    await expect(page.getByText('AI-Powered OCR')).toBeVisible()
    await expect(page.getByText('Beautiful Templates')).toBeVisible()
    await expect(page.getByText('Instant QR Codes')).toBeVisible()
  })
})

test.describe('Editor Page', () => {
  test('should show menu not found for invalid ID', async ({ page }) => {
    await page.goto('/editor/invalid-id')
    
    await expect(page.getByText('Menu Not Found')).toBeVisible()
    await expect(page.getByText("The menu you're looking for doesn't exist")).toBeVisible()
    await expect(page.getByRole('link', { name: 'Go Home' })).toBeVisible()
  })
})

test.describe('Menu View Page', () => {
  test('should show menu not found for invalid slug', async ({ page }) => {
    await page.goto('/menu/invalid-slug')
    
    await expect(page.getByText('Menu Not Found')).toBeVisible()
    await expect(page.getByText("This menu doesn't exist or has been removed")).toBeVisible()
  })
})

test.describe('Full Workflow', () => {
  test('complete menu creation flow', async ({ page }) => {
    // Start at home
    await page.goto('/')
    
    // Upload a file
    const fileInput = page.locator('input[type="file"]')
    const testImage = {
      name: 'menu.png',
      mimeType: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    }
    await fileInput.setInputFiles(testImage)
    
    // Wait for file to be listed
    await expect(page.getByText('menu.png')).toBeVisible()
    
    // Start OCR (mocked in test environment)
    await page.getByRole('button', { name: /start ocr/i }).click()
    
    // Wait for processing or navigation
    await page.waitForTimeout(1000)
    
    // Should either show processing or navigate to editor
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/editor\/|ocr/)
  })
})