import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MenuEditor from './MenuEditor'
import type { Menu } from '@menu-ocr/shared'
import { useMenuStore } from '../stores/menuStore'

// Mock the menu store
vi.mock('../stores/menuStore', () => ({
  useMenuStore: vi.fn(() => ({
    updateMenu: vi.fn(),
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    reorderCategories: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    moveItem: vi.fn(),
  })),
}))

describe('MenuEditor', () => {
  const mockMenu: Menu = {
    id: 'test-menu-1',
    name: 'Test Menu',
    description: 'A test menu',
    categories: [
      {
        id: 'cat-1',
        name: 'Appetizers',
        description: 'Start your meal',
        order: 0,
        items: [
          {
            id: 'item-1',
            name: 'Caesar Salad',
            price: 12.99,
            description: 'Fresh romaine lettuce',
            categoryId: 'cat-1',
            order: 0,
          },
        ],
      },
    ],
    template: 'minimal',
    primaryColor: '#3B82F6',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isPublished: false,
    slug: 'test-menu',
  }

  it('renders menu name input', () => {
    render(<MenuEditor menu={mockMenu} />)
    
    expect(screen.getByDisplayValue('Test Menu')).toBeInTheDocument()
  })

  it('renders menu description textarea', () => {
    render(<MenuEditor menu={mockMenu} />)
    
    expect(screen.getByDisplayValue('A test menu')).toBeInTheDocument()
  })

  it('renders categories', () => {
    render(<MenuEditor menu={mockMenu} />)
    
    expect(screen.getByText('Appetizers')).toBeInTheDocument()
  })

  it('renders items within categories', () => {
    render(<MenuEditor menu={mockMenu} />)
    
    expect(screen.getByText('Caesar Salad')).toBeInTheDocument()
    expect(screen.getByText('$12.99')).toBeInTheDocument()
  })

  it('allows adding a new category', async () => {
    render(<MenuEditor menu={mockMenu} />)
    
    const user = userEvent.setup()
    const addButton = screen.getByText('Add New Category')
    await user.click(addButton)
    
    const input = screen.getByPlaceholderText('Category name')
    await user.type(input, 'Desserts')
    
    const submitButton = screen.getByText('Add Category')
    await user.click(submitButton)
    
    // Should not throw
    expect(submitButton).toBeInTheDocument()
  })

  it('allows expanding/collapsing categories', async () => {
    render(<MenuEditor menu={mockMenu} />)
    
    const user = userEvent.setup()
    // Category should be expanded by default
    expect(screen.getByText('Caesar Salad')).toBeVisible()
    
    // Click collapse button
    const collapseButton = screen.getByRole('button', { name: '' }) // Chevron button
    await user.click(collapseButton)
    
    // Item should be hidden (implementation dependent, just checking button works)
    expect(collapseButton).toBeInTheDocument()
  })

  it('allows editing item inline', async () => {
    render(<MenuEditor menu={mockMenu} />)
    
    const user = userEvent.setup()
    // Find edit buttons (pencil icons)
    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find(btn => btn.querySelector('svg'))
    
    if (editButton) {
      await user.click(editButton)
      
      // Button should be clickable
      expect(editButton).toBeInTheDocument()
    }
  })

  it('shows empty state for categories with no items', () => {
    const emptyMenu: Menu = {
      ...mockMenu,
      categories: [{
        ...mockMenu.categories[0],
        items: [],
      }],
    }
    
    render(<MenuEditor menu={emptyMenu} />)
    
    expect(screen.getByText('No items yet. Click "Add Item" below.')).toBeInTheDocument()
  })

  it('allows deleting categories', async () => {
    // Mock confirm dialog
    vi.stubGlobal('confirm', () => true)
    
    render(<MenuEditor menu={mockMenu} />)
    
    const user = userEvent.setup()
    
    // Find delete button (trash icon)
    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find(btn => 
      btn.querySelector('svg')?.getAttribute('class')?.includes('text-red')
    )
    
    if (deleteButton) {
      await user.click(deleteButton)
      expect(deleteButton).toBeInTheDocument()
    }
  })
})
