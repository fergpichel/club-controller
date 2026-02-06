<template>
  <div class="icon-picker">
    <!-- Trigger button -->
    <button
      type="button"
      class="icon-picker-trigger"
      :class="{ open: showPicker }"
      @click="showPicker = !showPicker"
    >
      <span class="selected-icon-preview" :style="previewStyle">
        <q-icon :name="modelValue || 'category'" size="22px" />
      </span>
      <span class="trigger-label">{{ modelValue || 'Elegir icono' }}</span>
      <q-icon name="expand_more" size="18px" class="trigger-arrow" :class="{ rotated: showPicker }" />
    </button>

    <!-- Picker popup -->
    <Teleport to="body">
      <Transition name="picker-fade">
        <div v-if="showPicker" class="icon-picker-overlay" @click.self="showPicker = false">
          <div ref="pickerPanel" class="icon-picker-panel" :style="panelPosition">
            <!-- Search -->
            <div class="picker-search">
              <q-icon name="search" size="18px" class="search-icon" />
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Buscar icono..."
                class="search-input"
                @keydown.escape="showPicker = false"
              />
              <button v-if="searchQuery" type="button" class="search-clear" @click="searchQuery = ''">
                <q-icon name="close" size="14px" />
              </button>
            </div>

            <!-- Category tabs -->
            <div v-if="!searchQuery" class="picker-tabs">
              <button
                v-for="cat in iconCategories"
                :key="cat.id"
                type="button"
                :class="['tab-btn', { active: activeCategory === cat.id }]"
                @click="activeCategory = cat.id"
              >
                <q-icon :name="cat.icon" size="16px" />
                <span>{{ cat.label }}</span>
              </button>
            </div>

            <!-- Icons grid -->
            <div class="picker-grid-wrapper">
              <div v-if="searchQuery && filteredIcons.length === 0" class="no-results">
                <q-icon name="search_off" size="32px" />
                <span>Sin resultados para "{{ searchQuery }}"</span>
              </div>
              <div v-else class="picker-grid">
                <button
                  v-for="icon in displayedIcons"
                  :key="icon.name"
                  type="button"
                  :class="['icon-btn', { selected: icon.name === modelValue }]"
                  :title="icon.label"
                  @click="selectIcon(icon.name)"
                >
                  <q-icon :name="icon.name" size="22px" />
                  <span class="icon-label">{{ icon.label }}</span>
                </button>
              </div>
            </div>

            <!-- Manual input fallback -->
            <div class="picker-footer">
              <input
                v-model="manualInput"
                type="text"
                placeholder="O escribe el nombre del icono..."
                class="manual-input"
                @keydown.enter="applyManual"
              />
              <button v-if="manualInput" type="button" class="manual-apply" @click="applyManual">
                <q-icon name="check" size="16px" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

interface IconEntry {
  name: string
  label: string
  keywords: string[]
  category: string
}

interface IconCategory {
  id: string
  label: string
  icon: string
}

const props = defineProps<{
  modelValue: string
  color?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showPicker = ref(false)
const searchQuery = ref('')
const manualInput = ref('')
const activeCategory = ref('finance')
const searchInput = ref<HTMLInputElement>()
const pickerPanel = ref<HTMLElement>()

const previewStyle = computed(() => {
  if (props.color) {
    return {
      backgroundColor: props.color + '20',
      color: props.color
    }
  }
  return {}
})

// Focus search when opened
watch(showPicker, async (val) => {
  if (val) {
    await nextTick()
    searchInput.value?.focus()
  } else {
    searchQuery.value = ''
    manualInput.value = ''
  }
})

// Position the panel near the trigger
const panelPosition = computed(() => {
  // We use fixed positioning via overlay, centered on screen for simplicity
  return {}
})

// Close on escape
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') showPicker.value = false
}
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', onKeydown)
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}

