import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Tesseract.js
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => ({
    load: vi.fn().mockResolvedValue(undefined),
    loadLanguage: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
    recognize: vi.fn().mockResolvedValue({
      data: {
        text: 'Margherita Pizza $14\nPepperoni Pizza $16\nCaesar Salad $12',
      },
    }),
    terminate: vi.fn().mockResolvedValue(undefined),
  })),
}))

// Mock QR code
vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,fake'),
}))

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123',
  },
})
