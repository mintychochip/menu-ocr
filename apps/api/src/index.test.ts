import { describe, it, expect, beforeEach } from 'vitest'
import app from './index'

// Mock environment
const mockEnv = {
  GROQ_API_KEY: 'test-api-key',
  MENUS_KV: {
    get: async (key: string, type?: string) => {
      const data = (global as any).mockKVData?.[key]
      return type === 'json' && data ? JSON.parse(data) : data
    },
    put: async (key: string, value: string) => {
      if (!(global as any).mockKVData) (global as any).mockKVData = {}
      ;(global as any).mockKVData[key] = value
    },
    delete: async (key: string) => {
      if ((global as any).mockKVData) {
        delete (global as any).mockKVData[key]
      }
    },
  } as unknown as KVNamespace,
}

const mockCtx = {} as ExecutionContext

describe('API Integration Tests', () => {
  beforeEach(() => {
    ;(global as any).mockKVData = {}
  })

  describe('GET /', () => {
    it('should return API info', async () => {
      const request = new Request('http://localhost/')
      const response = await app.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.message).toBe('Menu OCR API')
      expect(body.version).toBe('0.1.0')
      expect(body.endpoints).toBeInstanceOf(Array)
    })
  })

  describe('POST /api/menu', () => {
    it('should create a new menu', async () => {
      const menu = {
        name: 'Test Menu',
        categories: [],
        template: 'minimal',
      }

      const request = new Request('http://localhost/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menu),
      })

      const response = await app.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.id).toBeDefined()
      expect(body.name).toBe('Test Menu')
    })
  })

  describe('GET /api/menu/:id', () => {
    it('should return a menu by ID', async () => {
      // First create a menu
      const menu = {
        name: 'Test Menu',
        categories: [{ id: 'cat-1', name: 'Appetizers', items: [], order: 0 }],
        template: 'minimal',
      }

      const createRequest = new Request('http://localhost/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menu),
      })

      const createResponse = await app.fetch(createRequest, mockEnv, mockCtx)
      const created = await createResponse.json()

      // Then fetch it
      const getRequest = new Request(`http://localhost/api/menu/${created.id}`)
      const getResponse = await app.fetch(getRequest, mockEnv, mockCtx)

      expect(getResponse.status).toBe(200)
      const fetched = await getResponse.json()
      expect(fetched.name).toBe('Test Menu')
    })

    it('should return 404 for non-existent menu', async () => {
      const request = new Request('http://localhost/api/menu/non-existent-id')
      const response = await app.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('Menu not found')
    })
  })

  describe('PUT /api/menu/:id', () => {
    it('should update a menu', async () => {
      // First create a menu
      const menu = {
        name: 'Test Menu',
        categories: [],
        template: 'minimal',
      }

      const createRequest = new Request('http://localhost/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menu),
      })

      const createResponse = await app.fetch(createRequest, mockEnv, mockCtx)
      const created = await createResponse.json()

      // Then update it
      const updateRequest = new Request(`http://localhost/api/menu/${created.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Menu' }),
      })

      const updateResponse = await app.fetch(updateRequest, mockEnv, mockCtx)

      expect(updateResponse.status).toBe(200)
      const updated = await updateResponse.json()
      expect(updated.name).toBe('Updated Menu')
      expect(updated.updatedAt).toBeDefined()
    })

    it('should return 404 when updating non-existent menu', async () => {
      const request = new Request('http://localhost/api/menu/non-existent-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      })

      const response = await app.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('Menu not found')
    })
  })

  describe('POST /api/parse-menu', () => {
    it('should parse menu text', async () => {
      const request = new Request('http://localhost/api/parse-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'APPETIZERS\nCaesar Salad $12.99\nBruschetta $9.99\n\nMAINS\nMargherita Pizza $14.00',
        }),
      })

      const response = await app.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.name).toBeDefined()
      expect(body.items).toBeInstanceOf(Array)
      expect(body.categories).toBeInstanceOf(Array)
    })

    it('should return 400 for empty text', async () => {
      const request = new Request('http://localhost/api/parse-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '' }),
      })

      const response = await app.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('No text provided')
    })
  })

  describe('GET /api/qr', () => {
    it('should generate QR code', async () => {
      const request = new Request('http://localhost/api/qr?url=https://example.com/menu')
      const response = await app.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml')
    })

    it('should return 400 for missing URL', async () => {
      const request = new Request('http://localhost/api/qr')
      const response = await app.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('URL parameter required')
    })
  })

  describe('CORS', () => {
    it('should handle OPTIONS requests', async () => {
      const request = new Request('http://localhost/api/menu', {
        method: 'OPTIONS',
      })

      const response = await app.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(204)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined()
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    })

    it('should include CORS headers in responses', async () => {
      const request = new Request('http://localhost/')
      const response = await app.fetch(request, mockEnv, mockCtx)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined()
    })
  })
})
