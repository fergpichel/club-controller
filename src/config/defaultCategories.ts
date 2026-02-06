/**
 * Default category templates for sports clubs.
 *
 * This file defines the default hierarchy of income / expense categories
 * that are offered when a club is first created, or when an admin chooses
 * to load the standard template from Settings → Categorías.
 *
 * Structure:
 *  - Each top-level entry is a parent category.
 *  - `children` contains the subcategories that belong to that parent.
 *  - The `type` is inherited by children automatically.
 */

import type { CategoryType } from 'src/types'

export interface CategoryTemplate {
  name: string
  type: CategoryType
  icon: string
  color: string
  isSensitive?: boolean
  children?: SubcategoryTemplate[]
}

export interface SubcategoryTemplate {
  name: string
  icon: string
  color?: string          // Falls back to parent color
  isSensitive?: boolean
}

// ─── EXPENSE CATEGORIES ────────────────────────────────────────────────

export const DEFAULT_EXPENSE_CATEGORIES: CategoryTemplate[] = [
  {
    name: 'Personal',
    type: 'expense',
    icon: 'people',
    color: '#E53935',
    isSensitive: true,
    children: [
      { name: 'Salarios entrenadores', icon: 'payments' },
      { name: 'Salarios administrativos', icon: 'payments' },
      { name: 'Seguridad Social', icon: 'security', color: '#D81B60' },
      { name: 'Fisioterapia', icon: 'healing' },
      { name: 'Delegados', icon: 'badge' }
    ]
  },
  {
    name: 'Equipaciones',
    type: 'expense',
    icon: 'checkroom',
    color: '#8E24AA',
    children: [
      { name: 'Camisetas juego', icon: 'checkroom' },
      { name: 'Pantalones juego', icon: 'checkroom' },
      { name: 'Ropa entrenamiento', icon: 'dry_cleaning' },
      { name: 'Calcetines', icon: 'checkroom' },
      { name: 'Bolsas deportivas', icon: 'work' },
      { name: 'Chandals', icon: 'dry_cleaning' },
      { name: 'Porteros (equipación)', icon: 'sports_handball' }
    ]
  },
  {
    name: 'Material deportivo',
    type: 'expense',
    icon: 'sports_handball',
    color: '#5E35B1',
    children: [
      { name: 'Balones', icon: 'sports_handball' },
      { name: 'Conos y material entreno', icon: 'lightbulb' },
      { name: 'Porterías', icon: 'sports_handball' },
      { name: 'Redes', icon: 'grid_on' },
      { name: 'Petos', icon: 'checkroom' },
      { name: 'Resina', icon: 'water_drop' }
    ]
  },
  {
    name: 'Transporte',
    type: 'expense',
    icon: 'directions_bus',
    color: '#3949AB',
    children: [
      { name: 'Autobús partidos', icon: 'directions_bus' },
      { name: 'Combustible vehículos club', icon: 'local_gas_station' },
      { name: 'Peajes', icon: 'toll' },
      { name: 'Alojamiento desplazamientos', icon: 'hotel', color: '#1E88E5' },
      { name: 'Dietas desplazamientos', icon: 'restaurant', color: '#1E88E5' }
    ]
  },
  {
    name: 'Competición',
    type: 'expense',
    icon: 'sports',
    color: '#039BE5',
    children: [
      { name: 'Arbitrajes', icon: 'sports' },
      { name: 'Licencias federativas', icon: 'card_membership', color: '#00ACC1' },
      { name: 'Inscripción competiciones', icon: 'emoji_events' },
      { name: 'Multas y sanciones', icon: 'gavel' }
    ]
  },
  {
    name: 'Instalaciones',
    type: 'expense',
    icon: 'business',
    color: '#00897B',
    children: [
      { name: 'Alquiler pabellón', icon: 'business' },
      { name: 'Electricidad', icon: 'bolt', color: '#43A047' },
      { name: 'Agua', icon: 'water_drop', color: '#43A047' },
      { name: 'Mantenimiento', icon: 'build', color: '#757575' },
      { name: 'Limpieza', icon: 'cleaning_services' },
      { name: 'Seguros instalaciones', icon: 'health_and_safety', color: '#C0CA33' }
    ]
  },
  {
    name: 'Material sanitario',
    type: 'expense',
    icon: 'medical_services',
    color: '#7CB342',
    children: [
      { name: 'Esparadrapo', icon: 'medical_services' },
      { name: 'Vendas', icon: 'medical_services' },
      { name: 'Hielo/Frío', icon: 'ac_unit' },
      { name: 'Botiquín general', icon: 'local_pharmacy' },
      { name: 'Cremas y geles', icon: 'spa' },
      { name: 'Material fisioterapia', icon: 'healing' }
    ]
  },
  {
    name: 'Marketing y comunicación',
    type: 'expense',
    icon: 'campaign',
    color: '#FDD835',
    children: [
      { name: 'Cartelería', icon: 'print' },
      { name: 'Redes sociales', icon: 'share' },
      { name: 'Fotografía/Video', icon: 'camera_alt' },
      { name: 'Web y hosting', icon: 'language', color: '#FFB300' },
      { name: 'Software gestión', icon: 'computer', color: '#FFB300' }
    ]
  },
  {
    name: 'Cantina',
    type: 'expense',
    icon: 'restaurant',
    color: '#FB8C00',
    children: [
      { name: 'Bebidas', icon: 'local_drink' },
      { name: 'Comida', icon: 'fastfood' },
      { name: 'Material cantina', icon: 'kitchen' }
    ]
  },
  {
    name: 'Administración',
    type: 'expense',
    icon: 'description',
    color: '#6D4C41',
    children: [
      { name: 'Gestoría', icon: 'account_balance' },
      { name: 'Banco y comisiones', icon: 'credit_card' },
      { name: 'Material oficina', icon: 'edit' },
      { name: 'Formación técnicos', icon: 'school', color: '#F4511E' },
      { name: 'Seguro deportivo', icon: 'health_and_safety', color: '#C0CA33' }
    ]
  },
  {
    name: 'Escuelas de verano',
    type: 'expense',
    icon: 'wb_sunny',
    color: '#FF7043',
    children: [
      { name: 'Monitores campus', icon: 'person' },
      { name: 'Material campus', icon: 'category' },
      { name: 'Camisetas campus', icon: 'checkroom' },
      { name: 'Comidas campus', icon: 'restaurant' }
    ]
  },
  {
    name: 'Eventos y torneos',
    type: 'expense',
    icon: 'emoji_events',
    color: '#EC407A',
    children: [
      { name: 'Trofeos y medallas', icon: 'emoji_events' },
      { name: 'Catering eventos', icon: 'restaurant' },
      { name: 'Alquiler material eventos', icon: 'event_seat' }
    ]
  },
  {
    name: 'Otros gastos',
    type: 'expense',
    icon: 'more_horiz',
    color: '#546E7A'
  }
]

