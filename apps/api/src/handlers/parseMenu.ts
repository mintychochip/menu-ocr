import type { Env } from '../index'

export async function handleParseMenu(
  request: Request & { params: Record<string, string> },
  env: Env
): Promise<Response> {
  let rawText = ''
  
  try {
    const { text } = await request.json() as { text: string }
    rawText = text

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'No text provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Call Groq API to parse menu
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: `You are a menu parsing expert. Extract menu items from the provided text and return them as structured JSON.

Extract the following for each item:
- name: The dish/item name
- price: Price as a number (without currency symbol)
- description: Brief description if available
- category: The category (appetizers, mains, desserts, etc.)

Return ONLY valid JSON in this exact format:
{
  "name": "Restaurant Name" (extract if mentioned, otherwise null),
  "items": [
    {
      "name": "Dish Name",
      "price": 12.99,
      "description": "Description text",
      "category": "Category Name"
    }
  ],
  "categories": ["Category1", "Category2"] (list of unique categories)
}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Groq API error:', error)
      
      // Return error response - don't create fake menu items
      return new Response(JSON.stringify({
        error: 'Could not parse menu',
        rawText,
        items: [],
        categories: []
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const groqData = await response.json()
    const parsedContent = groqData.choices[0].message.content
    
    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = parsedContent.match(/```json\n?([\s\S]*?)\n?```/) || 
                      parsedContent.match(/```\n?([\s\S]*?)\n?```/) ||
                      [null, parsedContent]
    
    const jsonStr = jsonMatch[1] || parsedContent
    
    try {
      const parsed = JSON.parse(jsonStr)
      
      // Ensure proper structure
      const result = {
        name: parsed.name || 'Untitled Menu',
        items: (parsed.items || []).map((item: any) => ({
          name: item.name || 'Unknown Item',
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
          description: item.description || '',
          category: item.category || 'Uncategorized'
        })),
        categories: parsed.categories || extractCategories(parsed.items || [])
      }

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      
      // Return error response - don't create fake menu items
      return new Response(JSON.stringify({
        error: 'Could not parse menu',
        rawText,
        items: [],
        categories: []
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error('Error in parse-menu:', error)
    return new Response(JSON.stringify({ error: 'Failed to parse menu', rawText }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

function parseBasicMenu(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim())
  const items: any[] = []
  let currentCategory = 'Uncategorized'
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Check if line looks like a category (short, no price, often title case)
    if (trimmed.length < 30 && !trimmed.match(/\$?\d+\.?\d*/) && trimmed[0] === trimmed[0].toUpperCase()) {
      currentCategory = trimmed
      continue
    }
    
    // Try to extract price
    const priceMatch = trimmed.match(/\$?(\d+\.\d{2})/) || trimmed.match(/\$?(\d+)/)
    const price = priceMatch ? parseFloat(priceMatch[1]) : 0
    
    // Extract name (everything before price or first 40 chars)
    let name = trimmed
    if (priceMatch) {
      name = trimmed.slice(0, priceMatch.index).trim() || trimmed.slice(priceMatch.index + priceMatch[0].length).trim()
    }
    name = name.slice(0, 50).trim()
    
    if (name && name.length > 2 && price > 0) {
      items.push({
        name,
        price,
        description: '',
        category: currentCategory
      })
    }
  }
  
  // Return empty array if nothing found - NO PLACEHOLDER ITEMS
  return items
}

function extractCategories(items: any[]): string[] {
  const categories = new Set(items.map(item => item.category).filter(Boolean))
  return categories.size > 0 ? Array.from(categories) : ['Uncategorized']
}
