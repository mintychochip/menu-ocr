import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import MenuRenderer from '../components/MenuRenderer'
import { useMenuStore } from '../stores/menuStore'
import type { Menu } from '@menu-ocr/shared'

export default function MenuView() {
  const { slug } = useParams<{ slug: string }>()
  const { menus } = useMenuStore()
  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Find menu by slug
    const foundMenu = menus.find(m => m.slug === slug)
    
    if (foundMenu) {
      setMenu(foundMenu)
      setLoading(false)
    } else {
      // In a real app, fetch from API
      setLoading(false)
    }
  }, [slug, menus])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Menu Not Found</h1>
          <p className="text-gray-600">This menu doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <MenuRenderer menu={menu} />
    </div>
  )
}
