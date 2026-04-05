# Voice Chatbot - Railway Deployment

## ✅ Archivos necesarios para Railway

Este repositorio contiene TODOS los archivos que Railway necesita para desplegar el chatbot de Nomahost.

### 📁 Estructura de carpetas:

```
server/          ← Código del servidor (Node.js)
constants/       ← Configuración del bot (prompt, datos)
config/          ← Configuración de empresa y personalidad
package.json     ← Dependencias
tsconfig.json    ← Configuración TypeScript
Procfile         ← Instrucciones para Railway
.gitignore       ← Archivos a ignorar
```

## 🚀 Cómo desplegar en Railway

1. **Conecta tu repositorio GitHub a Railway**
   - Ve a https://railway.app
   - Conecta tu cuenta GitHub
   - Selecciona este repositorio

2. **Railway detectará automáticamente:**
   - `package.json` → Instala dependencias
   - `Procfile` → Ejecuta `npm run build && npm start`
   - Crea URL permanente automáticamente

3. **Espera a que termine el deploy** (5-10 minutos)

4. **Obtén la URL permanente:**
   - Ve a tu proyecto en Railway
   - Copia la URL del dominio (algo como: `https://voice-chatbot-production.up.railway.app`)

5. **Actualiza el widget en WordPress:**
   - Reemplaza la URL antigua en el HTML del widget
   - Guarda cambios

## 📝 Variables de entorno (si las necesitas)

Railway puede necesitar estas variables (normalmente se configuran automáticamente):

```
NODE_ENV=production
PORT=3000
```

## ✨ El chatbot estará LISTO cuando:

- ✅ Railway muestra "Deploy Successful"
- ✅ Tienes una URL permanente (no cambia)
- ✅ El widget funciona en WordPress

## 🆘 Si algo no funciona

1. Verifica que TODOS los archivos estén en GitHub
2. Mira los logs en Railway (Dashboard → Logs)
3. Asegúrate de que `package.json` tiene los scripts correctos

---

**Creado para Nomahost | Chatbot con Felipe** 🤖