const iconCategories: IconCategory[] = [
  { id: 'finance', label: 'Finanzas', icon: 'payments' },
  { id: 'sports', label: 'Deportes', icon: 'sports_soccer' },
  { id: 'people', label: 'Personas', icon: 'group' },
  { id: 'transport', label: 'Transporte', icon: 'directions_bus' },
  { id: 'building', label: 'Edificios', icon: 'business' },
  { id: 'health', label: 'Salud', icon: 'medical_services' },
  { id: 'food', label: 'Comida', icon: 'restaurant' },
  { id: 'media', label: 'Media', icon: 'campaign' },
  { id: 'general', label: 'General', icon: 'category' }
]

// Curated icon list for sports club financial management
const allIcons: IconEntry[] = [
  // FINANCE
  { name: 'payments', label: 'Pagos', keywords: ['pago', 'dinero', 'money', 'payment'], category: 'finance' },
  { name: 'attach_money', label: 'Dinero', keywords: ['dinero', 'money', 'dollar'], category: 'finance' },
  { name: 'euro', label: 'Euro', keywords: ['euro', 'moneda', 'currency'], category: 'finance' },
  { name: 'account_balance', label: 'Banco', keywords: ['banco', 'bank', 'cuenta'], category: 'finance' },
  { name: 'account_balance_wallet', label: 'Cartera', keywords: ['cartera', 'wallet'], category: 'finance' },
  { name: 'credit_card', label: 'Tarjeta', keywords: ['tarjeta', 'card', 'credit'], category: 'finance' },
  { name: 'receipt', label: 'Recibo', keywords: ['recibo', 'receipt', 'ticket'], category: 'finance' },
  { name: 'receipt_long', label: 'Factura', keywords: ['factura', 'receipt', 'invoice'], category: 'finance' },
  { name: 'savings', label: 'Ahorros', keywords: ['ahorros', 'savings', 'hucha'], category: 'finance' },
  { name: 'trending_up', label: 'Subida', keywords: ['subida', 'ingreso', 'up', 'trending'], category: 'finance' },
  { name: 'trending_down', label: 'Bajada', keywords: ['bajada', 'gasto', 'down'], category: 'finance' },
  { name: 'price_check', label: 'Verificado', keywords: ['verificado', 'check', 'precio'], category: 'finance' },
  { name: 'monetization_on', label: 'Monetización', keywords: ['monetizacion', 'dinero'], category: 'finance' },
  { name: 'local_atm', label: 'Cajero', keywords: ['cajero', 'atm', 'cash'], category: 'finance' },
  { name: 'point_of_sale', label: 'TPV', keywords: ['tpv', 'terminal', 'venta'], category: 'finance' },
  { name: 'request_quote', label: 'Presupuesto', keywords: ['presupuesto', 'quote', 'budget'], category: 'finance' },
  { name: 'card_membership', label: 'Membresía', keywords: ['membresia', 'licencia', 'card'], category: 'finance' },
  { name: 'toll', label: 'Peaje', keywords: ['peaje', 'toll'], category: 'finance' },
  { name: 'how_to_reg', label: 'Inscripción', keywords: ['inscripcion', 'registro', 'registration'], category: 'finance' },
  { name: 'confirmation_number', label: 'Número', keywords: ['numero', 'confirmation', 'rifa'], category: 'finance' },
  { name: 'handshake', label: 'Acuerdo', keywords: ['acuerdo', 'patrocinio', 'handshake', 'sponsor'], category: 'finance' },
  { name: 'volunteer_activism', label: 'Donación', keywords: ['donacion', 'volunteer', 'donation'], category: 'finance' },
  { name: 'local_activity', label: 'Actividad', keywords: ['actividad', 'entrada', 'ticket'], category: 'finance' },

  // SPORTS
  { name: 'sports_soccer', label: 'Fútbol', keywords: ['futbol', 'soccer', 'ball'], category: 'sports' },
  { name: 'sports_handball', label: 'Balonmano', keywords: ['balonmano', 'handball'], category: 'sports' },
  { name: 'sports_basketball', label: 'Baloncesto', keywords: ['baloncesto', 'basketball'], category: 'sports' },
  { name: 'sports_volleyball', label: 'Voleibol', keywords: ['voleibol', 'volleyball'], category: 'sports' },
  { name: 'sports_tennis', label: 'Tenis', keywords: ['tenis', 'tennis'], category: 'sports' },
  { name: 'sports', label: 'Deportes', keywords: ['deporte', 'sports', 'arbitro'], category: 'sports' },
  { name: 'sports_kabaddi', label: 'Contacto', keywords: ['contacto', 'lucha'], category: 'sports' },
  { name: 'sports_martial_arts', label: 'Artes marciales', keywords: ['artes', 'marciales', 'martial'], category: 'sports' },
  { name: 'fitness_center', label: 'Gimnasio', keywords: ['gimnasio', 'gym', 'fitness'], category: 'sports' },
  { name: 'pool', label: 'Piscina', keywords: ['piscina', 'pool', 'natacion'], category: 'sports' },
  { name: 'emoji_events', label: 'Trofeo', keywords: ['trofeo', 'trophy', 'torneo', 'evento'], category: 'sports' },
  { name: 'military_tech', label: 'Medalla', keywords: ['medalla', 'medal', 'premio'], category: 'sports' },
  { name: 'timer', label: 'Cronómetro', keywords: ['cronometro', 'timer', 'tiempo'], category: 'sports' },
  { name: 'scoreboard', label: 'Marcador', keywords: ['marcador', 'scoreboard'], category: 'sports' },
  { name: 'stadium', label: 'Estadio', keywords: ['estadio', 'stadium', 'campo'], category: 'sports' },
  { name: 'hiking', label: 'Excursión', keywords: ['excursion', 'hiking', 'campus'], category: 'sports' },
  { name: 'wb_sunny', label: 'Verano', keywords: ['verano', 'sol', 'sunny', 'campus'], category: 'sports' },
  { name: 'ac_unit', label: 'Invierno', keywords: ['invierno', 'frio', 'navidad'], category: 'sports' },

  // PEOPLE
  { name: 'person', label: 'Persona', keywords: ['persona', 'person', 'usuario'], category: 'people' },
  { name: 'people', label: 'Personal', keywords: ['personal', 'people', 'equipo'], category: 'people' },
  { name: 'group', label: 'Grupo', keywords: ['grupo', 'group', 'cuotas'], category: 'people' },
  { name: 'groups', label: 'Grupos', keywords: ['grupos', 'groups', 'equipos'], category: 'people' },
  { name: 'school', label: 'Escuela', keywords: ['escuela', 'school', 'formacion'], category: 'people' },
  { name: 'badge', label: 'Credencial', keywords: ['credencial', 'badge', 'delegado'], category: 'people' },
  { name: 'supervisor_account', label: 'Supervisor', keywords: ['supervisor', 'entrenador'], category: 'people' },
  { name: 'engineering', label: 'Técnico', keywords: ['tecnico', 'engineering'], category: 'people' },
  { name: 'child_care', label: 'Niños', keywords: ['niños', 'children', 'infantil'], category: 'people' },
  { name: 'family_restroom', label: 'Familias', keywords: ['familias', 'family'], category: 'people' },
  { name: 'diversity_3', label: 'Diversidad', keywords: ['diversidad', 'diversity'], category: 'people' },
  { name: 'wc', label: 'Género', keywords: ['genero', 'gender', 'wc'], category: 'people' },

  // TRANSPORT
  { name: 'directions_bus', label: 'Autobús', keywords: ['autobus', 'bus', 'transporte'], category: 'transport' },
  { name: 'directions_car', label: 'Coche', keywords: ['coche', 'car', 'vehiculo'], category: 'transport' },
  { name: 'local_gas_station', label: 'Gasolina', keywords: ['gasolina', 'gas', 'combustible'], category: 'transport' },
  { name: 'local_shipping', label: 'Envío', keywords: ['envio', 'shipping', 'proveedor'], category: 'transport' },
  { name: 'flight', label: 'Vuelo', keywords: ['vuelo', 'avion', 'flight'], category: 'transport' },
  { name: 'hotel', label: 'Hotel', keywords: ['hotel', 'alojamiento', 'viaje'], category: 'transport' },
  { name: 'map', label: 'Mapa', keywords: ['mapa', 'map', 'ruta'], category: 'transport' },
  { name: 'place', label: 'Ubicación', keywords: ['ubicacion', 'place', 'lugar'], category: 'transport' },

  // BUILDINGS
  { name: 'business', label: 'Edificio', keywords: ['edificio', 'building', 'oficina', 'instalacion'], category: 'building' },
  { name: 'location_city', label: 'Ciudad', keywords: ['ciudad', 'city', 'concello', 'ayuntamiento'], category: 'building' },
  { name: 'domain', label: 'Institución', keywords: ['institucion', 'domain', 'diputacion'], category: 'building' },
  { name: 'home', label: 'Casa', keywords: ['casa', 'home'], category: 'building' },
  { name: 'apartment', label: 'Apartamento', keywords: ['apartamento', 'apartment'], category: 'building' },
  { name: 'storefront', label: 'Tienda', keywords: ['tienda', 'store', 'merchandising'], category: 'building' },
  { name: 'store', label: 'Almacén', keywords: ['almacen', 'store'], category: 'building' },
  { name: 'warehouse', label: 'Nave', keywords: ['nave', 'warehouse'], category: 'building' },
  { name: 'event_seat', label: 'Grada', keywords: ['grada', 'seat', 'asiento'], category: 'building' },

  // HEALTH
  { name: 'medical_services', label: 'Médico', keywords: ['medico', 'medical', 'sanitario'], category: 'health' },
  { name: 'healing', label: 'Fisioterapia', keywords: ['fisioterapia', 'healing', 'recuperacion'], category: 'health' },
  { name: 'local_pharmacy', label: 'Farmacia', keywords: ['farmacia', 'pharmacy', 'botiquin'], category: 'health' },
  { name: 'health_and_safety', label: 'Seguro', keywords: ['seguro', 'safety', 'health'], category: 'health' },
  { name: 'spa', label: 'Spa', keywords: ['spa', 'crema', 'gel'], category: 'health' },
  { name: 'security', label: 'Seguridad', keywords: ['seguridad', 'security', 'social'], category: 'health' },
  { name: 'shield', label: 'Escudo', keywords: ['escudo', 'shield', 'proteccion'], category: 'health' },

  // FOOD & DRINK
  { name: 'restaurant', label: 'Restaurante', keywords: ['restaurante', 'restaurant', 'comida', 'dietas'], category: 'food' },
  { name: 'fastfood', label: 'Comida rápida', keywords: ['comida', 'rapida', 'fast'], category: 'food' },
  { name: 'local_cafe', label: 'Cafetería', keywords: ['cafeteria', 'cafe', 'cantina'], category: 'food' },
  { name: 'local_drink', label: 'Bebidas', keywords: ['bebidas', 'drink'], category: 'food' },
  { name: 'local_bar', label: 'Bar', keywords: ['bar', 'local'], category: 'food' },
  { name: 'kitchen', label: 'Cocina', keywords: ['cocina', 'kitchen', 'material'], category: 'food' },
  { name: 'lunch_dining', label: 'Almuerzo', keywords: ['almuerzo', 'lunch', 'dining'], category: 'food' },
  { name: 'water_drop', label: 'Agua', keywords: ['agua', 'water', 'resina'], category: 'food' },

  // MEDIA & COMMUNICATION
  { name: 'campaign', label: 'Campaña', keywords: ['campaña', 'campaign', 'marketing'], category: 'media' },
  { name: 'share', label: 'Compartir', keywords: ['compartir', 'share', 'redes'], category: 'media' },
  { name: 'camera_alt', label: 'Cámara', keywords: ['camara', 'camera', 'foto', 'video'], category: 'media' },
  { name: 'print', label: 'Imprimir', keywords: ['imprimir', 'print', 'carteleria'], category: 'media' },
  { name: 'language', label: 'Web', keywords: ['web', 'language', 'internet'], category: 'media' },
  { name: 'computer', label: 'Software', keywords: ['software', 'computer', 'gestion'], category: 'media' },
  { name: 'phone', label: 'Teléfono', keywords: ['telefono', 'phone'], category: 'media' },
  { name: 'email', label: 'Email', keywords: ['email', 'correo'], category: 'media' },
  { name: 'notifications', label: 'Notificación', keywords: ['notificacion', 'notification', 'alerta'], category: 'media' },
  { name: 'chat', label: 'Chat', keywords: ['chat', 'mensaje'], category: 'media' },

  // GENERAL
  { name: 'category', label: 'Categoría', keywords: ['categoria', 'category'], category: 'general' },
  { name: 'label', label: 'Etiqueta', keywords: ['etiqueta', 'label', 'tag'], category: 'general' },
  { name: 'star', label: 'Estrella', keywords: ['estrella', 'star', 'favorito'], category: 'general' },
  { name: 'favorite', label: 'Favorito', keywords: ['favorito', 'favorite', 'corazon'], category: 'general' },
  { name: 'flag', label: 'Bandera', keywords: ['bandera', 'flag'], category: 'general' },
  { name: 'bolt', label: 'Rayo', keywords: ['rayo', 'bolt', 'electricidad'], category: 'general' },
  { name: 'lightbulb', label: 'Bombilla', keywords: ['bombilla', 'lightbulb', 'idea'], category: 'general' },
  { name: 'build', label: 'Herramienta', keywords: ['herramienta', 'build', 'mantenimiento'], category: 'general' },
  { name: 'cleaning_services', label: 'Limpieza', keywords: ['limpieza', 'cleaning'], category: 'general' },
  { name: 'checkroom', label: 'Vestuario', keywords: ['vestuario', 'checkroom', 'ropa', 'equipacion'], category: 'general' },
  { name: 'dry_cleaning', label: 'Ropa', keywords: ['ropa', 'dry', 'cleaning', 'chandal'], category: 'general' },
  { name: 'shopping_bag', label: 'Bolsa', keywords: ['bolsa', 'shopping', 'compra'], category: 'general' },
  { name: 'work', label: 'Maletín', keywords: ['maletin', 'work', 'trabajo', 'bolsa'], category: 'general' },
  { name: 'gavel', label: 'Martillo', keywords: ['martillo', 'gavel', 'multa', 'sancion'], category: 'general' },
  { name: 'edit', label: 'Editar', keywords: ['editar', 'edit', 'material', 'oficina'], category: 'general' },
  { name: 'description', label: 'Documento', keywords: ['documento', 'description', 'administracion'], category: 'general' },
  { name: 'inventory', label: 'Inventario', keywords: ['inventario', 'inventory'], category: 'general' },
  { name: 'grid_on', label: 'Rejilla', keywords: ['rejilla', 'grid', 'red'], category: 'general' },
  { name: 'event', label: 'Evento', keywords: ['evento', 'event', 'calendario'], category: 'general' },
  { name: 'calendar_month', label: 'Calendario', keywords: ['calendario', 'calendar', 'mes'], category: 'general' },
  { name: 'schedule', label: 'Horario', keywords: ['horario', 'schedule', 'reloj'], category: 'general' },
  { name: 'history', label: 'Historial', keywords: ['historial', 'history', 'atrasado'], category: 'general' },
  { name: 'app_registration', label: 'Registro', keywords: ['registro', 'registration', 'inscripcion'], category: 'general' },
  { name: 'task_alt', label: 'Completado', keywords: ['completado', 'task', 'done'], category: 'general' },
  { name: 'info', label: 'Info', keywords: ['info', 'informacion'], category: 'general' },
  { name: 'help', label: 'Ayuda', keywords: ['ayuda', 'help'], category: 'general' },
  { name: 'settings', label: 'Ajustes', keywords: ['ajustes', 'settings', 'configuracion'], category: 'general' },
  { name: 'lock', label: 'Candado', keywords: ['candado', 'lock', 'seguro', 'sensible'], category: 'general' },
  { name: 'more_horiz', label: 'Más', keywords: ['mas', 'more', 'otros'], category: 'general' }
]

