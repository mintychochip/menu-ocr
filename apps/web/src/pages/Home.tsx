import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Sparkles, QrCode, Palette } from 'lucide-react'
import FileUpload from '../components/FileUpload'
import OCRProcessor from '../components/OCRProcessor'
import { useMenuStore } from '../stores/menuStore'
import type { ParsedMenu } from '@menu-ocr/shared'

export default function Home() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [ocrText, setOcrText] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showOCR, setShowOCR] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const { addMenu } = useMenuStore()

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles)
    if (selectedFiles.length > 0) {
      setShowOCR(true)
    }
  }

  const handleOCRComplete = (text: string) => {
    setOcrText(text)
    setIsProcessing(true)
    setOcrError(null)
    parseMenuWithLLM(text)
  }

  const handleOCRError = (error: string) => {
    setOcrError(error)
    setIsProcessing(false)
  }

  const parseMenuWithLLM = async (text: string) => {
    try {
      const response = await fetch('/api/parse-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      
      if (!response.ok) throw new Error('Failed to parse menu')
      
      const parsedMenu: ParsedMenu = await response.json()
      
      // Generate ID and store
      const menuId = crypto.randomUUID()
      addMenu({
        ...parsedMenu,
        id: menuId,
        slug: `menu-${menuId.slice(0, 8)}`,
        template: 'minimal',
        categories: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublished: false
      } as any)
      
      // Navigate to editor
      navigate(`/editor/${menuId}`)
    } catch (error) {
      console.error('Error parsing menu:', error)
      // Create basic menu from raw text as fallback
      const menuId = crypto.randomUUID()
      addMenu({
        id: menuId,
        name: 'Untitled Menu',
        slug: `menu-${menuId.slice(0, 8)}`,
        categories: [{
          id: 'cat-1',
          name: 'Uncategorized',
          order: 0,
          items: [{
            id: 'item-1',
            name: 'Sample Item',
            price: 0,
            categoryId: 'cat-1',
            order: 0,
            description: text.slice(0, 100) + '...'
          }]
        }],
        template: 'minimal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublished: false
      } as any)
      navigate(`/editor/${menuId}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Menu OCR
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your paper menus into beautiful digital experiences in seconds.
            Just upload, scan, and publish.
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-500" />
            Upload Your Menu
          </h2>
          <FileUpload onFilesSelected={handleFilesSelected} />
          
          {showOCR && files.length > 0 && (
            <OCRProcessor 
              files={files} 
              onComplete={handleOCRComplete}
              onError={handleOCRError}
            />
          )}
          
          {ocrError && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              Error: {ocrError}
            </div>
          )}
          
          {isProcessing && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-gray-600">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Parsing menu with AI...
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered OCR</h3>
            <p className="text-gray-600">
              Advanced text recognition extracts menu items, prices, and descriptions automatically.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Palette className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Beautiful Templates</h3>
            <p className="text-gray-600">
              Choose from modern, minimalist, or photo-heavy designs that look great on any device.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant QR Codes</h3>
            <p className="text-gray-600">
              Generate QR codes instantly. Customers scan and view your menu on their phones.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
