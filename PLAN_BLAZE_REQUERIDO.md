# ⚠️ Limitación del Plan Spark de Firebase

## Problema

Para desplegar Cloud Functions, necesitas actualizar tu proyecto de Firebase al **plan Blaze (pago)**.

El plan actual es **Spark (gratuito)**, que tiene limitaciones:
- ❌ No permite Cloud Functions
- ❌ No permite Cloud Tasks
- ❌ Acceso limitado a API

## Opciones

### Opción 1: Actualizar a Plan Blaze (Recomendado para producción)

1. Ve a https://console.firebase.google.com/project/pos-restaurant-54706/usage/details
2. Haz clic en "Upgrade" → "Blaze"
3. Sigue el proceso de pago
4. Luego ejecuta: `firebase deploy --only functions`

**Ventajas:**
- ✅ Acceso a todas las características de Firebase
- ✅ Eliminación automática de usuarios
- ✅ Mejor rendimiento

**Costos:**
- Primeras 2,000,000 de invocaciones gratis al mes
- Luego $0.40 por cada millón de invocaciones
- Para este proyecto (bajo volumen) = ~$0-5 USD/mes

### Opción 2: Eliminar Manualmente (Sin Costo)

**Método actual (ya implementado):**
1. Al eliminar un usuario, el sistema muestra un aviso
2. Incluye instrucciones para eliminar manualmente desde Firebase Console
3. No requiere actualizar el plan

**Pasos del usuario:**
- Firebase Console → Authentication → Users
- Buscar el usuario
- Click en (...) → Delete user

### Opción 3: Usar Firebase Emulator Suite (Para desarrollo)

Si quieres probar localmente sin pagar:

```bash
firebase emulators:start --only functions,auth,firestore
```

Nota: Solo funciona en desarrollo, no en producción.

## Comparativa

| Característica | Spark (Gratuito) | Blaze (Pago) |
|---|---|---|
| Cloud Functions | ❌ | ✅ |
| Eliminación automática | ❌ | ✅ |
| Eliminación manual | ✅ | ✅ |
| Costo mensual | $0 | ~$0-5 USD |
| Ideal para | Desarrollo | Producción |

## Decisión Recomendada

Para tu proyecto POS en **producción**, recomiendo:

1. **Mantener la solución manual por ahora** (no requiere actualización)
2. **Cuando crezca el proyecto**, actualizar a Blaze para automatizar

## Resumen

La Cloud Function ya está creada y lista para desplegar. Solo necesitas:

1. Actualizar a plan Blaze
2. Ejecutar: `firebase deploy --only functions`

**Por ahora**, el sistema usa la solución manual que funciona perfectamente.

## Archivos Creados

- ✅ `functions/src/index.ts` - Cloud Function lista
- ✅ `functions/package.json` - Dependencias
- ✅ `firebase.json` - Configuración
- ✅ `INSTALAR_CLOUD_FUNCTIONS.md` - Instrucciones de instalación

Todo está listo para cuando decidas actualizar el plan.
