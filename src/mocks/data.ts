/**
 * MOCK DATA - Club de Balonmano Xiria
 * Datos realistas para desarrollo y testing
 * ~280 deportistas, 25 equipos, ~500K€ facturación
 * MODELO EQUILIBRADO: Ingresos ≈ Gastos con pequeño superávit (~200€)
 */

import type {
  User,
  Club,
  Category,
  Team,
  Project,
  Event,
  Supplier,
  Sponsor,
  Employee,
  Transaction,
  MonthClosing,
  Budget,
  Forecast
} from 'src/types'

// === TEMPORADA ACTUAL ===
// Temporada 2024-25 comienza en septiembre 2024

// === PRESUPUESTO ANUAL REALISTA ===
// Total ~500.000€ con objetivo de +500€ superávit
export const ANNUAL_BUDGET = {
  targetSurplus: 500, // Objetivo de superávit
  
  // INGRESOS (~500.250€)
  income: {
    cuotas: 117600, // 280 jugadores * 35€/mes * 10 meses + variaciones
    inscripciones: 42000, // 280 * 150€ media
    patrociniosEquipos: 51000, // Patrocinadores de equipos
    subvencionesPublicas: 70000, // Concello + Diputación + Xunta
    escuelasVerano: 14000, // Campus julio
    cantina: 5500, // Ingresos cantina
    eventos: 8000, // Torneos, rifas, etc
    merchandising: 2500, // Camisetas, etc
    otros: 2150
  },
  
  // GASTOS (~499.750€)
  expenses: {
    salarios: 115200, // 11 empleados, media ~870€/mes * 12
    seguridadSocial: 34560, // ~30% de salarios
    equipaciones: 25000, // 25 equipos, ~1000€/equipo
    materialDeportivo: 8500, // Balones, conos, etc
    transporte: 42000, // Desplazamientos partidos
    arbitrajes: 28800, // ~2400€/mes temporada
    federacion: 14000, // Licencias
    alquilerInstalaciones: 18000, // 1500€/mes
    suministros: 3600, // Luz, agua vestuarios
    seguros: 12000, // Seguro deportivo
    marketing: 4500, // Cartelería, redes
    tecnologia: 2400, // Software, web
    cantina: 3800, // Compras cantina
    sanitario: 2400, // Botiquín, fisio
    formacion: 1800, // Cursos entrenadores
    mantenimiento: 3000,
    administrativos: 2200,
    eventosGastos: 6000, // Torneos propios
    escuelasVeranoGastos: 9500,
    otros: 2500
  }
}

// Calcular totales
const totalIncome = Object.values(ANNUAL_BUDGET.income).reduce((a, b) => a + b, 0)
const totalExpenses = Object.values(ANNUAL_BUDGET.expenses).reduce((a, b) => a + b, 0)
console.log(`💰 Presupuesto: Ingresos ${totalIncome}€ - Gastos ${totalExpenses}€ = ${totalIncome - totalExpenses}€`)

// === CLUB ===
export const mockClub: Club = {
  id: 'club_xiria_001',
  name: 'Club Balonmano Xiria',
  logo: '/icons/club-logo.png',
  address: 'Pabellón Municipal, Rúa do Deporte 1, 15870 Xiria, A Coruña',
  phone: '+34 981 123 456',
  email: 'info@balonmanoxiria.com',
  taxId: 'G15123456',
  sport: 'handball',
  createdAt: new Date('2015-09-01'),
  settings: {
    currency: 'EUR',
    fiscalYearStart: 9,
    categories: [],
    defaultTeams: []
  }
}

// === USERS ===
export const mockUsers: User[] = [
  { uid: 'user_001', email: 'admin@balonmanxiria.com', displayName: 'Jessica Posse', role: 'admin', clubId: 'club_xiria_001', createdAt: new Date('2020-01-15'), updatedAt: new Date('2024-01-01') },
  { uid: 'user_002', email: 'director@balonmanxiria.com', displayName: 'María López Fernández', role: 'manager', clubId: 'club_xiria_001', createdAt: new Date('2020-03-10'), updatedAt: new Date('2024-01-01') },
  { uid: 'user_003', email: 'tesorero@balonmanxiria.com', displayName: 'Pedro Martínez Silva', role: 'manager', clubId: 'club_xiria_001', createdAt: new Date('2021-09-01'), updatedAt: new Date('2024-01-01') },
  { uid: 'user_004', email: 'entrenador1@balonmanxiria.com', displayName: 'Luis Sánchez Pérez', role: 'employee', clubId: 'club_xiria_001', createdAt: new Date('2022-09-01'), updatedAt: new Date('2024-01-01') },
  { uid: 'user_005', email: 'entrenador2@balonmanxiria.com', displayName: 'Ana Vázquez Torres', role: 'employee', clubId: 'club_xiria_001', createdAt: new Date('2022-09-01'), updatedAt: new Date('2024-01-01') },
  { uid: 'user_006', email: 'gestoria@asesores.com', displayName: 'Roberto Martínez Puga', role: 'accountant', clubId: 'club_xiria_001', createdAt: new Date('2020-01-15'), updatedAt: new Date('2024-01-01') }
]

// === CATEGORIES ===
export const mockCategories: Category[] = [
  // GASTOS
  { id: 'cat_001', name: 'Salarios', type: 'expense', icon: 'payments', color: '#E53935', isActive: true },
  { id: 'cat_002', name: 'Seguridad Social', type: 'expense', icon: 'security', color: '#D81B60', isActive: true },
  { id: 'cat_003', name: 'Equipaciones', type: 'expense', icon: 'checkroom', color: '#8E24AA', isActive: true },
  { id: 'cat_004', name: 'Material deportivo', type: 'expense', icon: 'sports_handball', color: '#5E35B1', isActive: true },
  { id: 'cat_005', name: 'Transporte', type: 'expense', icon: 'directions_bus', color: '#3949AB', isActive: true },
  { id: 'cat_006', name: 'Viajes y desplazamientos', type: 'expense', icon: 'flight', color: '#1E88E5', isActive: true },
  { id: 'cat_007', name: 'Arbitrajes', type: 'expense', icon: 'sports', color: '#039BE5', isActive: true },
  { id: 'cat_008', name: 'Federación y licencias', type: 'expense', icon: 'card_membership', color: '#00ACC1', isActive: true },
  { id: 'cat_009', name: 'Alquiler instalaciones', type: 'expense', icon: 'business', color: '#00897B', isActive: true },
  { id: 'cat_010', name: 'Suministros', type: 'expense', icon: 'bolt', color: '#43A047', isActive: true },
  { id: 'cat_011', name: 'Material sanitario', type: 'expense', icon: 'medical_services', color: '#7CB342', isActive: true },
  { id: 'cat_012', name: 'Seguros', type: 'expense', icon: 'health_and_safety', color: '#C0CA33', isActive: true },
  { id: 'cat_013', name: 'Marketing y publicidad', type: 'expense', icon: 'campaign', color: '#FDD835', isActive: true },
  { id: 'cat_014', name: 'Tecnología', type: 'expense', icon: 'computer', color: '#FFB300', isActive: true },
  { id: 'cat_015', name: 'Cantina', type: 'expense', icon: 'restaurant', color: '#FB8C00', isActive: true },
  { id: 'cat_016', name: 'Formación', type: 'expense', icon: 'school', color: '#F4511E', isActive: true },
  { id: 'cat_017', name: 'Gastos administrativos', type: 'expense', icon: 'description', color: '#6D4C41', isActive: true },
  { id: 'cat_018', name: 'Mantenimiento', type: 'expense', icon: 'build', color: '#757575', isActive: true },
  { id: 'cat_019', name: 'Otros gastos', type: 'expense', icon: 'more_horiz', color: '#546E7A', isActive: true },
  { id: 'cat_020', name: 'Escuelas de verano (gastos)', type: 'expense', icon: 'wb_sunny', color: '#FF7043', isActive: true },
  { id: 'cat_021', name: 'Eventos y torneos (gastos)', type: 'expense', icon: 'emoji_events', color: '#EC407A', isActive: true },
  // INGRESOS
  { id: 'cat_101', name: 'Cuotas socios', type: 'income', icon: 'group', color: '#00D4AA', isActive: true },
  { id: 'cat_102', name: 'Inscripciones', type: 'income', icon: 'how_to_reg', color: '#00B894', isActive: true },
  { id: 'cat_103', name: 'Patrocinios', type: 'income', icon: 'handshake', color: '#635BFF', isActive: true },
  { id: 'cat_104', name: 'Subvenciones', type: 'income', icon: 'account_balance', color: '#5352ED', isActive: true },
  { id: 'cat_105', name: 'Escuelas deportivas', type: 'income', icon: 'sports', color: '#3742FA', isActive: true },
  { id: 'cat_106', name: 'Eventos y torneos', type: 'income', icon: 'emoji_events', color: '#2ED573', isActive: true },
  { id: 'cat_107', name: 'Venta merchandising', type: 'income', icon: 'storefront', color: '#1E90FF', isActive: true },
  { id: 'cat_108', name: 'Cantina', type: 'income', icon: 'local_cafe', color: '#FF6B6B', isActive: true },
  { id: 'cat_109', name: 'Campus y stages', type: 'income', icon: 'hiking', color: '#FFA502', isActive: true },
  { id: 'cat_110', name: 'Otros ingresos', type: 'income', icon: 'attach_money', color: '#747D8C', isActive: true }
]

