import { useState, useCallback, useRef, useEffect } from 'react'
import { createWorker, type Worker } from 'tesseract.js'
import { Loader2, CheckCircle, AlertCircle, FileText, RefreshCw, Edit3, ArrowRight, AlertTriangle } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import * as pdfjs from 'pdfjs-dist'
import type { OCRProgress, ParsedMenu, OCRQuality } from '@menu-ocr/shared'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

interface OCRProcessorProps {
  files: File[]
  onComplete: (text: string, parsedData: ParsedMenu, quality: OCRQuality) => void
  onError: (error: string) => void
  onManualEntry?: () => void
  className?: string
}

export default function OCRProcessor({
  files,
  onComplete,
  onError,
  onManualEntry,
  className,
}: OCRProcessorProps) {
  const [progress, setProgress] = useState<OCRProgress>({
    status: 'idle',
    progress: 0,
    message: '',
    quality: 'uncertain',
  })
  const workerRef = useRef<Worker | null>(null)
  const abortRef = useRef(false)

  const cleanup = useCallback(async () => {
    if (workerRef.current) {
      await workerRef.current.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      if (abortRef.current) break
      
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n'
      
      setProgress((prev) => ({
        ...prev,
        progress: Math.round((i / pdf.numPages) * 30),
        message: `Extracting text from PDF page ${i} of ${pdf.numPages}...`,
      }))
    }

    return fullText
  }

  const processImage = async (file: File): Promise<string> => {
    if (!workerRef.current) {
      workerRef.current = await createWorker('eng')
    }

    const result = await workerRef.current.recognize(file)

    return result.data.text
  }

  const processWithGroq = async (text: string): Promise<ParsedMenu> => {
    const apiKey = (import.meta as any).env?.VITE_GROQ_API_KEY
    
    if (!apiKey) {
      // Fallback parsing if no API key
      return fallbackParse(text)
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a menu parser. Extract menu items from the provided text and return a structured JSON object. The response must be valid JSON with this structure:
{
  "name": "Restaurant Name (if found)",
  "categories": ["Category1", "Category2"],
  "items": [
    {
      "name": "Item Name",
      "price": 12.99,
      "description": "Brief description (optional)",
      "category": "Category Name"
    }
  ]
}

Rules:
- Extract all food and drink items with prices
- Group items by category when possible
- Prices should be numbers without currency symbols
- If no clear categories exist, use "Menu Items"
- Item descriptions are optional, include if clearly stated`,
            },
            {
              role: 'user',
              content: `Parse this menu text and return structured JSON:\n\n${text}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 4000,
        }),
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`)
      }

      const data = await response.json()
      const parsedContent = data.choices[0].message.content
      
      // Try to parse JSON from response
      try {
        const jsonMatch = parsedContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
        return fallbackParse(text)
      } catch {
        return fallbackParse(text)
      }
    } catch (error) {
      console.error('Groq parsing error:', error)
      return fallbackParse(text)
    }
  }

  const fallbackParse = (text: string): ParsedMenu => {
    const lines = text.split('\n').filter((line) => line.trim())
    const items: ParsedMenu['items'] = []
    const categories = new Set<string>()
    
    // Simple regex patterns for menu items
    const itemPattern = /([^$\d]+)\s*[$]?([\d,]+\.?\d{0,2})/
    
    let currentCategory = 'Menu Items'
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Check if line might be a category (short, no price, all caps or title case)
      if (trimmed.length < 30 && !trimmed.match(/\$?\d+\.?\d{0,2}/)) {
        if (trimmed === trimmed.toUpperCase() || trimmed.split(' ').every(w => w[0] === w[0]?.toUpperCase())) {
          currentCategory = trimmed
          categories.add(currentCategory)
          continue
        }
      }
      
      // Try to extract item with price
      const match = trimmed.match(itemPattern)
      if (match) {
        const name = match[1].trim()
        const price = parseFloat(match[2].replace(',', ''))
        
        if (name && !isNaN(price) && price > 0) {
          items.push({
            name,
            price,
            category: currentCategory,
          })
        }
      }
    }
    
    return {
      name: undefined,
      categories: Array.from(categories).length > 0 ? Array.from(categories) : ['Menu Items'],
      items,
    }
  }

  // Detect OCR text quality
  const detectQuality = useCallback((text: string): OCRQuality => {
    if (!text || text.trim().length === 0) {
      return 'poor'
    }

    const trimmedText = text.trim()
    const words = trimmedText.split(/\s+/).filter(w => w.length > 0)
    
    // Too short - likely garbled or empty
    if (words.length < 5) {
      return 'poor'
    }

    // Check for excessive random/special characters (garbled text)
    const specialChars = trimmedText.replace(/[a-zA-Z0-9\s\.,;:'"\-()$]/g, '')
    const specialCharRatio = specialChars.length / trimmedText.length
    if (specialCharRatio > 0.3) {
      return 'poor'
    }

    // Check for random character patterns (common in garbled OCR)
    const randomPatternMatches = trimmedText.match(/[^\w\s]{3,}|[@#$%^&*]{2,}/g)
    if (randomPatternMatches && randomPatternMatches.length > 2) {
      return 'poor'
    }

    // Check for very short average word length (random characters)
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length
    if (avgWordLength < 2 && words.length > 10) {
      return 'poor'
    }

    // Mixed signals - some valid text but quality issues
    if (specialCharRatio > 0.15 || (avgWordLength < 3 && words.length > 20)) {
      return 'uncertain'
    }

    return 'good'
  }, [])

  const startProcessing = useCallback(async () => {
    if (files.length === 0) return
    
    abortRef.current = false
    setProgress({
      status: 'loading',
      progress: 0,
      message: 'Starting OCR processing...',
    })

    try {
      let allText = ''

      for (let i = 0; i < files.length; i++) {
        if (abortRef.current) break
        
        const file = files[i]
        const isPDF = file.type === 'application/pdf'
        
        setProgress({
          status: isPDF ? 'recognizing' : 'loading',
          progress: Math.round((i / files.length) * 100),
          message: `Processing file ${i + 1} of ${files.length}: ${file.name}...`,
        })

        let text: string
        if (isPDF) {
          text = await extractTextFromPDF(file)
        } else {
          text = await processImage(file)
        }
        
        allText += text + '\n'
      }

      if (abortRef.current) {
        throw new Error('Processing was cancelled')
      }

      // Detect quality of OCR text
      const quality = detectQuality(allText)

      // Now parse with Groq
      setProgress({
        status: 'recognizing',
        progress: 70,
        message: 'Parsing menu structure with AI...',
        quality,
      })

      const parsedData = await processWithGroq(allText)

      setProgress({
        status: 'complete',
        progress: 100,
        message: 'Processing complete!',
        quality,
      })

      onComplete(allText, parsedData, quality)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setProgress({
        status: 'error',
        progress: 0,
        message: errorMessage,
        quality: 'poor',
      })
      onError(errorMessage)
    } finally {
      cleanup()
    }
  }, [files, onComplete, onError, cleanup, detectQuality])

  const cancelProcessing = useCallback(() => {
    abortRef.current = true
    cleanup()
    setProgress({
      status: 'idle',
      progress: 0,
      message: '',
      quality: 'uncertain',
    })
  }, [cleanup])

  const handleQualityDecision = useCallback((decision: 'retry' | 'continue' | 'manual') => {
    if (decision === 'retry') {
      setProgress({
        status: 'idle',
        progress: 0,
        message: '',
        quality: 'uncertain',
      })
      // Give time for UI to update then restart
      setTimeout(() => startProcessing(), 100)
    } else if (decision === 'manual') {
      onManualEntry?.()
    } else if (decision === 'continue') {
      // User wants to continue despite poor quality
      setProgress(prev => ({ ...prev, qualityWarningShown: true }))
    }
  }, [onManualEntry, startProcessing])

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'complete':
        return progress.quality === 'poor' 
          ? <AlertTriangle className="w-5 h-5 text-amber-500" />
          : <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'idle':
        return <FileText className="w-5 h-5 text-gray-400" />
      default:
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
    }
  }

  // Quality warning UI
  const QualityWarning = () => (
    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-amber-800 mb-1">
            Low quality scan detected
          </h4>
          <p className="text-sm text-amber-700 mb-3">
            The text extracted looks garbled (like &quot;SATERMERIEAND | | Sik meron...&quot;). 
            This happens with blurry photos or poor lighting.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQualityDecision('retry')}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-100 hover:bg-amber-200 
                         text-amber-800 text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => handleQualityDecision('manual')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 
                         border border-gray-300 text-gray-700 text-sm font-medium 
                         rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Enter Manually
            </button>
            <button
              onClick={() => handleQualityDecision('continue')}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 
                         text-white text-sm font-medium rounded-lg transition-colors"
            >
              Continue Anyway
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className={cn('space-y-4', className)}>
      {progress.status === 'idle' ? (
        <button
          onClick={startProcessing}
          disabled={files.length === 0}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg
                     hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          <FileText className="w-5 h-5" />
          Start OCR Processing
        </button>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            {getStatusIcon()}
            <span className={cn(
              'font-medium',
              progress.status === 'error' ? 'text-red-600' : 'text-gray-900'
            )}>
              {progress.message}
            </span>
          </div>

          {progress.status !== 'complete' && progress.status !== 'error' && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{progress.progress}%</span>
                <button
                  onClick={cancelProcessing}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* Quality Warning for poor quality scans */}
          {progress.status === 'complete' && progress.quality === 'poor' && !progress.qualityWarningShown && (
            <QualityWarning />
          )}
        </div>
      )}
    </div>
  )
}
