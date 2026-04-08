import type { Middleware } from '../router'

export const handleCORS: Middleware = async (request, env, ctx, next) => {
  const origin = request.headers.get('Origin') || '*'
  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  const response = await next()
  
  // Clone response to add CORS headers
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })
  
  newResponse.headers.set('Access-Control-Allow-Origin', origin)
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return newResponse
}