// === TEAMS (25 equipos) ===
export const mockTeams: Team[] = [
  // Senior
  { id: 'team_001', clubId: 'club_xiria_001', name: 'Calvo Xiria', sport: 'handball', ageGroup: 'senior', gender: 'male', color: '#E53935', playersCount: 16, isActive: true, createdAt: new Date('2015-09-01') },
  { id: 'team_002', clubId: 'club_xiria_001', name: 'Xiria Feminino', sport: 'handball', ageGroup: 'senior', gender: 'female', color: '#D81B60', playersCount: 14, isActive: true, createdAt: new Date('2018-09-01') },
  // Juvenil
  { id: 'team_003', clubId: 'club_xiria_001', name: 'Garaysa Xiria A', sport: 'handball', ageGroup: 'juvenil', gender: 'male', color: '#8E24AA', playersCount: 14, isActive: true, createdAt: new Date('2020-09-01') },
  { id: 'team_004', clubId: 'club_xiria_001', name: 'Xiria Juvenil Fem', sport: 'handball', ageGroup: 'juvenil', gender: 'female', color: '#5E35B1', playersCount: 12, isActive: true, createdAt: new Date('2021-09-01') },
  // Cadete
  { id: 'team_005', clubId: 'club_xiria_001', name: 'Fontecelta Xiria', sport: 'handball', ageGroup: 'cadete', gender: 'male', color: '#3949AB', playersCount: 14, isActive: true, createdAt: new Date('2020-09-01') },
  { id: 'team_006', clubId: 'club_xiria_001', name: 'Xiria Cadete B', sport: 'handball', ageGroup: 'cadete', gender: 'male', color: '#1E88E5', playersCount: 12, isActive: true, createdAt: new Date('2022-09-01') },
  { id: 'team_007', clubId: 'club_xiria_001', name: 'Xiria Cadete Fem', sport: 'handball', ageGroup: 'cadete', gender: 'female', color: '#039BE5', playersCount: 13, isActive: true, createdAt: new Date('2021-09-01') },
  // Infantil
  { id: 'team_008', clubId: 'club_xiria_001', name: 'Pescanova Xiria', sport: 'handball', ageGroup: 'infantil', gender: 'male', color: '#00ACC1', playersCount: 14, isActive: true, createdAt: new Date('2020-09-01') },
  { id: 'team_009', clubId: 'club_xiria_001', name: 'Xiria Infantil B', sport: 'handball', ageGroup: 'infantil', gender: 'male', color: '#00897B', playersCount: 12, isActive: true, createdAt: new Date('2022-09-01') },
  { id: 'team_010', clubId: 'club_xiria_001', name: 'Xiria Infantil Fem', sport: 'handball', ageGroup: 'infantil', gender: 'female', color: '#43A047', playersCount: 11, isActive: true, createdAt: new Date('2022-09-01') },
  // Alevín
  { id: 'team_011', clubId: 'club_xiria_001', name: 'Estrella Galicia Xiria', sport: 'handball', ageGroup: 'alevin', gender: 'male', color: '#7CB342', playersCount: 14, isActive: true, createdAt: new Date('2021-09-01') },
  { id: 'team_012', clubId: 'club_xiria_001', name: 'Xiria Alevín B', sport: 'handball', ageGroup: 'alevin', gender: 'male', color: '#C0CA33', playersCount: 12, isActive: true, createdAt: new Date('2023-09-01') },
  { id: 'team_013', clubId: 'club_xiria_001', name: 'Xiria Alevín Fem', sport: 'handball', ageGroup: 'alevin', gender: 'female', color: '#FDD835', playersCount: 10, isActive: true, createdAt: new Date('2023-09-01') },
  { id: 'team_014', clubId: 'club_xiria_001', name: 'Xiria Alevín Mixto', sport: 'handball', ageGroup: 'alevin', gender: 'mixed', color: '#FFB300', playersCount: 14, isActive: true, createdAt: new Date('2022-09-01') },
  // Benjamín
  { id: 'team_015', clubId: 'club_xiria_001', name: 'Gadis Xiria', sport: 'handball', ageGroup: 'benjamin', gender: 'male', color: '#FB8C00', playersCount: 12, isActive: true, createdAt: new Date('2022-09-01') },
  { id: 'team_016', clubId: 'club_xiria_001', name: 'Xiria Benjamín B', sport: 'handball', ageGroup: 'benjamin', gender: 'male', color: '#F4511E', playersCount: 12, isActive: true, createdAt: new Date('2023-09-01') },
  { id: 'team_017', clubId: 'club_xiria_001', name: 'Xiria Benjamín Fem', sport: 'handball', ageGroup: 'benjamin', gender: 'female', color: '#6D4C41', playersCount: 10, isActive: true, createdAt: new Date('2023-09-01') },
  { id: 'team_018', clubId: 'club_xiria_001', name: 'Xiria Benjamín Mixto', sport: 'handball', ageGroup: 'benjamin', gender: 'mixed', color: '#8D6E63', playersCount: 14, isActive: true, createdAt: new Date('2022-09-01') },
  // Prebenjamín
  { id: 'team_019', clubId: 'club_xiria_001', name: 'Xiria Prebenja A', sport: 'handball', ageGroup: 'prebenjamin', gender: 'mixed', color: '#78909C', playersCount: 14, isActive: true, createdAt: new Date('2023-09-01') },
  { id: 'team_020', clubId: 'club_xiria_001', name: 'Xiria Prebenja B', sport: 'handball', ageGroup: 'prebenjamin', gender: 'mixed', color: '#90A4AE', playersCount: 12, isActive: true, createdAt: new Date('2023-09-01') },
  { id: 'team_021', clubId: 'club_xiria_001', name: 'Xiria Prebenja C', sport: 'handball', ageGroup: 'prebenjamin', gender: 'mixed', color: '#B0BEC5', playersCount: 12, isActive: true, createdAt: new Date('2024-09-01') },
  // Biberón
  { id: 'team_022', clubId: 'club_xiria_001', name: 'Xiria Biberón A', sport: 'handball', ageGroup: 'biberon', gender: 'mixed', color: '#FF8A80', playersCount: 16, isActive: true, createdAt: new Date('2023-09-01') },
  { id: 'team_023', clubId: 'club_xiria_001', name: 'Xiria Biberón B', sport: 'handball', ageGroup: 'biberon', gender: 'mixed', color: '#FF80AB', playersCount: 14, isActive: true, createdAt: new Date('2024-09-01') },
  { id: 'team_024', clubId: 'club_xiria_001', name: 'Xiria Biberón C', sport: 'handball', ageGroup: 'biberon', gender: 'mixed', color: '#EA80FC', playersCount: 12, isActive: true, createdAt: new Date('2024-09-01') },
  { id: 'team_025', clubId: 'club_xiria_001', name: 'Xiria Biberón D', sport: 'handball', ageGroup: 'biberon', gender: 'mixed', color: '#B388FF', playersCount: 12, isActive: true, createdAt: new Date('2024-09-01') }
]

