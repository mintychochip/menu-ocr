import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpDown
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Menu, MenuCategory, MenuItem } from '@menu-ocr/shared'
import { useMenuStore } from '../stores/menuStore'
import { v4 as uuidv4 } from 'uuid'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Sortable Category Item Component
interface SortableCategoryProps {
  category: MenuCategory
  onUpdate: (id: string, updates: Partial<MenuCategory>) => void
  onDelete: (id: string) => void
  onAddItem: (categoryId: string) => void
  onUpdateItem: (itemId: string, updates: Partial<MenuItem>) => void
  onDeleteItem: (itemId: string) => void
  onMoveItem: (itemId: string, targetCategoryId: string) => void
  categories: MenuCategory[]
}

function SortableCategory({ 
  category, 
  onUpdate, 
  onDelete, 
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onMoveItem,
  categories,
}: SortableCategoryProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)
  const [expanded, setExpanded] = useState(true)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSave = () => {
    if (editName.trim()) {
      onUpdate(category.id, { name: editName.trim() })
    }
    setIsEditing(false)
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50 bg-gray-50 rounded-lg p-4 border-2 border-dashed border-blue-400"
      >
        <div className="h-10" />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
    >
      {/* Category Header */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-200">
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
        
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
              <Save className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { setIsEditing(false); setEditName(category.name); }}
              className="p-1 text-gray-400 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <h3 className="flex-1 font-semibold text-gray-900">{category.name}</h3>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-gray-400 hover:bg-gray-200 rounded"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:bg-gray-200 rounded"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(category.id)}
              className="p-1 text-red-400 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Items */}
      {expanded && (
        <div className="p-4 space-y-3">
          {category.items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No items yet. Click "Add Item" below.
            </p>
          ) : (
            category.items.map((item) => (
              <EditableItem
                key={item.id}
                item={item}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
                categories={categories}
                onMove={onMoveItem}
              />
            ))
          )}
          
          <button
            onClick={() => onAddItem(category.id)}
            className="w-full py-2 px-3 border border-dashed border-gray-300 rounded-lg
                       text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50
                       flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      )}
    </div>
  )
}

// Editable Item Component
interface EditableItemProps {
  item: MenuItem
  onUpdate: (itemId: string, updates: Partial<MenuItem>) => void
  onDelete: (itemId: string) => void
  categories: MenuCategory[]
  onMove: (itemId: string, targetCategoryId: string) => void
}

function EditableItem({ item, onUpdate, onDelete, categories, onMove }: EditableItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editPrice, setEditPrice] = useState(item.price.toString())
  const [editDescription, setEditDescription] = useState(item.description || '')
  const [showMove, setShowMove] = useState(false)

  const handleSave = () => {
    const price = parseFloat(editPrice)
    if (editName.trim() && !isNaN(price)) {
      onUpdate(item.id, {
        name: editName.trim(),
        price,
        description: editDescription.trim() || undefined,
      })
    }
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Item name"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
        <div className="flex gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              placeholder="Price"
              className="pl-6 pr-3 py-2 border border-gray-300 rounded text-sm w-24"
            />
          </div>
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={() => {
              setIsEditing(false)
              setEditName(item.name)
              setEditPrice(item.price.toString())
              setEditDescription(item.description || '')
            }}
            className="px-3 py-1 text-gray-600 text-sm rounded hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group">
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <h4 className="font-medium text-gray-900">{item.name}</h4>
          <span className="font-semibold text-gray-900">${item.price.toFixed(2)}</span>
        </div>
        {item.description && (
          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={() => setShowMove(!showMove)}
            className="p-1 text-gray-400 hover:bg-gray-200 rounded"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
          {showMove && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <div className="p-2">
                <p className="text-xs text-gray-500 mb-2">Move to:</p>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onMove(item.id, cat.id)
                      setShowMove(false)
                    }}
                    disabled={cat.id === item.categoryId}
                    className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-gray-400 hover:bg-gray-200 rounded"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1 text-red-400 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Main Menu Editor Component
interface MenuEditorProps {
  menu: Menu
  className?: string
}

export default function MenuEditor({ menu, className }: MenuEditorProps) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [categoryIds, setCategoryIds] = useState(menu.categories.map((c) => c.id))
  
  const { updateMenu, addCategory, updateCategory, deleteCategory, reorderCategories,
          addItem, updateItem, deleteItem, moveItem } = useMenuStore()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = categoryIds.indexOf(active.id as string)
      const newIndex = categoryIds.indexOf(over.id as string)
      const newOrder = arrayMove<string>(categoryIds, oldIndex, newIndex)
      
      setCategoryIds(newOrder)
      reorderCategories(menu.id, newOrder)
    }
  }

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const id = uuidv4()
      addCategory(menu.id, {
        id,
        name: newCategoryName.trim(),
        order: menu.categories.length,
      })
      setCategoryIds([...categoryIds, id])
      setNewCategoryName('')
      setIsAddingCategory(false)
    }
  }

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('Delete this category and all its items?')) {
      deleteCategory(menu.id, categoryId)
      setCategoryIds(categoryIds.filter((id) => id !== categoryId))
    }
  }

  const handleAddItem = (categoryId: string) => {
    addItem(menu.id, categoryId, {
      id: uuidv4(),
      name: 'New Item',
      price: 0,
      order: menu.categories.find((c) => c.id === categoryId)?.items.length || 0,
    })
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Menu Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Menu Name
        </label>
        <input
          type="text"
          value={menu.name}
          onChange={(e) => updateMenu(menu.id, { name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter menu name..."
        />
        <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
          Description (optional)
        </label>
        <textarea
          value={menu.description || ''}
          onChange={(e) => updateMenu(menu.id, { description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="Brief description of your menu..."
        />
      </div>

      {/* Categories */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categoryIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {menu.categories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                onUpdate={(id, updates) => updateCategory(menu.id, id, updates)}
                onDelete={handleDeleteCategory}
                onAddItem={handleAddItem}
                onUpdateItem={(itemId, updates) => updateItem(menu.id, itemId, updates)}
                onDeleteItem={(itemId) => deleteItem(menu.id, itemId)}
                onMoveItem={(itemId, targetCategoryId) => moveItem(menu.id, itemId, targetCategoryId)}
                categories={menu.categories}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Category */}
      {isAddingCategory ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add Category
            </button>
            <button
              onClick={() => {
                setIsAddingCategory(false)
                setNewCategoryName('')
              }}
              className="px-4 py-2 text-gray-600 rounded-lg text-sm hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingCategory(true)}
          className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg
                     text-gray-600 font-medium hover:border-gray-400 hover:bg-gray-50
                     flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New Category
        </button>
      )}
    </div>
  )
}
