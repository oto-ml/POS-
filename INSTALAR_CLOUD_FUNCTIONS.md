# Instalación y Despliegue de Cloud Functions

## Requisitos Previos

1. **Node.js 20+** instalado
2. Cuenta de Google con acceso a Firebase
3. Proyecto de Firebase creado (ya existe: `pos-restaurant-54706`)

## Pasos de Instalación

### 1. Instalar Firebase CLI globalmente

```bash
npm install -g firebase-tools
```

### 2. Autenticarse con Firebase

```bash
firebase login
```

Esto abrirá tu navegador para que inicies sesión con tu cuenta de Google.

### 3. Instalar dependencias de las funciones

```bash
cd functions
npm install
```

### 4. Compilar TypeScript (opcional, se hace automático al desplegar)

```bash
npm run build
```

## Despliegue

### Opción A: Desplegar solo las Cloud Functions

```bash
firebase deploy --only functions
```

### Opción B: Desplegar todo (si tienes más configuraciones)

```bash
firebase deploy
```

### Ver logs de las funciones

```bash
firebase functions:log
```

## Verificar que está funcionando

1. Ve a Firebase Console: https://console.firebase.google.com/
2. Selecciona el proyecto `pos-restaurant-54706`
3. Ve a **Cloud Functions** en el menú
4. Deberías ver `deleteUser` y `getUserInfo` listadas

## ¿Qué hace la Cloud Function?

### `deleteUser`
- **Entrada:** `{ uid: string }` - El UID del usuario a eliminar
- **Validaciones:**
  - Solo admins pueden eliminar usuarios
  - No se puede eliminar a sí mismo
  - El usuario debe estar autenticado
- **Salida:** `{ success: true, message: "...", timestamp: "..." }`
- **Registro:** Se guarda en `audit_logs`

### `getUserInfo`
- **Entrada:** `{ uid?: string }` - UID opcional (por defecto, el usuario actual)
- **Retorna:** Información del usuario (email, displayName, role, etc.)

## Troubleshooting

### Error: "Cannot find module 'firebase-admin'"

```bash
cd functions
npm install
```

### Error: "Project not found"

Verifica que:
1. Tengas internet activo
2. Ejecutes desde el directorio correcto
3. El proyecto ID en `firebase.json` sea correcto

### Error: "Permission denied"

Asegúrate de:
1. Usar la cuenta correcta: `firebase login`
2. Tener permisos de "Editor" o superior en el proyecto

## Notas Importantes

- Las funciones se ejecutan en la región por defecto de Firebase (us-central1)
- Los logs se guardan automáticamente en Cloud Logging
- Hay un costo mínimo por invocaciones (primeras 2 millones de invocaciones gratis al mes)

## Desinstalación

Para eliminar las Cloud Functions:

```bash
firebase deploy --only functions --delete-all-functions
# O desde la consola de Firebase
```

## Referencias

- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)