// === EMPLOYEES (11 empleados) ===
export const mockEmployees: Employee[] = [
  { id: 'emp_001', clubId: 'club_xiria_001', userId: 'user_004', name: 'Luis Sánchez Pérez', email: 'luis@balonmanoxiria.com', phone: '+34 600 111 001', type: 'coach', contractType: 'part_time', monthlySalary: 1200, teamIds: ['team_001', 'team_003'], startDate: new Date('2020-09-01'), isActive: true, createdAt: new Date('2020-09-01'), updatedAt: new Date('2024-01-01') },
  { id: 'emp_002', clubId: 'club_xiria_001', userId: 'user_005', name: 'Ana Vázquez Torres', email: 'ana@balonmanoxiria.com', phone: '+34 600 111 002', type: 'coach', contractType: 'part_time', monthlySalary: 1100, teamIds: ['team_002', 'team_004', 'team_007'], startDate: new Date('2021-09-01'), isActive: true, createdAt: new Date('2021-09-01'), updatedAt: new Date('2024-01-01') },
  { id: 'emp_003', clubId: 'club_xiria_001', name: 'Roberto Iglesias Novo', email: 'roberto@balonmanoxiria.com', phone: '+34 600 111 003', type: 'coach', contractType: 'part_time', monthlySalary: 950, teamIds: ['team_005', 'team_006'], startDate: new Date('2022-09-01'), isActive: true, createdAt: new Date('2022-09-01'), updatedAt: new Date('2024-01-01') },
  { id: 'emp_004', clubId: 'club_xiria_001', name: 'Carmen Rodríguez López', email: 'carmen@balonmanoxiria.com', phone: '+34 600 111 004', type: 'coach', contractType: 'part_time', monthlySalary: 900, teamIds: ['team_008', 'team_009', 'team_010'], startDate: new Date('2022-09-01'), isActive: true, createdAt: new Date('2022-09-01'), updatedAt: new Date('2024-01-01') },
  { id: 'emp_005', clubId: 'club_xiria_001', name: 'Miguel Fernández Castro', email: 'miguel@balonmanoxiria.com', phone: '+34 600 111 005', type: 'coach', contractType: 'part_time', monthlySalary: 850, teamIds: ['team_011', 'team_012', 'team_013', 'team_014'], startDate: new Date('2023-09-01'), isActive: true, createdAt: new Date('2023-09-01'), updatedAt: new Date('2024-01-01') },
  { id: 'emp_006', clubId: 'club_xiria_001', name: 'Lucía Otero Vilas', email: 'lucia@balonmanoxiria.com', phone: '+34 600 111 006', type: 'coach', contractType: 'part_time', monthlySalary: 800, teamIds: ['team_015', 'team_016', 'team_017', 'team_018'], startDate: new Date('2023-09-01'), isActive: true, createdAt: new Date('2023-09-01'), updatedAt: new Date('2024-01-01') },
  { id: 'emp_007', clubId: 'club_xiria_001', name: 'David Pereira Gómez', email: 'david@balonmanoxiria.com', phone: '+34 600 111 007', type: 'coach', contractType: 'part_time', monthlySalary: 750, teamIds: ['team_019', 'team_020', 'team_021'], startDate: new Date('2024-09-01'), isActive: true, createdAt: new Date('2024-09-01'), updatedAt: new Date('2024-09-01') },
  { id: 'emp_008', clubId: 'club_xiria_001', name: 'Sara López Rey', email: 'sara@balonmanoxiria.com', phone: '+34 600 111 008', type: 'coach', contractType: 'part_time', monthlySalary: 700, teamIds: ['team_022', 'team_023', 'team_024', 'team_025'], startDate: new Date('2024-09-01'), isActive: true, createdAt: new Date('2024-09-01'), updatedAt: new Date('2024-09-01') },
  { id: 'emp_009', clubId: 'club_xiria_001', name: 'Pablo Martín Díaz', email: 'pablo@balonmanoxiria.com', phone: '+34 600 111 009', type: 'physio', contractType: 'part_time', monthlySalary: 650, teamIds: ['team_001', 'team_002'], startDate: new Date('2022-09-01'), isActive: true, createdAt: new Date('2022-09-01'), updatedAt: new Date('2024-01-01') },
  { id: 'emp_010', clubId: 'club_xiria_001', name: 'Elena Varela Souto', email: 'elena@balonmanoxiria.com', phone: '+34 600 111 010', type: 'admin', contractType: 'part_time', monthlySalary: 700, startDate: new Date('2021-09-01'), isActive: true, createdAt: new Date('2021-09-01'), updatedAt: new Date('2024-01-01') },
  { id: 'emp_011', clubId: 'club_xiria_001', name: 'Jorge Blanco Rivas', email: 'jorge@balonmanoxiria.com', phone: '+34 600 111 011', type: 'delegate', contractType: 'volunteer', teamIds: ['team_001'], startDate: new Date('2020-09-01'), isActive: true, createdAt: new Date('2020-09-01'), updatedAt: new Date('2024-01-01') }
]

// Total salarios: 1200+1100+950+900+850+800+750+700+650+700+0 = 9600€/mes = 115.200€/año ✓

