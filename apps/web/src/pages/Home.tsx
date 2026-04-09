import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Sparkles, QrCode, Palette, AlertCircle, Edit3 } from 'lucide-react'
import FileUpload from '../components/FileUpload'
import OCRProcessor from '../components/OCRProcessor'
import ManualEntryModal from '../components/ManualEntryModal'
import { useMenuStore } from '../stores/menuStore'
import type { ParsedMenu, OCRQuality } from '@menu-ocr/shared'

export default function Home() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [ocrText, setOcrText] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showOCR, setShowOCR] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [failedRawText, setFailedRawText] = useState<string>('')
  const { addMenu } = useMenuStore()

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles)
    if (selectedFiles.length > 0) {
      setShowOCR(true)
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
          setFailedRawText(text)
          setIsProcessing(false)
          return
        }
        // Otherwise just warn but continue with empty menu
      }
      
      // Generate ID and store
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
        // Navigate to editor with the saved menu ID
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
      setFailedRawText(text)
      setIsProcessing(false)
    }
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
