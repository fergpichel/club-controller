# Grootter Finance

Aplicacion web PWA para la gestion financiera de clubes deportivos, desarrollada con Vue 3, Quasar Framework y Firebase.

## Caracteristicas principales

### Mobile-first
- **Registro rapido de gastos e ingresos** — Interfaz optimizada para movil
- **Categorizacion inteligente con IA** — Gemini sugiere categorias automaticamente
- **Adjuntos y facturas** — Sube fotos de tickets y documentos
- **PWA** — Instalable como app nativa

### Gestion completa
- **Equipos** — Organiza finanzas por equipo deportivo
- **Proyectos** — Seguimiento de presupuestos por proyecto
- **Eventos** — Control financiero de eventos puntuales
- **Proveedores y patrocinadores** — Vinculacion con transacciones
- **Categorias personalizables** — Adapta las categorias a tu club (con subcategorias y categorias sensibles)

### Inteligencia artificial
- **Categorizacion batch** — Categoriza multiples transacciones al importar Excel
- **Categorizacion individual** — Sugerencias en tiempo real al crear transacciones
- **Sugerencias de presupuesto** — Propuestas basadas en datos historicos
- **Aprendizaje por correcciones** — Las correcciones del usuario mejoran futuras sugerencias

> Las llamadas a Gemini se realizan desde **Firebase Cloud Functions** (server-side). La API key nunca se expone al cliente. Ver [Seguridad](#seguridad).

### Estadisticas y reporting
- **Dashboard interactivo** — Vision general de la situacion financiera
- **Cuadro de mando** — KPIs financieros y alertas
- **Tesoreria** — Analisis avanzado de flujo de caja
- **Rentabilidad por equipo** — Costes, cuotas e ingresos por equipo
- **Previsiones** — Basadas en datos historicos
- **Exportacion** — PDF, Excel, CSV

### Gestion contable
- **Cierre de mes** — Bloquea transacciones para auditoria
- **Vista gestoria** — Acceso especifico para contables externos
- **Presupuestos por temporada** — Con sugerencias de IA
- **Historial completo** — Trazabilidad de todas las operaciones

### Roles y permisos
| Rol | Descripcion |
|-----|-------------|
| **Admin** | Control total del club |
| **Manager** (Directivo) | Gestion financiera, settings, aprobaciones |
| **Controller** (Interventor) | Acceso completo + cierres de mes |
| **Editor** (Coordinador) | CRUD transacciones, datos sensibles anonimizados |
| **Employee** (Colaborador) | Solo crea transacciones y ve las suyas |
| **Viewer** (Observador) | Solo lectura |

### Backoffice Super Admin
Panel independiente (`/superadmin`) con layout propio para administradores de la plataforma:
- **Dashboard** — Clubs registrados, usuarios, actividad de IA
- **Uso de IA** — Logs detallados de todas las llamadas a Gemini (usuario, club, funcion, duracion, estado)
- **Cache server-side** — Las estadisticas se cachean 5 minutos para no impactar rendimiento

Acceso restringido a usuarios con `isSuperAdmin: true` en Firestore.

## Tecnologias

- **Vue 3** + Composition API + TypeScript
- **Quasar Framework 2** — UI components, PWA, responsive
- **Firebase** — Auth, Firestore, Storage, Cloud Functions, Hosting
- **Pinia** — State management
- **Chart.js** — Visualizaciones
- **Google Gemini** — IA para categorizacion y presupuestos (server-side via Cloud Functions)

## Estructura del proyecto

```
club-controller/
├── src/                    # Frontend (Vue/Quasar)
│   ├── boot/               # Inicializacion (Firebase, Auth)
│   ├── components/         # Componentes reutilizables
│   ├── composables/        # Composables (useSessionTimeout, etc.)
│   ├── css/                # Estilos globales SCSS
│   ├── layouts/            # Layouts
│   │   ├── MainLayout.vue      # Layout principal de la app
│   │   ├── AuthLayout.vue      # Layout de login/registro
│   │   └── SuperAdminLayout.vue # Layout del backoffice
│   ├── pages/              # Paginas/vistas
│   │   ├── auth/               # Login, registro, setup
│   │   ├── transactions/       # Gestion de transacciones
│   │   ├── statistics/         # Estadisticas
│   │   ├── analysis/           # Cuadro de mando, rentabilidad
│   │   ├── treasury/           # Tesoreria
│   │   ├── closings/           # Cierres de mes
│   │   ├── accountant/         # Vista gestoria
│   │   ├── forecasts/          # Previsiones
│   │   ├── teams/              # Equipos
│   │   ├── projects/           # Proyectos
│   │   ├── events/             # Eventos
│   │   ├── settings/           # Configuracion, presupuesto, importacion
│   │   └── superadmin/         # Backoffice (dashboard, uso de IA)
│   ├── router/             # Rutas y navigation guards
│   ├── services/           # Servicios (aiCategorization, etc.)
│   ├── stores/             # Pinia stores
│   ├── types/              # TypeScript types
│   └── utils/              # Utilidades (formatters, logger)
├── functions/              # Firebase Cloud Functions (server-side)
│   ├── src/
│   │   └── index.ts            # Funciones: AI categorization + backoffice stats
│   ├── package.json
│   └── tsconfig.json
├── firebase.json           # Configuracion Firebase (hosting, functions, emulators)
├── firestore.rules         # Reglas de seguridad Firestore
├── storage.rules           # Reglas de seguridad Storage
└── .cursor/rules/          # Reglas de Cursor AI (security, etc.)
```

## Instalacion

### Requisitos previos
- Node.js 20+
- npm o yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Cuenta de Firebase con proyecto creado

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd club-controller

# Frontend
npm install

# Cloud Functions
cd functions && npm install && cd ..
```

### 2. Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilita **Authentication** (Email/Password + Google)
3. Crea una base de datos **Firestore**
4. Habilita **Storage**
5. Copia la configuracion:

```bash
cp .env.example .env.development
# Edita con tus credenciales de Firebase
```

### 3. Configurar el secreto de Gemini

La API key de Gemini se almacena en Firebase Secrets Manager (nunca en el cliente):

```bash
firebase functions:secrets:set GEMINI_API_KEY
# Pega tu API key de Google AI Studio
```

### 4. Desarrollo local

**Con emuladores** (recomendado para desarrollo):
```bash
# Terminal 1: Emuladores Firebase
npm run emulators

# Terminal 2: Dev server
npm run dev
```

**Contra produccion** (para testing):
```bash
# Crea .env.development.local con VITE_USE_EMULATORS=false
npm run dev
```

### 5. Despliegue

```bash
# Build frontend + deploy todo
npm run build
firebase deploy

# Solo funciones
cd functions && npm run build && cd ..
firebase deploy --only functions

# Solo reglas de Firestore
firebase deploy --only firestore:rules
```

## Seguridad

### API keys y secretos

**Regla fundamental**: las API keys de servicios externos (Gemini, Stripe, etc.) **nunca** se exponen al cliente.

```
Cliente (Vue) → httpsCallable() → Cloud Function → Gemini API
                                        ↓
                                  Secrets Manager (API key)
                                        ↓
                                  Firestore (usage logs)
```

- Las variables `VITE_*` se incrustan en el bundle JS y son publicas. Solo usar para Firebase config (que es publica por diseno).
- Los secretos van en Firebase Secrets Manager: `firebase functions:secrets:set SECRET_NAME`
- Cada Cloud Function valida `request.auth` antes de procesar.
- Los logs de uso se registran en `ai_usage_logs` para auditoria.

Ver `.cursor/rules/security-api-keys.mdc` para la guia completa.

### Firestore Security Rules

Las reglas de seguridad estan en `firestore.rules` (no en Firebase Console). Despliega con:

```bash
firebase deploy --only firestore:rules
```

Principales protecciones:
- Usuarios solo leen miembros de su propio club
- Transacciones protegidas por pertenencia al club + permisos de rol
- Cierres de mes solo por admin/controller
- `ai_usage_logs` y `backoffice_cache`: solo lectura para superadmins, escritura exclusiva desde Cloud Functions (admin SDK)
- Catch-all que deniega todo lo no especificado

### Super Admin

Para marcar un usuario como superadmin, anade `isSuperAdmin: true` a su documento en `/users/{uid}` desde Firebase Console. Esto le da acceso al backoffice en `/superadmin`.

## Cloud Functions

Funciones desplegadas en `europe-west1`:

| Funcion | Descripcion | Uso |
|---------|-------------|-----|
| `suggestCategoriesBatch` | Categoriza multiples conceptos con Gemini | Importacion Excel |
| `suggestCategory` | Categoriza una transaccion individual | Formulario de transaccion |
| `suggestBudgetAllocations` | Sugiere presupuesto basado en historico | Pagina de presupuesto |
| `getBackofficeStats` | Agrega estadisticas de la plataforma | Dashboard superadmin |

Todas las funciones:
- Validan autenticacion (`request.auth`)
- Las funciones de IA registran uso en `ai_usage_logs`
- `getBackofficeStats` verifica `isSuperAdmin` server-side y cachea resultados 5 min

## Emuladores

```bash
npm run emulators
```

Puertos:
| Servicio | Puerto |
|----------|--------|
| Auth | 9099 |
| Firestore | 8080 |
| Storage | 9199 |
| Functions | 5001 |
| Emulator UI | 4000 |

## PWA

La aplicacion esta configurada como Progressive Web App:
- Instalable en dispositivos moviles y desktop
- Cache de recursos estaticos
- Actualizaciones automaticas

## Licencia

MIT License