// === SUPPLIERS ===
export const mockSuppliers: Supplier[] = [
  { id: 'sup_001', clubId: 'club_xiria_001', name: 'Kempa España', taxId: 'B12345678', email: 'pedidos@kempa.es', phone: '+34 900 123 001', category: 'Equipaciones', isActive: true, createdAt: new Date('2020-01-01'), updatedAt: new Date('2024-01-01') },
  { id: 'sup_002', clubId: 'club_xiria_001', name: 'Select Sport', taxId: 'B23456789', email: 'ventas@select.es', phone: '+34 900 123 002', category: 'Balones', isActive: true, createdAt: new Date('2020-01-01'), updatedAt: new Date('2024-01-01') },
  { id: 'sup_003', clubId: 'club_xiria_001', name: 'Autocares Vázquez', taxId: 'B34567890', email: 'reservas@autovazquez.com', phone: '+34 981 234 567', category: 'Transporte', isActive: true, createdAt: new Date('2020-01-01'), updatedAt: new Date('2024-01-01') },
  { id: 'sup_004', clubId: 'club_xiria_001', name: 'Hotel Congreso', taxId: 'B45678901', email: 'grupos@hotelcongreso.com', phone: '+34 981 345 678', category: 'Alojamiento', isActive: true, createdAt: new Date('2021-01-01'), updatedAt: new Date('2024-01-01') },
  { id: 'sup_005', clubId: 'club_xiria_001', name: 'Farmacia Central', taxId: 'A56789012', email: 'pedidos@farmaciacentral.es', phone: '+34 981 456 789', category: 'Sanitario', isActive: true, createdAt: new Date('2020-01-01'), updatedAt: new Date('2024-01-01') },
  { id: 'sup_006', clubId: 'club_xiria_001', name: 'Imprenta Galicia', taxId: 'B67890123', email: 'info@imprentagalicia.com', phone: '+34 981 567 890', category: 'Marketing', isActive: true, createdAt: new Date('2021-01-01'), updatedAt: new Date('2024-01-01') },
  { id: 'sup_007', clubId: 'club_xiria_001', name: 'Distribuciones Bebidas Gallegas', taxId: 'B78901234', email: 'pedidos@dbgallegas.com', phone: '+34 981 678 901', category: 'Cantina', isActive: true, createdAt: new Date('2020-01-01'), updatedAt: new Date('2024-01-01') },
  { id: 'sup_008', clubId: 'club_xiria_001', name: 'Seguros Mapfre', taxId: 'A89012345', email: 'deportes@mapfre.es', phone: '+34 900 100 100', category: 'Seguros', isActive: true, createdAt: new Date('2020-01-01'), updatedAt: new Date('2024-01-01') },
  { id: 'sup_009', clubId: 'club_xiria_001', name: 'Federación Gallega Balonmano', taxId: 'G90123456', email: 'federacion@fgbm.es', phone: '+34 981 789 012', category: 'Federación', isActive: true, createdAt: new Date('2015-09-01'), updatedAt: new Date('2024-01-01') },
  { id: 'sup_010', clubId: 'club_xiria_001', name: 'Tech Solutions Galicia', taxId: 'B01234567', email: 'info@techgalicia.com', phone: '+34 981 890 123', category: 'Tecnología', isActive: true, createdAt: new Date('2022-01-01'), updatedAt: new Date('2024-01-01') }
]

// === SPONSORS ===
export const mockSponsors: Sponsor[] = [
  { id: 'spo_001', clubId: 'club_xiria_001', name: 'Calvo Conservas', type: 'main', contactPerson: 'Antonio Calvo', email: 'patrocinios@calvo.es', annualAmount: 12000, teamIds: ['team_001'], isActive: true, contractStart: new Date('2024-07-01'), contractEnd: new Date('2025-06-30'), createdAt: new Date('2023-07-01'), updatedAt: new Date('2024-01-01') },
  { id: 'spo_002', clubId: 'club_xiria_001', name: 'Garaysa Automóviles', type: 'team', contactPerson: 'Manuel García', email: 'marketing@garaysa.es', annualAmount: 6000, teamIds: ['team_003'], isActive: true, contractStart: new Date('2024-07-01'), contractEnd: new Date('2025-06-30'), createdAt: new Date('2024-07-01'), updatedAt: new Date('2024-07-01') },
  { id: 'spo_003', clubId: 'club_xiria_001', name: 'Fontecelta', type: 'team', contactPerson: 'Laura Fonte', email: 'comunicacion@fontecelta.es', annualAmount: 5000, teamIds: ['team_005'], isActive: true, contractStart: new Date('2024-07-01'), contractEnd: new Date('2025-06-30'), createdAt: new Date('2024-07-01'), updatedAt: new Date('2024-07-01') },
  { id: 'spo_004', clubId: 'club_xiria_001', name: 'Pescanova', type: 'team', contactPerson: 'Rosa Pérez', email: 'rsc@pescanova.es', annualAmount: 5000, teamIds: ['team_008'], isActive: true, contractStart: new Date('2024-07-01'), contractEnd: new Date('2025-06-30'), createdAt: new Date('2024-07-01'), updatedAt: new Date('2024-07-01') },
  { id: 'spo_005', clubId: 'club_xiria_001', name: 'Estrella Galicia', type: 'team', contactPerson: 'Carlos Estrella', email: 'patrocinios@estrellagalicia.es', annualAmount: 4000, teamIds: ['team_011'], isActive: true, contractStart: new Date('2024-07-01'), contractEnd: new Date('2025-06-30'), createdAt: new Date('2024-07-01'), updatedAt: new Date('2024-07-01') },
  { id: 'spo_006', clubId: 'club_xiria_001', name: 'Gadis Supermercados', type: 'team', contactPerson: 'Pedro Gadis', email: 'rsc@gadis.es', annualAmount: 3000, teamIds: ['team_015'], isActive: true, contractStart: new Date('2024-07-01'), contractEnd: new Date('2025-06-30'), createdAt: new Date('2024-07-01'), updatedAt: new Date('2024-07-01') },
  { id: 'spo_007', clubId: 'club_xiria_001', name: 'Concello de Xiria', type: 'official', contactPerson: 'Alcalde', email: 'deportes@xiria.gal', annualAmount: 35000, isActive: true, contractStart: new Date('2024-01-01'), contractEnd: new Date('2024-12-31'), createdAt: new Date('2020-01-01'), updatedAt: new Date('2024-01-01') },
  { id: 'spo_008', clubId: 'club_xiria_001', name: 'Diputación A Coruña', type: 'official', contactPerson: 'Área Deportes', email: 'deportes@dacoruna.gal', annualAmount: 20000, isActive: true, contractStart: new Date('2024-01-01'), contractEnd: new Date('2024-12-31'), createdAt: new Date('2020-01-01'), updatedAt: new Date('2024-01-01') },
  { id: 'spo_009', clubId: 'club_xiria_001', name: 'Xunta de Galicia', type: 'official', contactPerson: 'Secretaría Xeral Deporte', email: 'deporte@xunta.gal', annualAmount: 15000, isActive: true, contractStart: new Date('2024-01-01'), contractEnd: new Date('2024-12-31'), createdAt: new Date('2020-01-01'), updatedAt: new Date('2024-01-01') }
]

// Total patrocinios equipos: 12000+6000+5000+5000+4000+3000 = 35.000€ (parte va en julio, parte en enero)
// Total subvenciones: 35000+20000+15000 = 70.000€

// === PROJECTS ===
export const mockProjects: Project[] = [
  { id: 'proj_001', clubId: 'club_xiria_001', name: 'Escuela de Verano 2025', description: 'Campus de verano para niños de 6 a 14 años', startDate: new Date('2025-07-01'), endDate: new Date('2025-07-31'), budget: 14000, status: 'active', createdAt: new Date('2025-01-15') },
  { id: 'proj_002', clubId: 'club_xiria_001', name: 'Escuela de Verano 2024', description: 'Campus de verano para niños de 6 a 14 años', startDate: new Date('2024-07-01'), endDate: new Date('2024-07-31'), budget: 14000, status: 'completed', createdAt: new Date('2024-01-15') },
  { id: 'proj_003', clubId: 'club_xiria_001', name: 'Tecnificación Senior', description: 'Programa de alto rendimiento', startDate: new Date('2024-09-01'), endDate: new Date('2025-06-30'), budget: 5000, status: 'active', teamIds: ['team_001', 'team_002'], createdAt: new Date('2024-08-01') },
  { id: 'proj_004', clubId: 'club_xiria_001', name: 'Torneo Navidad 2024', description: 'Torneo navideño categorías base', startDate: new Date('2024-12-20'), endDate: new Date('2024-12-23'), budget: 3000, status: 'completed', createdAt: new Date('2024-10-01') },
  { id: 'proj_005', clubId: 'club_xiria_001', name: 'Equipaciones 2024-25', description: 'Renovación equipaciones', startDate: new Date('2024-08-01'), endDate: new Date('2024-09-30'), budget: 25000, status: 'completed', createdAt: new Date('2024-06-01') }
]

