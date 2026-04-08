import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Save, QrCode } from 'lucide-react'
import MenuEditor from '../components/MenuEditor'
import TemplateSelector from '../components/TemplateSelector'
import QRCodeDisplay from '../components/QRCodeDisplay'
import { useMenuStore } from '../stores/menuStore'

export default function Editor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { menus, updateMenu, deleteMenu, setCurrentMenu } = useMenuStore()
  const menu = id ? menus.find(m => m.id === id) || null : null
  
  const [showQR, setShowQR] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'template'>('edit')

  if (!menu || !id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Not Found</h2>
          <p className="text-gray-600 mb-4">The menu you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const handleUpdateMenu = (updates: any) => {
    if (id) updateMenu(id, updates)
  }

  const handleDelete = () => {
    if (id && confirm('Are you sure you want to delete this menu?')) {
      deleteMenu(id)
      navigate('/')
    }
  }

  const handlePublish = () => {
    // In a real app, this would save to a backend
    // For now, it's already in the store
    navigate(`/preview/${id}`)
  }

  const publicUrl = `${window.location.origin}/menu/${menu.slug}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {menu.name || 'Untitled Menu'}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQR(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">QR Code</span>
              </button>
              
              <button
                onClick={() => navigate(`/preview/${id}`)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Preview</span>
              </button>
              
              <button
                onClick={handlePublish}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Publish</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('edit')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'edit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Edit Menu
            </button>
            <button
              onClick={() => setActiveTab('template')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'template'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Template & Style
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'edit' ? (
          <MenuEditor menu={menu} />
        ) : (
          <TemplateSelector
            currentTemplate={menu.template}
            onSelect={(template) => handleUpdateMenu({ template })}
          />
        )}
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Menu QR Code</h3>
              <button onClick={() => setShowQR(false)} className="p-1 hover:bg-gray-100 rounded">
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <QRCodeDisplay url={publicUrl} menuName={menu.name} />
          </div>
        </div>
      )}
    </div>
  )
}
