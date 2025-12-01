# Configurar GitHub Actions para Despliegue Automático

## Estado: Casi Listo

La configuración está casi completa. Solo falta un paso manual para conectar GitHub con Firebase.

## Pasos para Completar la Configuración

### Paso 1: Crear Cuenta de Servicio en Firebase

1. Ve a https://console.firebase.google.com/project/pos-restaurant-54706/settings/serviceaccounts/adminsdk
2. Asegúrate de estar en la pestaña "Firebase Admin SDK"
3. Haz clic en "Generate New Private Key"
4. Se descargará un archivo JSON (guárdalo temporalmente)

### Paso 2: Agregar el Secret a GitHub

1. Ve a tu repositorio en GitHub: https://github.com/oto-ml/POS-
2. Ve a Settings → Secrets and variables → Actions
3. Haz clic en "New repository secret"
4. **Name:** `FIREBASE_SERVICE_ACCOUNT_POS_RESTAURANT_54706`
5. **Value:** Copia TODO el contenido del archivo JSON descargado en el Paso 1
6. Haz clic en "Add secret"

### Paso 3: Verificar la Configuración

Una vez completados los pasos anteriores:

1. Haz un cambio pequeño en el código
2. Haz commit y push a la rama `main`
3. Ve a GitHub → Actions
4. Deberías ver el workflow "Deploy to Firebase Hosting" ejecutándose
5. Espera a que termine (unos 2-3 minutos)
6. Si es exitoso, tu app estará en vivo en Firebase Hosting

## ¿Cómo Funciona?

Cada vez que hagas push a `main`:

```
Tu cambio en código
        ↓
Git push a GitHub
        ↓
GitHub Actions se dispara automáticamente
        ↓
Se instalan dependencias (npm ci)
        ↓
Se compila el proyecto (npm run build)
        ↓
Se genera la carpeta dist/
        ↓
Se despliega a Firebase Hosting
        ↓
Tu app está en vivo en 2-3 minutos
```

## URL de tu App

Una vez desplegada, tu app estará en:
`https://pos-restaurant-54706.web.app`

## Archivos Creados/Modificados

- ✅ `firebase.json` - Configuración de hosting
- ✅ `.github/workflows/deploy.yml` - GitHub Actions workflow
- ⚠️ Falta crear el Secret en GitHub (manual)

## Troubleshooting

### El workflow falla con "Permission denied"

**Solución:** Verifica que el Secret está correctamente configurado en GitHub:
- Settings → Secrets and variables → Actions
- Debe existir `FIREBASE_SERVICE_ACCOUNT_POS_RESTAURANT_54706`
- Contiene todo el JSON de la cuenta de servicio

### La rama no es "main"

Si tu rama principal es diferente (ej: `master`), edita `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches: [ main ]  # Cambiar a [ master ]
```

### El build falla

```bash
# Prueba localmente
npm install
npm run build
```

## Próximos Pasos

1. ✅ Completar los 3 pasos anteriores
2. ✅ Hacer un cambio de prueba y push
3. ✅ Ver el despliegue automático en GitHub Actions
4. ✅ Acceder a tu app en https://pos-restaurant-54706.web.app

## Notas de Seguridad

- 🔒 El archivo JSON de la cuenta de servicio es secreto (como una contraseña)
- 🔒 GitHub lo mantiene encriptado
- 🔒 Solo CI/CD puede accederlo
- 🔒 Nunca lo subes a repositorio público

## Referencias

- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [GitHub Actions with Firebase](https://github.com/FirebaseExtended/action-hosting-deploy)
- [Service Accounts](https://firebase.google.com/docs/admin/setup#service-accounts)