// === EVENTS ===
export const mockEvents: Event[] = [
  { id: 'evt_001', clubId: 'club_xiria_001', name: 'Inicio Temporada 2024-25', date: new Date('2024-09-02'), location: 'Pabellón Municipal', status: 'completed', createdAt: new Date('2024-08-15') },
  { id: 'evt_002', clubId: 'club_xiria_001', name: 'Torneo Navidad', date: new Date('2024-12-20'), endDate: new Date('2024-12-23'), location: 'Pabellón Municipal', budget: 3000, projectId: 'proj_004', status: 'completed', createdAt: new Date('2024-10-01') },
  { id: 'evt_003', clubId: 'club_xiria_001', name: 'Final Copa Galicia Senior', date: new Date('2025-02-15'), location: 'A Coruña', teamIds: ['team_001'], status: 'planned', createdAt: new Date('2025-01-10') },
  { id: 'evt_004', clubId: 'club_xiria_001', name: 'Jornada Puertas Abiertas', date: new Date('2025-03-15'), location: 'Pabellón Municipal', status: 'planned', createdAt: new Date('2025-01-15') },
  { id: 'evt_005', clubId: 'club_xiria_001', name: 'Fin de Temporada', date: new Date('2025-06-21'), location: 'Pabellón Municipal', status: 'planned', createdAt: new Date('2025-01-01') },
  { id: 'evt_006', clubId: 'club_xiria_001', name: 'Campus Verano 2025', date: new Date('2025-07-01'), endDate: new Date('2025-07-31'), location: 'Pabellón Municipal', budget: 14000, projectId: 'proj_001', status: 'planned', createdAt: new Date('2025-01-15') }
]

// === PRESUPUESTO POR MES ===
// Distribución mensual realista de ingresos y gastos
interface MonthlyBudget {
  month: number // 1-12
  seasonMonth: number // 1=sept, 10=junio, 11=julio, 12=agosto
  income: Record<string, number>
  expenses: Record<string, number>
}

const MONTHLY_DISTRIBUTION: MonthlyBudget[] = [
  // Septiembre (mes 1 de temporada) - Inscripciones fuertes, inicio gastos
  { month: 9, seasonMonth: 1, 
    income: { cuotas: 9800, inscripciones: 25000, patrocinios: 17500, subvenciones: 0, cantina: 400, eventos: 0, merchandising: 800, otros: 200 },
    expenses: { salarios: 9600, ss: 2880, equipaciones: 15000, material: 3000, transporte: 2500, arbitrajes: 2400, federacion: 14000, alquiler: 1500, suministros: 300, seguros: 6000, marketing: 1500, tecnologia: 200, cantina: 300, sanitario: 400, formacion: 600, mantenimiento: 500, admin: 200, eventosG: 0, escuelasG: 0, otros: 200 }
  },
  // Octubre - Cuotas normales, sigue inscripciones
  { month: 10, seasonMonth: 2,
    income: { cuotas: 11760, inscripciones: 12000, patrocinios: 0, subvenciones: 35000, cantina: 550, eventos: 0, merchandising: 300, otros: 200 },
    expenses: { salarios: 9600, ss: 2880, equipaciones: 8000, material: 1000, transporte: 4000, arbitrajes: 2400, federacion: 0, alquiler: 1500, suministros: 300, seguros: 0, marketing: 500, tecnologia: 200, cantina: 350, sanitario: 200, formacion: 300, mantenimiento: 250, admin: 200, eventosG: 0, escuelasG: 0, otros: 200 }
  },
  // Noviembre
  { month: 11, seasonMonth: 3,
    income: { cuotas: 11760, inscripciones: 3000, patrocinios: 0, subvenciones: 0, cantina: 550, eventos: 0, merchandising: 200, otros: 150 },
    expenses: { salarios: 9600, ss: 2880, equipaciones: 1500, material: 500, transporte: 4500, arbitrajes: 2400, federacion: 0, alquiler: 1500, suministros: 300, seguros: 0, marketing: 300, tecnologia: 200, cantina: 350, sanitario: 200, formacion: 300, mantenimiento: 200, admin: 200, eventosG: 0, escuelasG: 0, otros: 200 }
  },
  // Diciembre - Torneo navidad
  { month: 12, seasonMonth: 4,
    income: { cuotas: 11760, inscripciones: 1000, patrocinios: 0, subvenciones: 0, cantina: 600, eventos: 3000, merchandising: 400, otros: 200 },
    expenses: { salarios: 9600, ss: 2880, equipaciones: 500, material: 500, transporte: 3500, arbitrajes: 2400, federacion: 0, alquiler: 1500, suministros: 300, seguros: 0, marketing: 500, tecnologia: 200, cantina: 400, sanitario: 200, formacion: 0, mantenimiento: 200, admin: 200, eventosG: 3000, escuelasG: 0, otros: 200 }
  },
  // Enero - Subvención diputación, segundo pago patrocinios
  { month: 1, seasonMonth: 5,
    income: { cuotas: 11760, inscripciones: 500, patrocinios: 17500, subvenciones: 20000, cantina: 500, eventos: 0, merchandising: 150, otros: 150 },
    expenses: { salarios: 9600, ss: 2880, equipaciones: 0, material: 500, transporte: 4500, arbitrajes: 2400, federacion: 0, alquiler: 1500, suministros: 300, seguros: 6000, marketing: 300, tecnologia: 200, cantina: 350, sanitario: 200, formacion: 300, mantenimiento: 250, admin: 200, eventosG: 0, escuelasG: 0, otros: 250 }
  },
  // Febrero
  { month: 2, seasonMonth: 6,
    income: { cuotas: 11760, inscripciones: 250, patrocinios: 0, subvenciones: 0, cantina: 500, eventos: 2000, merchandising: 150, otros: 150 },
    expenses: { salarios: 9600, ss: 2880, equipaciones: 0, material: 500, transporte: 4500, arbitrajes: 2400, federacion: 0, alquiler: 1500, suministros: 300, seguros: 0, marketing: 300, tecnologia: 200, cantina: 350, sanitario: 200, formacion: 0, mantenimiento: 200, admin: 200, eventosG: 1500, escuelasG: 0, otros: 200 }
  },
  // Marzo
  { month: 3, seasonMonth: 7,
    income: { cuotas: 11760, inscripciones: 250, patrocinios: 0, subvenciones: 15000, cantina: 500, eventos: 1500, merchandising: 150, otros: 150 },
    expenses: { salarios: 9600, ss: 2880, equipaciones: 0, material: 500, transporte: 4500, arbitrajes: 2400, federacion: 0, alquiler: 1500, suministros: 300, seguros: 0, marketing: 300, tecnologia: 200, cantina: 350, sanitario: 200, formacion: 300, mantenimiento: 200, admin: 200, eventosG: 1000, escuelasG: 0, otros: 200 }
  },
  // Abril
  { month: 4, seasonMonth: 8,
    income: { cuotas: 11760, inscripciones: 0, patrocinios: 0, subvenciones: 0, cantina: 500, eventos: 1000, merchandising: 100, otros: 150 },
    expenses: { salarios: 9600, ss: 2880, equipaciones: 0, material: 500, transporte: 4500, arbitrajes: 2400, federacion: 0, alquiler: 1500, suministros: 300, seguros: 0, marketing: 300, tecnologia: 200, cantina: 350, sanitario: 200, formacion: 0, mantenimiento: 200, admin: 200, eventosG: 500, escuelasG: 0, otros: 200 }
  },
  // Mayo
  { month: 5, seasonMonth: 9,
    income: { cuotas: 11760, inscripciones: 0, patrocinios: 0, subvenciones: 0, cantina: 500, eventos: 500, merchandising: 100, otros: 150 },
    expenses: { salarios: 9600, ss: 2880, equipaciones: 0, material: 500, transporte: 4000, arbitrajes: 2400, federacion: 0, alquiler: 1500, suministros: 300, seguros: 0, marketing: 200, tecnologia: 200, cantina: 350, sanitario: 200, formacion: 0, mantenimiento: 200, admin: 200, eventosG: 0, escuelasG: 0, otros: 200 }
  },
  // Junio - Fin de temporada
  { month: 6, seasonMonth: 10,
    income: { cuotas: 5880, inscripciones: 0, patrocinios: 0, subvenciones: 0, cantina: 400, eventos: 0, merchandising: 50, otros: 100 },
    expenses: { salarios: 9600, ss: 2880, equipaciones: 0, material: 0, transporte: 1000, arbitrajes: 0, federacion: 0, alquiler: 1500, suministros: 300, seguros: 0, marketing: 0, tecnologia: 200, cantina: 250, sanitario: 0, formacion: 0, mantenimiento: 300, admin: 200, eventosG: 0, escuelasG: 0, otros: 200 }
  },
  // Julio - Escuela de verano, preinscripciones
  { month: 7, seasonMonth: 11,
    income: { cuotas: 0, inscripciones: 0, patrocinios: 16000, subvenciones: 0, cantina: 0, eventos: 0, merchandising: 0, escuelas: 14000, otros: 0 },
    expenses: { salarios: 9600, ss: 2880, equipaciones: 0, material: 500, transporte: 0, arbitrajes: 0, federacion: 0, alquiler: 0, suministros: 0, seguros: 0, marketing: 100, tecnologia: 200, cantina: 0, sanitario: 200, formacion: 0, mantenimiento: 0, admin: 100, eventosG: 0, escuelasG: 9500, otros: 150 }
  },
  // Agosto - Equipaciones
  { month: 8, seasonMonth: 12,
    income: { cuotas: 0, inscripciones: 0, patrocinios: 0, subvenciones: 0, cantina: 0, eventos: 0, merchandising: 0, otros: 0 },
    expenses: { salarios: 0, ss: 0, equipaciones: 0, material: 0, transporte: 0, arbitrajes: 0, federacion: 0, alquiler: 0, suministros: 0, seguros: 0, marketing: 0, tecnologia: 0, cantina: 0, sanitario: 0, formacion: 0, mantenimiento: 500, admin: 100, eventosG: 0, escuelasG: 0, otros: 100 }
  }
]

