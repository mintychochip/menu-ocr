import { useState } from 'react'
import { X, Plus, Trash2, Save } from 'lucide-react'
import type { ParsedMenu, ParsedMenuItem } from '@menu-ocr/shared'

interface ManualEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (menu: ParsedMenu) => void
}

interface ManualItem {
  id: string
  name: string
  price: string
  category: string
  description: string
}

export default function ManualEntryModal({ isOpen, onClose, onSave }: ManualEntryModalProps) {
  const [menuName, setMenuName] = useState('')
  const [items, setItems] = useState<ManualItem[]>([
    { id: '1', name: '', price: '', category: '', description: '' }
  ])

  if (!isOpen) return null

  const addItem = () => {
    setItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: '', price: '', category: '', description: '' }
    ])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof ManualItem, value: string) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const handleSave = () => {
    // Filter out empty items and convert to ParsedMenu format
    const validItems: ParsedMenuItem[] = items
      .filter(item => item.name.trim())
      .map(item => ({
        name: item.name.trim(),
        price: item.price ? parseFloat(item.price) : undefined,
        category: item.category.trim() || undefined,
        description: item.description.trim() || undefined
      }))

    // Extract unique categories
    const categories = Array.from(
      new Set(validItems.map(item => item.category).filter(Boolean))
    ) as string[]

    const menuData: ParsedMenu = {
      name: menuName.trim() || 'Untitled Menu',
      items: validItems,
      categories: categories.length > 0 ? categories : undefined
    }

    onSave(menuData)
    
    // Reset form
    setMenuName('')
    setItems([{ id: '1', name: '', price: '', category: '', description: '' }])
  }

  const handleClose = () => {
    onClose()
    // Reset form
    setMenuName('')
    setItems([{ id: '1', name: '', price: '', category: '', description: '' }])
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Enter Menu Manually</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add your menu items one by one. At least a name is required for each item.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Menu Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Menu Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="e.g., Joe's Pizza Menu"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Items */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Menu Items
            </label>
            
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Item #{index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Item Name */}
                  <div className="col-span-2 sm:col-span-1">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="Item name *"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>

                  {/* Price */}
                  <div className="col-span-2 sm:col-span-1">
                    <input
                      type="text"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                      placeholder="Price (e.g., 12.99)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>

                  {/* Category */}
                  <div className="col-span-2 sm:col-span-1">
                    <input
                      type="text"
                      value={item.category}
                      onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                      placeholder="Category (e.g., Appetizers)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-2 sm:col-span-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          <button
            onClick={addItem}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Item
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!items.some(item => item.name.trim())}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Menu
          </button>
        </div>
      </div>
    </div>
  )
}
