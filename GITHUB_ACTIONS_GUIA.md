# 🚀 Despliegue Automático con GitHub Actions

## ✅ Estado: Listo para Configurar

Tu aplicación POS ya está compilada y desplegada en Firebase Hosting. Ahora necesitas configurar GitHub Actions para automatizar los futuros cambios.

## URL Actual
🌍 **https://pos-restaurant-54706.web.app**

## Configuración de GitHub Actions

### ¿Qué hace?
Cada vez que hagas un cambio en `main`:
1. GitHub detecta el push
2. Ejecuta automáticamente el build
3. Compila el proyecto
4. Despliega a Firebase Hosting
5. Tu app está en vivo en 2-3 minutos

### Requisito: Crear Secret en GitHub

**Antes de que funcione, necesitas agregar UN secret a GitHub:**

1. Ve a tu repositorio: https://github.com/oto-ml/POS-
2. Settings → Secrets and variables → Actions
3. New repository secret:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_POS_RESTAURANT_54706`
   - **Value:** [Ver instrucciones detalladas abajo]

#### Cómo obtener el valor del secret:

1. Ve a Firebase Console: https://console.firebase.google.com/project/pos-restaurant-54706/settings/serviceaccounts/adminsdk
2. Pestaña "Firebase Admin SDK"
3. Haz clic en "Generate New Private Key"
4. Se descarga un archivo `pos-restaurant-54706-xxxxx.json`
5. Abre el archivo con un editor de texto
6. Copia TODO el contenido (es JSON completo)
7. Pégalo en GitHub como el valor del secret

## Cómo Usar

### Primer Deploy
Ya está hecho ✅
- Tu app está en: https://pos-restaurant-54706.web.app

### Para Cambios Futuros

```bash
# 1. Haz cambios en el código
# 2. Commit
git add .
git commit -m "Mi cambio"

# 3. Push a main
git push origin main

# 4. Observa el deploy automático
# Ve a GitHub → Actions → Verás el workflow ejecutándose
```

## Archivos Configurados

- ✅ `firebase.json` - Configuración de hosting
- ✅ `.github/workflows/deploy.yml` - Workflow automático
- ✅ `dist/` - Carpeta compilada (lista para producción)

## Verificar el Despliegue

### En GitHub
1. Ve a Actions tab
2. Verifica que el workflow ejecutó correctamente
3. Todos los pasos deben tener ✅

### En Firebase
1. Firebase Console → Hosting
2. Verifica que la versión esté "Active"
3. Haz clic en la URL para probar

### En tu App
1. Ve a https://pos-restaurant-54706.web.app
2. Prueba que funciona correctamente

## Problemas Comunes

### Error: "Secret not found"
**Solución:** Falta agregar el secret en GitHub. Ver sección "Requisito" arriba.

### Error: "Cannot find module"
**Solución:** Verifica que `npm install` se ejecutó en el workflow.

### El build tarda mucho
**Normal:** Primer build tarda 2-3 minutos. Los siguientes son más rápidos gracias al cache.

### Quiero cambiar la rama principal
Si tu rama es `master` en lugar de `main`:

Edita `.github/workflows/deploy.yml`:
```yaml
branches: [ master ]  # Cambiar de [ main ]
```

## Monitoreo y Logs

### Ver logs del GitHub Action
1. GitHub Repo → Actions
2. Haz clic en el workflow
3. Verifica los pasos y logs

### Ver logs de Firebase Hosting
1. Firebase Console → Hosting
2. Pestaña "Deployments"
3. Haz clic en una versión para ver detalles

## Próximos Pasos

1. ✅ Crear el secret en GitHub (CRÍTICO)
2. ✅ Hacer un pequeño cambio de prueba
3. ✅ Push a main y observar el deploy automático
4. ✅ Verificar que la app está en vivo

## Referencia de URLs

| Recurso | URL |
|---------|-----|
| App en Vivo | https://pos-restaurant-54706.web.app |
| Firebase Console | https://console.firebase.google.com/project/pos-restaurant-54706/overview |
| GitHub Repo | https://github.com/oto-ml/POS- |
| GitHub Actions | https://github.com/oto-ml/POS-/actions |
| GitHub Secrets | https://github.com/oto-ml/POS-/settings/secrets/actions |

## Seguridad

🔒 **Notas importantes:**
- El secret contiene credenciales sensibles
- GitHub lo mantiene encriptado
- Solo el CI/CD puede accederlo
- NUNCA lo subes al repositorio público
- Si lo expones, regenera la clave en Firebase

## ¿Necesitas Más?

Para despliegues manuales en cualquier momento:
```bash
npm run build
firebase deploy --only hosting
```

---

**¡Tu aplicación POS está lista para producción!** 🎉