// Search / filter
const filteredIcons = computed(() => {
  if (!searchQuery.value) return []
  const q = searchQuery.value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return allIcons.filter(icon => {
    if (icon.name.includes(q)) return true
    if (icon.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)) return true
    return icon.keywords.some(k => k.includes(q))
  })
})

const displayedIcons = computed(() => {
  if (searchQuery.value) return filteredIcons.value
  return allIcons.filter(i => i.category === activeCategory.value)
})

function selectIcon(name: string) {
  emit('update:modelValue', name)
  showPicker.value = false
}

function applyManual() {
  if (manualInput.value.trim()) {
    selectIcon(manualInput.value.trim())
  }
}
</script>

<style lang="scss" scoped>
.icon-picker {
  position: relative;
}

.icon-picker-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-family: inherit;

  &:hover {
    border-color: var(--color-accent);
    background: var(--color-bg-elevated);
  }

  &.open {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px rgba(99, 91, 255, 0.15);
  }
}

.selected-icon-preview {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-elevated);
  flex-shrink: 0;
}

.trigger-label {
  flex: 1;
  text-align: left;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trigger-arrow {
  color: var(--color-text-muted);
  transition: transform var(--duration-fast) var(--ease-out);

  &.rotated {
    transform: rotate(180deg);
  }
}

// Overlay
.icon-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

// Panel
.icon-picker-panel {
  width: 480px;
  max-width: 95vw;
  max-height: 520px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// Search
.picker-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);

  .search-icon {
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--color-text-primary);
    font-size: 0.9375rem;
    font-family: inherit;
    outline: none;

    &::placeholder {
      color: var(--color-text-muted);
    }
  }

  .search-clear {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: var(--color-bg-elevated);
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: var(--color-border);
      color: var(--color-text-primary);
    }
  }
}

