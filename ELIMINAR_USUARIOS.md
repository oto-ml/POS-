# Guía de Eliminación de Usuarios - Firebase Auth

## Problema
Cuando eliminas un usuario del POS, se eliminan sus datos de Firestore pero la cuenta de Firebase Auth permanece, impidiendo reutilizar ese email.

## Soluciones

### Opción 1: Eliminar Manualmente (Recomendado por ahora)

Cuando elimines un usuario, el sistema mostrará un mensaje con instrucciones para eliminar la cuenta de Firebase Auth:

1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto
3. Authentication → Users
4. Busca el usuario a eliminar
5. Haz clic en (...) → Delete user

### Opción 2: Configurar Cloud Function (Automático)

Para eliminar automáticamente las cuentas de Auth, configura una Cloud Function:

#### Paso 1: Instalar Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

#### Paso 2: Inicializar Firebase Functions
```bash
firebase init functions
```

#### Paso 3: Crear la Cloud Function

Edita `functions/src/index.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const deleteUser = functions.https.onCall(async (data, context) => {
  // Verificar que es un admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'El usuario debe estar autenticado'
    );
  }

  const uid = data.uid;

  try {
    await admin.auth().deleteUser(uid);
    return { success: true, message: 'Usuario eliminado de Auth' };
  } catch (error: any) {
    console.error('Error eliminando usuario:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error al eliminar usuario de Auth'
    );
  }
});
```

#### Paso 4: Desplegar la Cloud Function
```bash
firebase deploy --only functions
```

## Consideraciones de Seguridad

- Solo los admins pueden eliminar usuarios
- La operación requiere autenticación
- Se registra en audit_logs antes de eliminar
- Se eliminan todas las órdenes y auditoría asociadas

## Referencias

- [Firebase Admin SDK](https://firebase.google.com/docs/auth/admin/manage-users)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Delete Users in Firebase Console](https://firebase.google.com/docs/auth/manage-users)