// === GENERATE TRANSACTIONS ===
function generateTransactions(): Transaction[] {
  const transactions: Transaction[] = []
  let txnId = 1
  
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  // Generar transacciones para temporada actual (desde sept 2024) y algo de la anterior
  const startDate = new Date(2024, 6, 1) // Julio 2024
  
  for (let d = new Date(startDate); d <= now; d.setMonth(d.getMonth() + 1)) {
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    
    // Encontrar el presupuesto del mes
    const monthBudget = MONTHLY_DISTRIBUTION.find(m => m.month === month)
    if (!monthBudget) continue
    
    // Determinar si el mes está cerrado (todos excepto el actual)
    const isClosed = year < currentYear || (year === currentYear && month < currentMonth)
    
    // Generar INGRESOS del mes
    for (const [key, amount] of Object.entries(monthBudget.income)) {
      if (amount <= 0) continue
      
      // Añadir variación realista (±5%)
      const variation = 1 + (Math.random() - 0.5) * 0.1
      const finalAmount = Math.round(amount * variation)
      
      const categoryMap: Record<string, { id: string; name: string }> = {
        cuotas: { id: 'cat_101', name: 'Cuotas socios' },
        inscripciones: { id: 'cat_102', name: 'Inscripciones' },
        patrocinios: { id: 'cat_103', name: 'Patrocinios' },
        subvenciones: { id: 'cat_104', name: 'Subvenciones' },
        escuelas: { id: 'cat_109', name: 'Campus y stages' },
        cantina: { id: 'cat_108', name: 'Cantina' },
        eventos: { id: 'cat_106', name: 'Eventos y torneos' },
        merchandising: { id: 'cat_107', name: 'Venta merchandising' },
        otros: { id: 'cat_110', name: 'Otros ingresos' }
      }
      
      const cat = categoryMap[key]
      if (!cat) continue
      
      transactions.push({
        id: `txn_${String(txnId++).padStart(5, '0')}`,
        clubId: 'club_xiria_001',
        type: 'income',
        amount: finalAmount,
        description: `${cat.name} - ${month}/${year}`,
        categoryId: cat.id,
        categoryName: cat.name,
        date: new Date(year, month - 1, key === 'cuotas' ? 5 : 15),
        paymentMethod: key === 'cuotas' ? 'direct_debit' : 'bank_transfer',
        status: 'paid',
        createdBy: 'user_001',
        createdByName: 'Carlos García Rodríguez',
        approvedBy: 'user_002',
        approvedAt: new Date(year, month - 1, key === 'cuotas' ? 6 : 16),
        createdAt: new Date(year, month - 1, 1),
        updatedAt: new Date(year, month - 1, 1),
        monthClosed: isClosed
      })
    }
    
    // Generar GASTOS del mes
    for (const [key, amount] of Object.entries(monthBudget.expenses)) {
      if (amount <= 0) continue
      
      const variation = 1 + (Math.random() - 0.5) * 0.1
      const finalAmount = Math.round(amount * variation)
      
      const categoryMap: Record<string, { id: string; name: string }> = {
        salarios: { id: 'cat_001', name: 'Salarios' },
        ss: { id: 'cat_002', name: 'Seguridad Social' },
        equipaciones: { id: 'cat_003', name: 'Equipaciones' },
        material: { id: 'cat_004', name: 'Material deportivo' },
        transporte: { id: 'cat_005', name: 'Transporte' },
        arbitrajes: { id: 'cat_007', name: 'Arbitrajes' },
        federacion: { id: 'cat_008', name: 'Federación y licencias' },
        alquiler: { id: 'cat_009', name: 'Alquiler instalaciones' },
        suministros: { id: 'cat_010', name: 'Suministros' },
        seguros: { id: 'cat_012', name: 'Seguros' },
        marketing: { id: 'cat_013', name: 'Marketing y publicidad' },
        tecnologia: { id: 'cat_014', name: 'Tecnología' },
        cantina: { id: 'cat_015', name: 'Cantina' },
        sanitario: { id: 'cat_011', name: 'Material sanitario' },
        formacion: { id: 'cat_016', name: 'Formación' },
        mantenimiento: { id: 'cat_018', name: 'Mantenimiento' },
        admin: { id: 'cat_017', name: 'Gastos administrativos' },
        eventosG: { id: 'cat_021', name: 'Eventos y torneos (gastos)' },
        escuelasG: { id: 'cat_020', name: 'Escuelas de verano (gastos)' },
        otros: { id: 'cat_019', name: 'Otros gastos' }
      }
      
      const cat = categoryMap[key]
      if (!cat) continue
      
      // Para salarios, crear una transacción por empleado
      if (key === 'salarios') {
        mockEmployees.forEach((emp) => {
          if (emp.monthlySalary && emp.monthlySalary > 0) {
            transactions.push({
              id: `txn_${String(txnId++).padStart(5, '0')}`,
              clubId: 'club_xiria_001',
              type: 'expense',
              amount: emp.monthlySalary,
              description: `Nómina ${emp.name} - ${month}/${year}`,
              categoryId: cat.id,
              categoryName: cat.name,
              employeeId: emp.id,
              employeeName: emp.name,
              date: new Date(year, month - 1, 28),
              paymentMethod: 'bank_transfer',
              isRecurring: true,
              recurringPeriod: 'monthly',
              status: 'paid',
              createdBy: 'user_003',
              createdByName: 'Pedro Martínez Silva',
              approvedBy: 'user_002',
              approvedAt: new Date(year, month - 1, 27),
              createdAt: new Date(year, month - 1, 25),
              updatedAt: new Date(year, month - 1, 28),
              monthClosed: isClosed
            })
          }
        })
      } else {
        transactions.push({
          id: `txn_${String(txnId++).padStart(5, '0')}`,
          clubId: 'club_xiria_001',
          type: 'expense',
          amount: finalAmount,
          description: `${cat.name} - ${month}/${year}`,
          categoryId: cat.id,
          categoryName: cat.name,
          date: new Date(year, month - 1, 20),
          paymentMethod: 'bank_transfer',
          status: 'paid',
          createdBy: 'user_003',
          createdByName: 'Pedro Martínez Silva',
          approvedBy: 'user_002',
          approvedAt: new Date(year, month - 1, 21),
          createdAt: new Date(year, month - 1, 18),
          updatedAt: new Date(year, month - 1, 20),
          monthClosed: isClosed
        })
      }
    }
  }
  
  // Añadir transacciones asignadas a equipos específicos
  // Cuotas por equipo (10 meses de temporada)
  const teamFeeData = [
    { teamId: 'team_001', name: 'Calvo Xiria Senior', players: 18, fee: 40 },
    { teamId: 'team_002', name: 'Garaysa Xiria Senior F', players: 16, fee: 40 },
    { teamId: 'team_003', name: 'Juvenil Masculino', players: 14, fee: 35 },
    { teamId: 'team_004', name: 'Juvenil Femenino', players: 12, fee: 35 },
    { teamId: 'team_005', name: 'Cadete Masculino', players: 15, fee: 30 },
    { teamId: 'team_006', name: 'Cadete Femenino', players: 14, fee: 30 },
    { teamId: 'team_007', name: 'Infantil A', players: 16, fee: 28 },
    { teamId: 'team_008', name: 'Infantil B', players: 14, fee: 28 },
    { teamId: 'team_009', name: 'Alevín A', players: 18, fee: 25 },
    { teamId: 'team_010', name: 'Benjamín A', players: 20, fee: 22 }
  ]
  
  // Añadir cuotas mensuales por equipo
  teamFeeData.forEach(team => {
    for (let m = 0; m < 10; m++) { // 10 meses de temporada
      const monthOffset = m < 4 ? m + 1 : m + 2 // Sep-Dic, Feb-Jun
      const txnMonth = monthOffset <= 4 ? currentYear - 1 : currentYear
      const txnMonthNum = monthOffset <= 4 ? 8 + monthOffset : monthOffset - 4
      
      if (new Date(txnMonth, txnMonthNum - 1, 1) <= new Date()) {
        transactions.push({
          id: `txn_${String(txnId++).padStart(5, '0')}`,
          clubId: 'club_xiria_001',
          type: 'income',
          amount: team.players * team.fee,
          description: `Cuotas ${team.name} - ${txnMonthNum}/${txnMonth}`,
          categoryId: 'cat_101',
          categoryName: 'Cuotas socios',
          teamId: team.teamId,
          teamName: team.name,
          date: new Date(txnMonth, txnMonthNum - 1, 5),
          paymentMethod: 'direct_debit',
          status: 'paid',
          createdBy: 'user_003',
          createdByName: 'Pedro Martínez Silva',
          createdAt: new Date(txnMonth, txnMonthNum - 1, 3),
          updatedAt: new Date(txnMonth, txnMonthNum - 1, 5)
        })
      }
    }
  })
  
  // Patrocinios asignados a equipos
  const sponsorAllocations = [
    { sponsor: 'Calvo Conservas', amount: 12000, teams: [{ id: 'team_001', name: 'Calvo Xiria Senior', pct: 100 }] },
    { sponsor: 'Garaysa', amount: 10000, teams: [{ id: 'team_002', name: 'Garaysa Xiria Senior F', pct: 100 }] },
    { sponsor: 'Concello de Xiria', amount: 25000, teams: [
      { id: 'team_001', name: 'Calvo Xiria Senior', pct: 20 },
      { id: 'team_002', name: 'Garaysa Xiria Senior F', pct: 20 },
      { id: 'team_003', name: 'Juvenil Masculino', pct: 15 },
      { id: 'team_004', name: 'Juvenil Femenino', pct: 15 },
      { id: 'team_005', name: 'Cadete Masculino', pct: 15 },
      { id: 'team_006', name: 'Cadete Femenino', pct: 15 }
    ]},
    { sponsor: 'Maderas Xiria', amount: 6000, teams: [
      { id: 'team_007', name: 'Infantil A', pct: 50 },
      { id: 'team_008', name: 'Infantil B', pct: 50 }
    ]}
  ]
  
  sponsorAllocations.forEach(sa => {
    const hasMultipleTeams = sa.teams.length > 1
    transactions.push({
      id: `txn_${String(txnId++).padStart(5, '0')}`,
      clubId: 'club_xiria_001',
      type: 'income',
      amount: sa.amount,
      description: `Patrocinio ${sa.sponsor} - Temporada 2024-25`,
      categoryId: 'cat_104',
      categoryName: 'Patrocinios',
      // Si tiene múltiples equipos, usar allocations; si no, teamId simple
      teamId: hasMultipleTeams ? undefined : sa.teams[0].id,
      teamName: hasMultipleTeams ? undefined : sa.teams[0].name,
      allocations: hasMultipleTeams ? sa.teams.map(t => ({
        teamId: t.id,
        teamName: t.name,
        percentage: t.pct,
        amount: (sa.amount * t.pct) / 100
      })) : undefined,
      date: new Date(2024, 8, 15), // Septiembre 2024
      paymentMethod: 'bank_transfer',
      status: 'paid',
      createdBy: 'user_002',
      createdByName: 'María López Fernández',
      createdAt: new Date(2024, 8, 10),
      updatedAt: new Date(2024, 8, 15)
    })
  })
  
  // Gastos de equipaciones por equipo
  teamFeeData.forEach(team => {
    transactions.push({
      id: `txn_${String(txnId++).padStart(5, '0')}`,
      clubId: 'club_xiria_001',
      type: 'expense',
      amount: team.players * 55, // ~55€ por jugador en equipación
      description: `Equipaciones ${team.name} - Temporada`,
      categoryId: 'cat_003',
      categoryName: 'Equipaciones',
      teamId: team.teamId,
      teamName: team.name,
      date: new Date(2024, 7, 20), // Agosto 2024
      paymentMethod: 'bank_transfer',
      status: 'paid',
      createdBy: 'user_003',
      createdByName: 'Pedro Martínez Silva',
      createdAt: new Date(2024, 7, 18),
      updatedAt: new Date(2024, 7, 20)
    })
  })
  
  // Gastos de transporte por equipo (varios meses)
  teamFeeData.slice(0, 6).forEach(team => { // Solo equipos de competición
    for (let m = 0; m < 8; m++) {
      const monthNum = m < 4 ? 9 + m : m + 1 // Sep-Dic, Ene-Abr
      const year = monthNum > 8 ? 2024 : 2025
      
      if (new Date(year, monthNum - 1, 1) <= new Date()) {
        transactions.push({
          id: `txn_${String(txnId++).padStart(5, '0')}`,
          clubId: 'club_xiria_001',
          type: 'expense',
          amount: 180 + Math.random() * 120, // 180-300€ desplazamiento
          description: `Desplazamiento ${team.name} - Jornada ${m + 1}`,
          categoryId: 'cat_005',
          categoryName: 'Transporte',
          teamId: team.teamId,
          teamName: team.name,
          date: new Date(year, monthNum - 1, 15 + Math.floor(Math.random() * 10)),
          paymentMethod: 'bank_transfer',
          status: 'paid',
          createdBy: 'user_003',
          createdByName: 'Pedro Martínez Silva',
          createdAt: new Date(year, monthNum - 1, 12),
          updatedAt: new Date(year, monthNum - 1, 15)
        })
      }
    }
  })
  
  // Añadir transacciones pendientes para el mes actual
  const pendingTxns = [
    { desc: 'Factura arbitrajes pendiente', cat: 'cat_007', catName: 'Arbitrajes', amount: 450, type: 'expense' as const },
    { desc: 'Desplazamiento Cadete - Ferrol', cat: 'cat_005', catName: 'Transporte', amount: 280, type: 'expense' as const, team: 'team_005' },
    { desc: 'Cuota pendiente familia García', cat: 'cat_101', catName: 'Cuotas socios', amount: 35, type: 'income' as const }
  ]
  
  pendingTxns.forEach((p, idx) => {
    transactions.push({
      id: `txn_${String(txnId++).padStart(5, '0')}`,
      clubId: 'club_xiria_001',
      type: p.type,
      amount: p.amount,
      description: p.desc,
      categoryId: p.cat,
      categoryName: p.catName,
      teamId: p.team,
      date: new Date(currentYear, currentMonth - 1, 20 + idx),
      paymentMethod: 'bank_transfer',
      status: 'pending',
      createdBy: 'user_004',
      createdByName: 'Luis Sánchez Pérez',
      createdAt: new Date(currentYear, currentMonth - 1, 18 + idx),
      updatedAt: new Date(currentYear, currentMonth - 1, 18 + idx)
    })
  })
  
  return transactions
}

