export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  order: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
  items: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  description?: string;
  categories: MenuCategory[];
  template: 'minimal' | 'dark' | 'photo-heavy';
  primaryColor?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  isPublished: boolean;
  slug: string;
}

export interface ParsedMenuItem {
  name: string;
  price?: number;
  description?: string;
  category?: string;
}

export interface ParsedMenu {
  name?: string;
  items: ParsedMenuItem[];
  categories?: string[];
}

export interface OCRProgress {
  status: 'idle' | 'loading' | 'recognizing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface GroqResponse {
  parsed: ParsedMenu;
  rawText: string;
}

export interface CreateMenuRequest {
  name: string;
  description?: string;
  categories: Omit<MenuCategory, 'items'>[];
  items: MenuItem[];
  template?: Menu['template'];
  primaryColor?: string;
}

export interface UpdateMenuRequest {
  name?: string;
  description?: string;
  categories?: MenuCategory[];
  template?: Menu['template'];
  primaryColor?: string;
  logoUrl?: string;
}
