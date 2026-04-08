import { describe, it, expect, beforeEach } from 'vitest'
import { useMenuStore } from './menuStore'
import type { Menu } from '@menu-ocr/shared'

describe('menuStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useMenuStore.setState({
      menus: [],
      currentMenu: null,
      ocrProgress: {
        status: 'idle',
        progress: 0,
        message: '',
      },
      parsedData: null,
    })
  })

  describe('menu management', () => {
    it('should add a menu', () => {
      const menu: Menu = {
        id: '1',
        name: 'Test Menu',
        categories: [],
        template: 'minimal',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        isPublished: false,
        slug: 'test-menu',
      }

      useMenuStore.getState().addMenu(menu)

      expect(useMenuStore.getState().menus).toHaveLength(1)
      expect(useMenuStore.getState().menus[0].name).toBe('Test Menu')
      expect(useMenuStore.getState().currentMenu?.id).toBe('1')
    })

    it('should update a menu', () => {
      const menu: Menu = {
        id: '1',
        name: 'Test Menu',
        categories: [],
        template: 'minimal',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        isPublished: false,
        slug: 'test-menu',
      }

      useMenuStore.getState().addMenu(menu)
      useMenuStore.getState().updateMenu('1', { name: 'Updated Menu' })

      expect(useMenuStore.getState().menus[0].name).toBe('Updated Menu')
    })

    it('should delete a menu', () => {
      const menu: Menu = {
        id: '1',
        name: 'Test Menu',
        categories: [],
        template: 'minimal',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        isPublished: false,
        slug: 'test-menu',
      }

      useMenuStore.getState().addMenu(menu)
      useMenuStore.getState().deleteMenu('1')

      expect(useMenuStore.getState().menus).toHaveLength(0)
      expect(useMenuStore.getState().currentMenu).toBeNull()
    })
  })

  describe('category management', () => {
    it('should add a category to a menu', () => {
      const menu: Menu = {
        id: '1',
        name: 'Test Menu',
        categories: [],
        template: 'minimal',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        isPublished: false,
        slug: 'test-menu',
      }

      useMenuStore.getState().addMenu(menu)
      useMenuStore.getState().addCategory('1', {
        id: 'cat-1',
        name: 'Appetizers',
        order: 0,
      })

      expect(useMenuStore.getState().menus[0].categories).toHaveLength(1)
      expect(useMenuStore.getState().menus[0].categories[0].name).toBe('Appetizers')
    })

    it('should update a category', () => {
      const menu: Menu = {
        id: '1',
        name: 'Test Menu',
        categories: [
          { id: 'cat-1', name: 'Appetizers', order: 0, items: [] },
        ],
        template: 'minimal',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        isPublished: false,
        slug: 'test-menu',
      }

      useMenuStore.getState().addMenu(menu)
      useMenuStore.getState().updateCategory('1', 'cat-1', { name: 'Starters' })

      expect(useMenuStore.getState().menus[0].categories[0].name).toBe('Starters')
    })

    it('should delete a category', () => {
      const menu: Menu = {
        id: '1',
        name: 'Test Menu',
        categories: [
          { id: 'cat-1', name: 'Appetizers', order: 0, items: [] },
          { id: 'cat-2', name: 'Mains', order: 1, items: [] },
        ],
        template: 'minimal',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        isPublished: false,
        slug: 'test-menu',
      }

      useMenuStore.getState().addMenu(menu)
      useMenuStore.getState().deleteCategory('1', 'cat-1')

      expect(useMenuStore.getState().menus[0].categories).toHaveLength(1)
      expect(useMenuStore.getState().menus[0].categories[0].name).toBe('Mains')
    })
  })

  describe('item management', () => {
    it('should add an item to a category', () => {
      const menu: Menu = {
        id: '1',
        name: 'Test Menu',
        categories: [
          { id: 'cat-1', name: 'Appetizers', order: 0, items: [] },
        ],
        template: 'minimal',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        isPublished: false,
        slug: 'test-menu',
      }

      useMenuStore.getState().addMenu(menu)
      useMenuStore.getState().addItem('1', 'cat-1', {
        id: 'item-1',
        name: 'Caesar Salad',
        price: 12.99,
        order: 0,
      })

      expect(useMenuStore.getState().menus[0].categories[0].items).toHaveLength(1)
      expect(useMenuStore.getState().menus[0].categories[0].items[0].name).toBe('Caesar Salad')
    })

    it('should update an item', () => {
      const menu: Menu = {
        id: '1',
        name: 'Test Menu',
        categories: [
          {
            id: 'cat-1',
            name: 'Appetizers',
            order: 0,
            items: [
              { id: 'item-1', name: 'Caesar Salad', price: 12.99, categoryId: 'cat-1', order: 0 },
            ],
          },
        ],
        template: 'minimal',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        isPublished: false,
        slug: 'test-menu',
      }

      useMenuStore.getState().addMenu(menu)
      useMenuStore.getState().updateItem('1', 'item-1', { price: 14.99 })

      expect(useMenuStore.getState().menus[0].categories[0].items[0].price).toBe(14.99)
    })

    it('should delete an item', () => {
      const menu: Menu = {
        id: '1',
        name: 'Test Menu',
        categories: [
          {
            id: 'cat-1',
            name: 'Appetizers',
            order: 0,
            items: [
              { id: 'item-1', name: 'Caesar Salad', price: 12.99, categoryId: 'cat-1', order: 0 },
              { id: 'item-2', name: 'Bruschetta', price: 9.99, categoryId: 'cat-1', order: 1 },
            ],
          },
        ],
        template: 'minimal',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        isPublished: false,
        slug: 'test-menu',
      }

      useMenuStore.getState().addMenu(menu)
      useMenuStore.getState().deleteItem('1', 'item-1')

      expect(useMenuStore.getState().menus[0].categories[0].items).toHaveLength(1)
      expect(useMenuStore.getState().menus[0].categories[0].items[0].name).toBe('Bruschetta')
    })
  })

  describe('OCR progress', () => {
    it('should set OCR progress', () => {
      useMenuStore.getState().setOcrProgress({
        status: 'recognizing',
        progress: 50,
        message: 'Processing...',
      })

      expect(useMenuStore.getState().ocrProgress.status).toBe('recognizing')
      expect(useMenuStore.getState().ocrProgress.progress).toBe(50)
    })
  })
})
