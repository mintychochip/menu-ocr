import type { Env } from '../index'

export async function handleGenerateQR(
  request: Request & { params: Record<string, string> },
  env: Env
): Promise<Response> {
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'URL parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    // Generate QR code using a simple SVG-based approach
    // For production, you'd use a proper QR library
    const qrSvg = generateSimpleQR(targetUrl)

    return new Response(qrSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400'
      }
    })
  } catch (error) {
    console.error('QR generation error:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate QR code' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Simple QR code generator (placeholder - in production use proper library)
function generateSimpleQR(url: string): string {
  // This is a simplified QR code representation
  // In production, integrate with a proper QR library or API
  const size = 200
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="100%" height="100%" fill="white"/>
    <rect x="20" y="20" width="50" height="50" fill="black"/>
    <rect x="130" y="20" width="50" height="50" fill="black"/>
    <rect x="20" y="130" width="50" height="50" fill="black"/>
    <rect x="30" y="30" width="30" height="30" fill="white"/>
    <rect x="140" y="30" width="30" height="30" fill="white"/>
    <rect x="30" y="140" width="30" height="30" fill="white"/>
    <rect x="35" y="35" width="20" height="20" fill="black"/>
    <rect x="145" y="35" width="20" height="20" fill="black"/>
    <rect x="35" y="145" width="20" height="20" fill="black"/>
    <text x="${size/2}" y="${size/2}" text-anchor="middle" font-size="12" fill="black">${url.slice(0, 20)}...</text>
  </svg>`
  return svg
}
