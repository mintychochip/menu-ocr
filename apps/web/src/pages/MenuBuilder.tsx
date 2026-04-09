import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, FileText, Upload, Loader2 } from 'lucide-react'
import FileUpload from '../components/FileUpload'
import OCRProcessor from '../components/OCRProcessor'
import { useMenuStore } from '../stores/menuStore'
import type { ParsedMenu } from '@menu-ocr/shared'

export default function MenuBuilder() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { menus, addMenu, updateMenu } = useMenuStore()
  
  const [files, setFiles] = useState<File[]>([])
  const [ocrText, setOcrText] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showOCR, setShowOCR] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [mode, setMode] = useState<'choose' | 'ocr' | 'blank'>('choose')

  // If an ID is provided, redirect to the editor
  useEffect(() => {
    if (id) {
      navigate(`/editor/${id}`)
    }
  }, [id, navigate])

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles)
    if (selectedFiles.length > 0) {
      setShowOCR(true)
      setMode('ocr')
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

  const createBlankMenu = () => {
    const menuId = crypto.randomUUID()
    addMenu({
      id: menuId,
      name: 'Untitled Menu',
      slug: `menu-${menuId.slice(0, 8)}`,
      categories: [{
        id: 'cat-1',
        name: 'Uncategorized',
        order: 0,
        items: []
      }],
      template: 'minimal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: false
    } as any)
    navigate(`/editor/${menuId}`)
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
      
      const menuId = crypto.randomUUID()
      addMenu({
        ...parsedMenu,
        id: menuId,
        slug: `menu-${menuId.slice(0, 8)}`,
        template: 'minimal',
        categories: parsedMenu.categories || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublished: false
      } as any)
      
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
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Menu Builder</h1>
          <p className="text-gray-600 mt-2">Create a new digital menu from scratch or scan an existing one.</p>
        </div>

        {mode === 'choose' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Start Blank */}
            <button
              onClick={createBlankMenu}
              className="bg-white rounded-2xl shadow-lg p-8 text-left hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Plus className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Start from Scratch</h2>
              <p className="text-gray-600">Create a blank menu and add items manually. Best for new menus or when you want full control.</p>
            </button>

            {/* Scan Menu */}
            <button
              onClick={() => setMode('ocr')}
              className="bg-white rounded-2xl shadow-lg p-8 text-left hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                <FileText className="w-7 h-7 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Scan Existing Menu</h2>
              <p className="text-gray-600">Upload a photo or PDF of your existing menu and our AI will extract the items automatically.</p>
            </button>
          </div>
        )}

        {mode === 'ocr' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Upload Your Menu
              </h2>
              <button
                onClick={() => setMode('choose')}
                className="text-gray-500 hover:text-gray-700"
              >
                Back
              </button>
            </div>
            
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
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Parsing menu with AI...
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
