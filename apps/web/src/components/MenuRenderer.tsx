import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Menu } from '@menu-ocr/shared'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface MenuRendererProps {
  menu: Menu
  className?: string
}

export default function MenuRenderer({ menu, className }: MenuRendererProps) {
  const { template } = menu

  const renderMinimal = () => (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{menu.name}</h1>
          {menu.description && (
            <p className="text-gray-500">{menu.description}</p>
          )}
        </div>

        {/* Categories */}
        <div className="space-y-10">
          {menu.categories.map((category) => (
            <section key={category.id}>
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-900 pb-2 mb-6">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-gray-500 text-sm mb-4">{category.description}</p>
              )}
              <div className="space-y-4">
                {category.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-baseline">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900 ml-4">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )

  const renderDark = () => (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">{menu.name}</h1>
          {menu.description && (
            <p className="text-gray-400">{menu.description}</p>
          )}
        </div>

        {/* Categories */}
        <div className="space-y-10">
          {menu.categories.map((category) => (
            <section key={category.id}>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider border-b border-white/30 pb-2 mb-6">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-gray-400 text-sm mb-4">{category.description}</p>
              )}
              <div className="space-y-4">
                {category.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-baseline">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                      )}
                    </div>
                    <span className="font-semibold text-white/90 ml-4">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )

  const renderPhotoHeavy = () => (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 bg-gradient-to-b from-gray-800 to-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">{menu.name}</h1>
            {menu.description && (
              <p className="text-xl text-gray-300 max-w-lg">{menu.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="space-y-12">
          {menu.categories.map((category, categoryIndex) => (
            <section key={category.id}>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold">{category.name}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-white/50 to-transparent" />
              </div>
              {category.description && (
                <p className="text-gray-400 mb-6">{category.description}</p>
              )}
              <div className="grid gap-4">
                {category.items.map((item, itemIndex) => (
                  <div 
                    key={item.id}
                    className="bg-gray-900/50 rounded-xl p-4 flex gap-4"
                  >
                    {/* Placeholder for food image */}
                    <div className="w-20 h-20 bg-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <span className="text-2xl">
                        {['🍕', '🍔', '🥗', '🍜', '🍣', '🥘', '🍰', '☕'][
                          (categoryIndex + itemIndex) % 8
                        ]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <span className="font-bold text-xl text-white/90">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-gray-400 text-sm mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )

  const renderMenu = () => {
    switch (template) {
      case 'minimal':
        return renderMinimal()
      case 'dark':
        return renderDark()
      case 'photo-heavy':
        return renderPhotoHeavy()
      default:
        return renderMinimal()
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {renderMenu()}
    </div>
  )
}
