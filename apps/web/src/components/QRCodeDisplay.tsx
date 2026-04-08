import { useEffect, useState, useCallback } from 'react'
import QRCode from 'qrcode'
import { Download, Share2, Copy, Check } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface QRCodeDisplayProps {
  url: string
  menuName: string
  className?: string
}

export default function QRCodeDisplay({ url, menuName, className }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })
        setQrDataUrl(dataUrl)
      } catch (error) {
        console.error('Failed to generate QR code:', error)
      }
    }

    generateQR()
  }, [url])

  const handleDownload = useCallback(() => {
    if (!qrDataUrl) return
    
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `${menuName.toLowerCase().replace(/\s+/g, '-')}-qr-code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [qrDataUrl, menuName])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [url])

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: menuName,
          text: `Check out our menu: ${menuName}`,
          url,
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    }
  }, [url, menuName])

  if (!qrDataUrl) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* QR Code */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <img
          src={qrDataUrl}
          alt={`QR Code for ${menuName}`}
          className="w-full max-w-xs mx-auto"
        />
        <p className="text-center text-sm text-gray-500 mt-4">
          Scan to view the menu
        </p>
      </div>

      {/* URL Display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Menu URL</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm text-gray-700 bg-white px-3 py-2 rounded border break-all">
            {url}
          </code>
          <button
            onClick={handleCopy}
            className="p-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            title="Copy URL"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg
                     font-medium hover:bg-blue-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Download QR
        </button>
        <button
          onClick={handleShare}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors',
            !navigator.share && 'opacity-50 cursor-not-allowed'
          )}
          disabled={!navigator.share}
        >
          <Share2 className="w-5 h-5" />
          Share
        </button>
      </div>
    </div>
  )
}