export const mockTransactions: Transaction[] = generateTransactions()

// === MONTH CLOSINGS ===
export const mockMonthClosings: MonthClosing[] = (() => {
  const closings: MonthClosing[] = []
  const now = new Date()
  
  // Cerrar meses desde julio 2024 hasta el mes anterior al actual
  for (let d = new Date(2024, 6, 1); d < new Date(now.getFullYear(), now.getMonth(), 1); d.setMonth(d.getMonth() + 1)) {
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    
    const monthTxns = mockTransactions.filter(t => {
      const td = new Date(t.date)
      return td.getFullYear() === year && td.getMonth() === month - 1
    })
    
    const income = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    
    closings.push({
      id: `${mockClub.id}_${year}-${String(month).padStart(2, '0')}`,
      clubId: mockClub.id,
      year,
      month,
      status: 'closed',
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
      transactionCount: monthTxns.length,
      incomeByCategory: {},
      expensesByCategory: {},
      byTeam: {},
      byProject: {},
      closedBy: 'user_002',
      closedAt: new Date(year, month, 5),
      createdAt: new Date(year, month, 1),
      updatedAt: new Date(year, month, 5)
    })
  }
  
  return closings
})()

// === BUDGETS ===
export const mockBudgets: Budget[] = [
  {
    id: 'budget_2024_25',
    clubId: 'club_xiria_001',
    name: 'Presupuesto Temporada 2024-25',
    year: 2024,
    totalBudget: 500000,
    allocations: [
      { categoryId: 'cat_001', amount: ANNUAL_BUDGET.expenses.salarios, spent: 0 },
      { categoryId: 'cat_002', amount: ANNUAL_BUDGET.expenses.seguridadSocial, spent: 0 },
      { categoryId: 'cat_003', amount: ANNUAL_BUDGET.expenses.equipaciones, spent: 0 },
      { categoryId: 'cat_005', amount: ANNUAL_BUDGET.expenses.transporte, spent: 0 },
      { categoryId: 'cat_007', amount: ANNUAL_BUDGET.expenses.arbitrajes, spent: 0 },
      { categoryId: 'cat_008', amount: ANNUAL_BUDGET.expenses.federacion, spent: 0 },
      { categoryId: 'cat_012', amount: ANNUAL_BUDGET.expenses.seguros, spent: 0 }
    ],
    createdAt: new Date('2024-07-01'),
    updatedAt: new Date('2024-07-01')
  }
]

