
# POS - Punto de Venta (UPIICSA) chido

Proyecto de punto de venta (POS) para restaurantes desarrollado con React + TypeScript y Firebase (Auth, Firestore, Hosting). Incluye interfaz para caja, cocina (KDS), historial, configuración e inventario. Soporta personalización de órdenes (extras/salsas), roles (cajero, cocinero, admin), y despliegue mediante Firebase Hosting + GitHub Actions.

**Tecnologías principales**
- **Frontend**: React, TypeScript, Vite
- **Backend / BaaS**: Firebase Authentication, Firestore, Firebase Hosting, Cloud Functions (opcional)
- **CI/CD**: GitHub Actions (workflow incluido para build + deploy a Firebase Hosting)

**Estructura importante**
- `App.tsx`: Estado global de la aplicación y lógica del carrito
- `views/`: Vistas principales (`POSView.tsx`, `KitchenView.tsx`, `LoginView.tsx`, etc.)
- `components/`: Componentes UI reutilizables
- `firebase.ts`: configuración del SDK de Firebase
- `types.ts`: definiciones TypeScript para MenuItem, CartItem, Order, etc.

**Quick Start — Requisitos**
- Node.js (16+ recomendado) y npm
- Una consola (en Windows PowerShell se ejecutan los comandos de este README)
- Cuenta de Firebase y proyecto creado (Firestore + Auth habilitados). Para Cloud Functions de admin es necesario plan Blaze.

**Variables de entorno**
- Copia y configura un archivo `.env` o `.env.local` con tus claves de Firebase. Ejemplo mínimo para `vite`/`React`:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Coloca estas variables en `firebase.ts` si prefieres importarlas directamente.

**Instalación y desarrollo local**
- Instalar dependencias:

```
npm install
```
- Ejecutar en modo desarrollo (Vite):

```
npm run dev
```

Abrir `http://localhost:5173` u otra URL que indique Vite.

**Build de producción**

```
npm run build
```

Genera la carpeta `dist/` lista para servir.

**Despliegue a Firebase Hosting (manual)**
1. Instala y configura la CLI de Firebase: `npm install -g firebase-tools` y luego `firebase login`.
2. Inicializa (si no está) con `firebase init hosting` y elige el proyecto correcto.
3. Construye la app y despliega:

```
npm run build
firebase deploy --only hosting
```

Nota: en este repositorio ya hay un workflow de GitHub Actions que construye y despliega a Firebase Hosting cuando se configura el secreto `FIREBASE_TOKEN` o se usa `firebase-tools` con `GITHUB_TOKEN`/service-account. Revisa `.github/workflows/`.

**Cloud Functions y eliminación de usuarios**
- El proyecto incluye código para Cloud Functions que utiliza el Admin SDK (ubicado en la carpeta `functions/`). El despliegue de funciones puede requerir migrar a plan Blaze en Firebase.
- Si no quieres usar funciones, hay instrucciones en el repositorio para realizar ciertas tareas manualmente.

**Características destacadas**
- Login con Firebase Auth (roles: admin, cashier, cook)
- Interfaz POS con búsqueda y categorías
- Personalización de ítems antes de agregarlos al carrito (extras/salsas, notas y cantidad)
- Carrito con merge de items idénticos (mismo producto + mismas extras + mismas notas)
- Vista de cocina (KDS) con pedidos en tiempo real (Firestore `onSnapshot`) y opción para marcar como listo
- Inventario y control de stock (los productos con `stock === 0` se muestran como "Agotado" y no pueden agregarse)
- Hosting en Firebase + pipeline de despliegue con GitHub Actions

**Modelo de datos (resumen)**
- `MenuItem`: { id, name, price, image?, category?, stock? }
- `CartItem`: { id, name, price, quantity, notes?, extras?: [{ id?, name, price? }], image? }
- `Order`: { id, items: CartItem[], status, createdAt, customerName?, tableNumber?, type }

**Buenas prácticas y notas de seguridad**
- No subas tus claves de Firebase a Git. Usa variables de entorno y secretos en GitHub Actions.
- Para operaciones administrativas sobre usuarios (p. ej. borrado masivo), utiliza Cloud Functions con Admin SDK y asegura el proyecto en Blaze si la operación lo requiere.

**Testing y verificación rápida**
- Probar flujo de inicio de sesión y recuperación de contraseña desde la UI.
- Verificar agregar item con extras: seleccionar producto -> elegir extras/notas/cantidad -> agregar y ver carrito.
- Verificar que productos con `stock: 0` aparezcan como "Agotado" y no abran el modal.

**Contribuir**
- Forkea el repositorio, crea una rama con tu cambio (`feature/mi-cambio`) y abre un Pull Request contra `main`.
- Describe claramente el cambio, cómo probarlo y cualquier dependencia extra.

**Contacto / Soporte**
- Si necesitas ayuda con la configuración de Firebase, despliegue o integraciones, describe el problema en un issue o contáctame directamente.

---
_Última actualización: Nov 30, 2025_
