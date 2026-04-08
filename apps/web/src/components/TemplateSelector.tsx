import { Palette, Moon, Image as ImageIcon, Check } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Menu } from '@menu-ocr/shared'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface TemplateSelectorProps {
  currentTemplate: Menu['template']
  onSelect: (template: Menu['template']) => void
  className?: string
}

const templates = [
  {
    id: 'minimal' as const,
    name: 'Minimal',
    description: 'Clean white design with simple typography',
    icon: Palette,
    preview: (
      <div className="w-full h-full bg-white flex flex-col p-2 gap-1">
        <div className="h-3 w-16 bg-gray-800 rounded" />
        <div className="h-2 w-24 bg-gray-400 rounded" />
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <div className="h-2 w-20 bg-gray-700 rounded" />
            <div className="h-2 w-8 bg-gray-600 rounded" />
          </div>
          <div className="flex justify-between">
            <div className="h-2 w-16 bg-gray-700 rounded" />
            <div className="h-2 w-8 bg-gray-600 rounded" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'dark' as const,
    name: 'Dark',
    description: 'Modern black background with white text',
    icon: Moon,
    preview: (
      <div className="w-full h-full bg-gray-900 flex flex-col p-2 gap-1">
        <div className="h-3 w-16 bg-white rounded" />
        <div className="h-2 w-24 bg-gray-400 rounded" />
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <div className="h-2 w-20 bg-gray-200 rounded" />
            <div className="h-2 w-8 bg-gray-300 rounded" />
          </div>
          <div className="flex justify-between">
            <div className="h-2 w-16 bg-gray-200 rounded" />
            <div className="h-2 w-8 bg-gray-300 rounded" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'photo-heavy' as const,
    name: 'Photo Heavy',
    description: 'Large images with overlaid text',
    icon: ImageIcon,
    preview: (
      <div className="w-full h-full bg-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-900" />
        <div className="relative p-2">
          <div className="h-12 w-full bg-gray-600 rounded mb-2" />
          <div className="h-2 w-20 bg-white rounded" />
        </div>
      </div>
    ),
  },
]

export default function TemplateSelector({
  currentTemplate,
  onSelect,
  className,
}: TemplateSelectorProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-4', className)}>
      {templates.map((template) => {
        const Icon = template.icon
        const isSelected = currentTemplate === template.id

        return (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={cn(
              'relative rounded-xl border-2 p-4 text-left transition-all',
              isSelected
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 mb-3">
              {template.preview}
            </div>

            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn(
                'w-4 h-4',
                isSelected ? 'text-blue-600' : 'text-gray-500'
              )} />
              <span className={cn(
                'font-semibold',
                isSelected ? 'text-blue-900' : 'text-gray-900'
              )}>
                {template.name}
              </span>
            </div>

            <p className={cn(
              'text-sm',
              isSelected ? 'text-blue-700' : 'text-gray-500'
            )}>
              {template.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}