// Tabs
.picker-tabs {
  display: flex;
  gap: 2px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border: none;
    background: transparent;
    color: var(--color-text-tertiary);
    font-size: 0.6875rem;
    font-weight: 600;
    font-family: inherit;
    white-space: nowrap;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);
    text-transform: uppercase;
    letter-spacing: 0.03em;

    &:hover {
      background: var(--color-bg-tertiary);
      color: var(--color-text-secondary);
    }

    &.active {
      background: var(--color-accent);
      color: #fff;
    }
  }
}

// Grid
.picker-grid-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  min-height: 200px;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 4px;
}

.icon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  font-family: inherit;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    border-color: var(--color-border);
  }

  &.selected {
    background: rgba(99, 91, 255, 0.12);
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  .icon-label {
    font-size: 0.5625rem;
    color: var(--color-text-muted);
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    max-width: 100%;
    text-align: center;
    line-height: 1.2;
  }
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: var(--color-text-muted);

  span {
    font-size: 0.8125rem;
  }
}

// Footer / manual input
.picker-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);

  .manual-input {
    flex: 1;
    border: 1px solid var(--color-border);
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    font-size: 0.8125rem;
    font-family: 'JetBrains Mono', monospace;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    outline: none;

    &::placeholder {
      color: var(--color-text-muted);
      font-family: inherit;
    }

    &:focus {
      border-color: var(--color-accent);
    }
  }

  .manual-apply {
    width: 30px;
    height: 30px;
    border-radius: var(--radius-sm);
    border: none;
    background: var(--color-accent);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--duration-fast) var(--ease-out);

    &:hover {
      filter: brightness(1.1);
    }
  }
}

// Transitions
.picker-fade-enter-active {
  transition: opacity 0.2s ease;
}

.picker-fade-leave-active {
  transition: opacity 0.15s ease;
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
}
</style>