// ─── INCOME CATEGORIES ─────────────────────────────────────────────────

export const DEFAULT_INCOME_CATEGORIES: CategoryTemplate[] = [
  {
    name: 'Cuotas',
    type: 'income',
    icon: 'group',
    color: '#00D4AA',
    children: [
      { name: 'Cuotas mensuales', icon: 'payments' },
      { name: 'Inscripciones temporada', icon: 'how_to_reg', color: '#00B894' },
      { name: 'Cuotas atrasadas', icon: 'history' }
    ]
  },
  {
    name: 'Patrocinios',
    type: 'income',
    icon: 'handshake',
    color: '#635BFF',
    children: [
      { name: 'Patrocinio principal', icon: 'star' },
      { name: 'Patrocinio equipos', icon: 'groups' },
      { name: 'Patrocinio eventos', icon: 'event' },
      { name: 'Publicidad camisetas', icon: 'checkroom' }
    ]
  },
  {
    name: 'Subvenciones',
    type: 'income',
    icon: 'account_balance',
    color: '#5352ED',
    children: [
      { name: 'Subvención Concello', icon: 'location_city' },
      { name: 'Subvención Diputación', icon: 'domain' },
      { name: 'Subvención Xunta', icon: 'account_balance' },
      { name: 'Otras subvenciones', icon: 'volunteer_activism' }
    ]
  },
  {
    name: 'Eventos y torneos',
    type: 'income',
    icon: 'emoji_events',
    color: '#2ED573',
    children: [
      { name: 'Inscripciones torneos', icon: 'app_registration' },
      { name: 'Rifas y sorteos', icon: 'confirmation_number' },
      { name: 'Entradas partidos', icon: 'local_activity' }
    ]
  },
  {
    name: 'Merchandising',
    type: 'income',
    icon: 'storefront',
    color: '#1E90FF',
    children: [
      { name: 'Camisetas', icon: 'checkroom' },
      { name: 'Bufandas y gorros', icon: 'dry_cleaning' },
      { name: 'Otros productos', icon: 'shopping_bag' }
    ]
  },
  {
    name: 'Cantina',
    type: 'income',
    icon: 'local_cafe',
    color: '#FF6B6B'
  },
  {
    name: 'Campus y stages',
    type: 'income',
    icon: 'hiking',
    color: '#FFA502',
    children: [
      { name: 'Campus verano', icon: 'wb_sunny' },
      { name: 'Campus Navidad', icon: 'ac_unit' },
      { name: 'Stages técnicos', icon: 'sports_handball' }
    ]
  },
  {
    name: 'Otros ingresos',
    type: 'income',
    icon: 'attach_money',
    color: '#747D8C'
  }
]

// ─── COMBINED ──────────────────────────────────────────────────────────

export const ALL_DEFAULT_CATEGORIES: CategoryTemplate[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES
]

/**
 * Total count of categories (parents + children) in the default template.
 */
export function getDefaultCategoryCount(): { parents: number; subcategories: number; total: number } {
  let parents = 0
  let subcategories = 0
  for (const cat of ALL_DEFAULT_CATEGORIES) {
    parents++
    subcategories += cat.children?.length ?? 0
  }
  return { parents, subcategories, total: parents + subcategories }
}
