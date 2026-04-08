import { useCallback, useState } from 'react'
import { Upload, FileImage, FileText, X } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  className?: string
}

export default function FileUpload({ 
  onFilesSelected, 
  maxFiles = 5,
  className 
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]
    return allowedTypes.includes(file.type)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(validateFile).slice(0, maxFiles)
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles)
      onFilesSelected(validFiles)
    }
  }, [maxFiles, onFilesSelected])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(validateFile).slice(0, maxFiles)
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles)
      onFilesSelected(validFiles)
    }
  }, [maxFiles, onFilesSelected])

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index)
      onFilesSelected(newFiles)
      return newFiles
    })
  }, [onFilesSelected])

  const clearFiles = useCallback(() => {
    setSelectedFiles([])
    onFilesSelected([])
  }, [onFilesSelected])

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-6 h-6 text-red-500" />
    }
    return <FileImage className="w-6 h-6 text-blue-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-white hover:border-gray-400'
        )}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileInput}
          className="hidden"
        />
        <label 
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
            isDragActive ? 'bg-blue-100' : 'bg-gray-100'
          )}>
            <Upload className={cn(
              'w-8 h-8 transition-colors',
              isDragActive ? 'text-blue-600' : 'text-gray-500'
            )} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">
              {isDragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500">
              JPEG, PNG, WebP, or PDF up to 10MB each
            </p>
          </div>
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-900">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </p>
            <button
              onClick={clearFiles}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Clear all
            </button>
          </div>
          <ul className="space-y-2">
            {selectedFiles.map((file, index) => (
              <li 
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
              >
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