// === FORECASTS ===
export const mockForecasts: Forecast[] = MONTHLY_DISTRIBUTION.map((m, idx) => ({
  id: `forecast_${idx}`,
  clubId: 'club_xiria_001',
  year: m.month >= 9 ? 2024 : 2025,
  month: m.month,
  categoryId: 'all',
  type: 'income' as const,
  amount: Object.values(m.income).reduce((a, b) => a + b, 0),
  source: 'manual' as const,
  createdAt: new Date('2024-07-01'),
  updatedAt: new Date('2024-07-01')
}))

// === FINANCIAL TARGETS ===
export interface FinancialTarget {
  id: string
  clubId: string
  seasonYear: number // Año de inicio de temporada (2024 = temporada 2024-25)
  targetSurplus: number
  totalBudgetedIncome: number
  totalBudgetedExpenses: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export const mockFinancialTargets: FinancialTarget[] = [
  {
    id: 'target_2024_25',
    clubId: 'club_xiria_001',
    seasonYear: 2024,
    targetSurplus: 500,
    totalBudgetedIncome: totalIncome,
    totalBudgetedExpenses: totalExpenses,
    notes: 'Objetivo conservador basado en temporada anterior',
    createdAt: new Date('2024-07-01'),
    updatedAt: new Date('2024-07-01')
  }
]

// === EXPORT ALL ===
export const mockData = {
  club: mockClub,
  users: mockUsers,
  categories: mockCategories,
  teams: mockTeams,
  employees: mockEmployees,
  suppliers: mockSuppliers,
  sponsors: mockSponsors,
  projects: mockProjects,
  events: mockEvents,
  transactions: mockTransactions,
  monthClosings: mockMonthClosings,
  budgets: mockBudgets,
  forecasts: mockForecasts,
  financialTargets: mockFinancialTargets,
  annualBudget: ANNUAL_BUDGET,
  monthlyDistribution: MONTHLY_DISTRIBUTION
}
