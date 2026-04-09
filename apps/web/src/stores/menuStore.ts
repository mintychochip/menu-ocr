import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Menu, MenuCategory, MenuItem, ParsedMenu } from '@menu-ocr/shared'

const API_BASE_URL = '/api'

interface MenuState {
  menus: Menu[]
  currentMenu: Menu | null
  ocrProgress: {
    status: 'idle' | 'loading' | 'recognizing' | 'complete' | 'error'
    progress: number
    message: string
  }
  parsedData: ParsedMenu | null
  isLoading: boolean
  error: string | null

  // Actions
  setMenus: (menus: Menu[]) => void
  addMenu: (menu: Menu, sync?: boolean) => Promise<string>
  updateMenu: (id: string, updates: Partial<Menu>, sync?: boolean) => Promise<void>
  deleteMenu: (id: string) => void
  setCurrentMenu: (menu: Menu | null) => void
  setOcrProgress: (progress: MenuState['ocrProgress']) => void
  setParsedData: (data: ParsedMenu | null) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void

  // Backend sync actions
  saveMenuToBackend: (menu: Menu) => Promise<{ id: string } | null>
  fetchMenuFromBackend: (id: string) => Promise<Menu | null>
  loadMenu: (id: string) => Promise<Menu | null>

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
    (set, get) => ({
      menus: [],
      currentMenu: null,
      ocrProgress: {
        status: 'idle',
        progress: 0,
        message: '',
      },
      parsedData: null,
      isLoading: false,
      error: null,

      setMenus: (menus) => set({ menus }),

      setIsLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      saveMenuToBackend: async (menu: Menu) => {
        try {
          const response = await fetch(`${API_BASE_URL}/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(menu),
          })

          if (!response.ok) {
            console.error('Failed to save menu to backend:', response.statusText)
            return null
          }

          const result = await response.json()
          return result
        } catch (error) {
          console.error('Error saving menu to backend:', error)
          return null
        }
      },

      fetchMenuFromBackend: async (id: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/menu/${id}`)

          if (!response.ok) {
            if (response.status === 404) {
              return null
            }
            console.error('Failed to fetch menu from backend:', response.statusText)
            return null
          }

          const menu: Menu = await response.json()
          return menu
        } catch (error) {
          console.error('Error fetching menu from backend:', error)
          return null
        }
      },

      loadMenu: async (id: string) => {
        const { menus, setMenus } = get()

        // Check if menu exists in local store
        const existingMenu = menus.find((m) => m.id === id)
        if (existingMenu) {
          return existingMenu
        }

        // Fetch from backend if not found locally
        const menu = await get().fetchMenuFromBackend(id)
        if (menu) {
          setMenus([...menus, menu])
          return menu
        }

        return null
      },

      addMenu: async (menu, sync = true) => {
        set((state) => ({
          menus: [...state.menus, menu],
          currentMenu: menu,
        }))

        if (sync) {
          const result = await get().saveMenuToBackend(menu)
          if (result?.id && result.id !== menu.id) {
            // Update menu ID if backend returns a different one
            set((state) => ({
              menus: state.menus.map((m) =>
                m.id === menu.id ? { ...m, id: result.id } : m
              ),
              currentMenu:
                state.currentMenu?.id === menu.id
                  ? { ...state.currentMenu, id: result.id }
                  : state.currentMenu,
            }))
            return result.id
          }
        }

        return menu.id
      },

      updateMenu: async (id, updates, sync = true) => {
        set((state) => ({
          menus: state.menus.map((m) => (m.id === id ? { ...m, ...updates } : m)),
          currentMenu:
            state.currentMenu?.id === id
              ? { ...state.currentMenu, ...updates }
              : state.currentMenu,
        }))

        if (sync) {
          const menu = get().menus.find((m) => m.id === id)
          if (menu) {
            await get().saveMenuToBackend({ ...menu, ...updates })
          }
        }
      },

      deleteMenu: (id) =>
        set((state) => ({
          menus: state.menus.filter((m) => m.id !== id),
          currentMenu: state.currentMenu?.id === id ? null : state.currentMenu,
        })),

      setCurrentMenu: (menu) => set({ currentMenu: menu }),

      setOcrProgress: (ocrProgress) => set({ ocrProgress }),

      setParsedData: (parsedData) => set({ parsedData }),

      addCategory: (menuId, category) =>
        set((state) => {
          const menu = state.menus.find((m) => m.id === menuId)
          if (!menu) return state

          const newCategory: MenuCategory = { ...category, items: [] }
          const updatedMenu = {
            ...menu,
            categories: [...menu.categories, newCategory],
            updatedAt: new Date().toISOString(),
          }

          // Sync to backend
          get().saveMenuToBackend(updatedMenu)

          return {
            menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
            currentMenu:
              state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
          }
        }),

      updateCategory: (menuId, categoryId, updates) =>
        set((state) => {
          const menu = state.menus.find((m) => m.id === menuId)
          if (!menu) return state

          const updatedMenu = {
            ...menu,
            categories: menu.categories.map((c) =>
              c.id === categoryId ? { ...c, ...updates } : c
            ),
            updatedAt: new Date().toISOString(),
          }

          // Sync to backend
          get().saveMenuToBackend(updatedMenu)

          return {
            menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
            currentMenu:
              state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
          }
        }),

      deleteCategory: (menuId, categoryId) =>
        set((state) => {
          const menu = state.menus.find((m) => m.id === menuId)
          if (!menu) return state

          const updatedMenu = {
            ...menu,
            categories: menu.categories.filter((c) => c.id !== categoryId),
            updatedAt: new Date().toISOString(),
          }

          // Sync to backend
          get().saveMenuToBackend(updatedMenu)

          return {
            menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
            currentMenu:
              state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
          }
        }),

      reorderCategories: (menuId, categoryIds) =>
        set((state) => {
          const menu = state.menus.find((m) => m.id === menuId)
          if (!menu) return state

          const categoryMap = new Map(menu.categories.map((c) => [c.id, c]))
          const reorderedCategories = categoryIds
            .map((id) => categoryMap.get(id))
            .filter(Boolean) as MenuCategory[]

          const updatedMenu = {
            ...menu,
            categories: reorderedCategories.map((c, i) => ({ ...c, order: i })),
            updatedAt: new Date().toISOString(),
          }

          // Sync to backend
          get().saveMenuToBackend(updatedMenu)

          return {
            menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
            currentMenu:
              state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
          }
        }),

      addItem: (menuId, categoryId, item) =>
        set((state) => {
          const menu = state.menus.find((m) => m.id === menuId)
          if (!menu) return state

          const newItem: MenuItem = { ...item, categoryId }
          const updatedMenu = {
            ...menu,
            categories: menu.categories.map((c) =>
              c.id === categoryId ? { ...c, items: [...c.items, newItem] } : c
            ),
            updatedAt: new Date().toISOString(),
          }

          // Sync to backend
          get().saveMenuToBackend(updatedMenu)

          return {
            menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
            currentMenu:
              state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
          }
        }),

      updateItem: (menuId, itemId, updates) =>
        set((state) => {
          const menu = state.menus.find((m) => m.id === menuId)
          if (!menu) return state

          const updatedMenu = {
            ...menu,
            categories: menu.categories.map((c) => ({
              ...c,
              items: c.items.map((i) =>
                i.id === itemId ? { ...i, ...updates } : i
              ),
            })),
            updatedAt: new Date().toISOString(),
          }

          // Sync to backend
          get().saveMenuToBackend(updatedMenu)

          return {
            menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
            currentMenu:
              state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
          }
        }),

      deleteItem: (menuId, itemId) =>
        set((state) => {
          const menu = state.menus.find((m) => m.id === menuId)
          if (!menu) return state

          const updatedMenu = {
            ...menu,
            categories: menu.categories.map((c) => ({
              ...c,
              items: c.items.filter((i) => i.id !== itemId),
            })),
            updatedAt: new Date().toISOString(),
          }

          // Sync to backend
          get().saveMenuToBackend(updatedMenu)

          return {
            menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
            currentMenu:
              state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
          }
        }),

      moveItem: (menuId, itemId, targetCategoryId) =>
        set((state) => {
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
              ? {
                  ...c,
                  items: [
                    ...c.items,
                    { ...itemToMove!, categoryId: targetCategoryId },
                  ],
                }
              : c
          )

          const updatedMenu = {
            ...menu,
            categories: updatedCategories,
            updatedAt: new Date().toISOString(),
          }

          // Sync to backend
          get().saveMenuToBackend(updatedMenu)

          return {
            menus: state.menus.map((m) => (m.id === menuId ? updatedMenu : m)),
            currentMenu:
              state.currentMenu?.id === menuId ? updatedMenu : state.currentMenu,
          }
        }),
    }),
    {
      name: 'menu-ocr-storage',
      partialize: (state) => ({ menus: state.menus }),
    }
  )
)
