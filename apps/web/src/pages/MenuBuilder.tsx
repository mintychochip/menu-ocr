import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, FileText, Upload, Loader2, AlertCircle, Edit3 } from 'lucide-react'
import FileUpload from '../components/FileUpload'
import OCRProcessor from '../components/OCRProcessor'
import ManualEntryModal from '../components/ManualEntryModal'
import { useMenuStore } from '../stores/menuStore'
import type { ParsedMenu, OCRQuality } from '@menu-ocr/shared'

export default function MenuBuilder() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { menus, addMenu, updateMenu } = useMenuStore()

  const [files, setFiles] = useState<File[]>([])
  const [ocrText, setOcrText] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showOCR, setShowOCR] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
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

  const handleOCRComplete = (text: string, _parsedData: ParsedMenu, quality: OCRQuality) => {
    setOcrText(text)
    setIsProcessing(true)
    setOcrError(null)
    setParseError(null)
    parseMenuWithLLM(text, quality)
  }

  const handleOCRError = (error: string) => {
    setOcrError(error)
    setIsProcessing(false)
  }

  const handleManualEntrySave = (menuData: ParsedMenu) => {
    const menuId = crypto.randomUUID()
    const newMenu = {
      ...menuData,
      id: menuId,
      slug: `menu-${menuId.slice(0, 8)}`,
      template: 'minimal',
      categories: menuData.categories || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: false
    }
    
    addMenu(newMenu as any)
    setShowManualEntry(false)
    setParseError(null)
    navigate(`/editor/${menuId}`)
  }

  const createBlankMenu = async () => {
    const menuId = crypto.randomUUID()
    const newMenu = {
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
    }

    // Save menu with backend sync
    const savedMenuId = await addMenu(newMenu as any, true)

    if (!savedMenuId) {
      setSyncError('Menu created but failed to sync with backend')
    }

    navigate(`/editor/${savedMenuId || menuId}`)
  }

  const parseMenuWithLLM = async (text: string, quality: OCRQuality) => {
    try {
      const response = await fetch('/api/parse-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      
      const data = await response.json()
      
      // Check for error response from API
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to parse menu')
      }
      
      const parsedMenu: ParsedMenu = data
      
      // Check if we got valid items
      if (!parsedMenu.items || parsedMenu.items.length === 0) {
        // If OCR quality was poor, offer manual entry
        if (quality === 'poor' || quality === 'uncertain') {
          setParseError('We could not automatically extract menu items from this image.')
          setIsProcessing(false)
          return
        }
      }
      
      const menuId = crypto.randomUUID()
      const newMenu = {
        ...parsedMenu,
        id: menuId,
        slug: `menu-${menuId.slice(0, 8)}`,
        template: 'minimal',
        categories: parsedMenu.categories || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublished: false
      }

      // Save menu with backend sync
      const savedMenuId = await addMenu(newMenu as any, true)

      if (savedMenuId) {
        navigate(`/editor/${savedMenuId}`)
      } else {
        setSyncError('Menu created but failed to sync with backend')
        navigate(`/editor/${menuId}`)
      }
    } catch (error) {
      console.error('Error parsing menu:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse menu'
      
      // Don't create fake menu - show error with manual entry option
      setParseError(errorMessage)
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
                onManualEntry={() => setShowManualEntry(true)}
              />
            )}
            
            {ocrError && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                Error: {ocrError}
              </div>
            )}

            {syncError && (
              <div className="mt-4 p-4 bg-yellow-50 text-yellow-700 rounded-lg">
                Warning: {syncError}
              </div>
            )}

            {parseError && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-800 mb-1">
                      Could not parse menu automatically
                    </h4>
                    <p className="text-sm text-amber-700 mb-3">
                      {parseError} You can enter your menu items manually instead.
                    </p>
                    <button
                      onClick={() => setShowManualEntry(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                                 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Enter Menu Manually
                    </button>
                  </div>
                </div>
              </div>
            )}

            <ManualEntryModal 
              isOpen={showManualEntry}
              onClose={() => setShowManualEntry(false)}
              onSave={handleManualEntrySave}
            />

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
