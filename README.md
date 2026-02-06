# Grootter Finance 🏆

Aplicación web PWA para la gestión financiera de clubes deportivos, desarrollada con Vue 3, Quasar Framework y Firebase.

## Características principales

### 📱 Mobile-first
- **Registro rápido de gastos e ingresos** - Interfaz optimizada para móvil
- **Categorización inteligente** - Asigna transacciones a categorías, equipos, proyectos y eventos
- **Adjuntos y facturas** - Sube fotos de tickets y documentos
- **PWA** - Instálala como app nativa en tu dispositivo

### 💼 Gestión completa
- **Equipos** - Organiza finanzas por equipo deportivo
- **Proyectos** - Seguimiento de presupuestos por proyecto
- **Eventos** - Control financiero de eventos puntuales
- **Categorías personalizables** - Adapta las categorías a tu club

### 📊 Estadísticas y reporting
- **Dashboard interactivo** - Visión general de la situación financiera
- **Gráficos de tendencias** - Evolución mensual de ingresos y gastos
- **Comparativas** - Por categoría, equipo, proyecto
- **Previsiones** - Basadas en datos históricos

### 🔒 Gestión contable
- **Cierre de mes** - Bloquea transacciones para auditoría
- **Vista gestoría** - Acceso específico para contables externos
- **Exportación** - PDF, Excel, CSV
- **Historial completo** - Trazabilidad de todas las operaciones

### 👥 Roles y permisos
- **Admin** - Control total del club
- **Manager** - Gestión financiera y aprobaciones
- **Member** - Registro de transacciones
- **Accountant** - Vista de consulta para gestoría

## Tecnologías

- **Vue 3** + Composition API
- **Quasar Framework 2** - UI components y PWA
- **Firebase** - Auth, Firestore, Storage
- **Pinia** - State management
- **Chart.js** - Visualizaciones
- **TypeScript** - Type safety

## Instalación

### Requisitos previos
- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/club-controller.git
cd club-controller
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Firebase
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilita Authentication (Email/Password)
3. Crea una base de datos Firestore
4. Habilita Storage
5. Copia la configuración a `.env`:

```bash
cp .env.example .env
# Edita .env con tus credenciales de Firebase
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

### 5. Build para producción
```bash
npm run build
```

## Estructura del proyecto

```
src/
├── boot/           # Inicialización (Firebase, Auth)
├── components/     # Componentes reutilizables
├── css/            # Estilos globales SCSS
├── layouts/        # Layouts de la aplicación
├── pages/          # Páginas/vistas
│   ├── auth/       # Login, registro
│   ├── transactions/ # Gestión de transacciones
│   ├── statistics/ # Estadísticas
│   ├── closings/   # Cierres de mes
│   ├── accountant/ # Vista gestoría
│   ├── teams/      # Equipos
│   ├── projects/   # Proyectos
│   ├── events/     # Eventos
│   └── settings/   # Configuración
├── router/         # Configuración de rutas
├── stores/         # Pinia stores
└── types/          # TypeScript types
```

## Reglas de Firestore

Crea las siguientes reglas en Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Clubs
    match /clubs/{clubId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Transactions
    match /transactions/{transactionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.monthClosed != true;
    }
    
    // Categories, Teams, Projects, Events
    match /{collection}/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## PWA

La aplicación está configurada como Progressive Web App:

- **Instalable** en dispositivos móviles y desktop
- **Funciona offline** (caché de recursos estáticos)
- **Actualizaciones automáticas**

Para generar los iconos de la PWA, coloca un icono de 512x512 en `public/icons/` y ejecuta:

```bash
npx pwa-asset-generator logo.png public/icons
```

## Despliegue

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Netlify / Vercel
Conecta tu repositorio y configura:
- Build command: `npm run build`
- Output directory: `dist/spa`

## Contribuir

1. Fork del repositorio
2. Crea tu rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -am 'Añade nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crea un Pull Request

## Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

---

Desarrollado con ❤️ para clubes deportivos
