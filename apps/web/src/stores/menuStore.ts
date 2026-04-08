import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Menu, MenuCategory, MenuItem, ParsedMenu } from '@menu-ocr/shared'

interface MenuState {
  menus: Menu[]
  currentMenu: Menu | null
  ocrProgress: {
    status: 'idle' | 'loading' | 'recognizing' | 'complete' | 'error'
    progress: number
    message: string
  }
  parsedData: ParsedMenu | null
  
  // Actions
  setMenus: (menus: Menu[]) => void
  addMenu: (menu: Menu) => void
  updateMenu: (id: string, updates: Partial<Menu>) => void
  deleteMenu: (id: string) => void
  setCurrentMenu: (menu: Menu | null) => void
  setOcrProgress: (progress: MenuState['ocrProgress']) => void
  setParsedData: (data: ParsedMenu | null) => void
  
  // Category/Item actions
  addCategory: (menuId: string, category: Omit<MenuCategory, 'items'>) => void
  updateCategory: (menuId: string, categoryId: string, updates: Partial<MenuCategory>) => void
  deleteCategory: (menuId: string, categoryId: string) => void
  reorderCategories: (menuId: string, categoryIds: string[]) => void
  
  addItem: (menuId: string, categoryId: string, item: Omit<MenuItem, 'categoryId'>) => void
  updateItem: (menuId: string, itemId: string, updates: Partial<MenuItem>) => void
  deleteItem: (menuId: string, itemId: string) => void
  moveItem: (menuId: string, itemId: string, targetCategoryId: string) => void
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set, _get) => ({
      menus: [],
      currentMenu: null,
      ocrProgress: {
        status: 'idle',
        progress: 0,
        message: '',
      },
      parsedData: null,

      setMenus: (menus) => set({ menus }),
      
      addMenu: (menu) => set((state) => ({ 
        menus: [...state.menus, menu],
        currentMenu: menu 
      })),
      
      updateMenu: (id, updates) => set((state) => ({
        menus: state.menus.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        currentMenu: state.currentMenu?.id === id 
          ? { ...state.currentMenu, ...updates } 
          : state.currentMenu,
      })),
      
      deleteMenu: (id) => set((state) => ({
        menus: state.menus.filter((m) => m.id !== id),
        currentMenu: state.currentMenu?.id === id ? null : state.currentMenu,
      })),
      
      setCurrentMenu: (menu) => set({ currentMenu: menu }),
      
      setOcrProgress: (ocrProgress) => set({ ocrProgress }),
      
      setParsedData: (parsedData) => set({ parsedData }),

      addCategory: (menuId, category) => set((state) => {
        const menu = state.menus.find((m) => m.id === menuId)
        if (!menu) return state
        
        const newCategory: MenuCategory = { ...category, items: [] }
        const updatedMenu = {
          ...menu,
          categories: [...menu.categories, newCategory],
        }
        
        return {
          menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
          currentMenu: state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
        }
      }),

      updateCategory: (menuId, categoryId, updates) => set((state) => {
        const menu = state.menus.find((m) => m.id === menuId)
        if (!menu) return state
        
        const updatedMenu = {
          ...menu,
          categories: menu.categories.map((c) =>
            c.id === categoryId ? { ...c, ...updates } : c
          ),
        }
        
        return {
          menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
          currentMenu: state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
        }
      }),

      deleteCategory: (menuId, categoryId) => set((state) => {
        const menu = state.menus.find((m) => m.id === menuId)
        if (!menu) return state
        
        const updatedMenu = {
          ...menu,
          categories: menu.categories.filter((c) => c.id !== categoryId),
        }
        
        return {
          menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
          currentMenu: state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
        }
      }),

      reorderCategories: (menuId, categoryIds) => set((state) => {
        const menu = state.menus.find((m) => m.id === menuId)
        if (!menu) return state
        
        const categoryMap = new Map(menu.categories.map((c) => [c.id, c]))
        const reorderedCategories = categoryIds
          .map((id) => categoryMap.get(id))
          .filter(Boolean) as MenuCategory[]
        
        const updatedMenu = {
          ...menu,
          categories: reorderedCategories.map((c, i) => ({ ...c, order: i })),
        }
        
        return {
          menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
          currentMenu: state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
        }
      }),

      addItem: (menuId, categoryId, item) => set((state) => {
        const menu = state.menus.find((m) => m.id === menuId)
        if (!menu) return state
        
        const newItem: MenuItem = { ...item, categoryId }
        const updatedMenu = {
          ...menu,
          categories: menu.categories.map((c) =>
            c.id === categoryId ? { ...c, items: [...c.items, newItem] } : c
          ),
        }
        
        return {
          menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
          currentMenu: state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
        }
      }),

      updateItem: (menuId, itemId, updates) => set((state) => {
        const menu = state.menus.find((m) => m.id === menuId)
        if (!menu) return state
        
        const updatedMenu = {
          ...menu,
          categories: menu.categories.map((c) => ({
            ...c,
            items: c.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
          })),
        }
        
        return {
          menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
          currentMenu: state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
        }
      }),

      deleteItem: (menuId, itemId) => set((state) => {
        const menu = state.menus.find((m) => m.id === menuId)
        if (!menu) return state
        
        const updatedMenu = {
          ...menu,
          categories: menu.categories.map((c) => ({
            ...c,
            items: c.items.filter((i) => i.id !== itemId),
          })),
        }
        
        return {
          menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
          currentMenu: state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
        }
      }),

      moveItem: (menuId, itemId, targetCategoryId) => set((state) => {
        const menu = state.menus.find((m) => m.id === menuId)
        if (!menu) return state
        
        let itemToMove: MenuItem | null = null
        const categoriesWithoutItem = menu.categories.map((c) => ({
          ...c,
          items: c.items.filter((i) => {
            if (i.id === itemId) {
              itemToMove = i
              return false
            }
            return true
          }),
        }))
        
        if (!itemToMove) return state
        
        const updatedCategories = categoriesWithoutItem.map((c) =>
          c.id === targetCategoryId
            ? { ...c, items: [...c.items, { ...itemToMove!, categoryId: targetCategoryId }] }
            : c
        )
        
        const updatedMenu = { ...menu, categories: updatedCategories }
        
        return {
          menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
          currentMenu: state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
        }
      }),
    }),
    {
      name: 'menu-ocr-storage',
      partialize: (state) => ({ menus: state.menus }),
    }
  )
)
