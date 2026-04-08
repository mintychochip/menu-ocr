import { Router } from './router'
import { handleParseMenu } from './handlers/parseMenu'
import { handleGenerateQR } from './handlers/generateQR'
import { handleCORS } from './middleware/cors'

export interface Env {
  GROQ_API_KEY: string
  MENUS_KV: KVNamespace
}

const router = new Router<Env>()

// CORS middleware
router.use(handleCORS)

// Routes
router.post('/api/parse-menu', handleParseMenu)
router.get('/api/qr', handleGenerateQR)
router.get('/api/menu/:id', async (req, env) => {
  const id = req.params.id
  const menu = await env.MENUS_KV.get(`menu:${id}`, 'json')
  
  if (!menu) {
    return new Response(JSON.stringify({ error: 'Menu not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(JSON.stringify(menu), {
    headers: { 'Content-Type': 'application/json' }
  })
})

router.post('/api/menu', async (req, env) => {
  const menu = await req.json()
  const id = crypto.randomUUID()
  
  await env.MENUS_KV.put(`menu:${id}`, JSON.stringify({ ...menu, id }))
  
  return new Response(JSON.stringify({ id, ...menu }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

router.put('/api/menu/:id', async (req, env) => {
  const id = req.params.id
  const updates = await req.json()
  
  const existing = await env.MENUS_KV.get(`menu:${id}`, 'json')
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Menu not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
  await env.MENUS_KV.put(`menu:${id}`, JSON.stringify(updated))
  
  return new Response(JSON.stringify(updated), {
    headers: { 'Content-Type': 'application/json' }
  })
})

// Default handler
router.get('/', () => {
  return new Response(JSON.stringify({ 
    message: 'Menu OCR API',
    version: '0.1.0',
    endpoints: [
      'POST /api/parse-menu - Parse menu text with LLM',
      'GET /api/qr?url=... - Generate QR code',
      'GET /api/menu/:id - Get menu by ID',
      'POST /api/menu - Create menu',
      'PUT /api/menu/:id - Update menu'
    ]
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.handle(request, env, ctx)
  }
}
