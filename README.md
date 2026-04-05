# Voice Chatbot - Nomahost

Chatbot de voz para Nomahost - Consultora de soluciones digitales para hospedajes.

## Requisitos

- Node.js 18+
- npm o pnpm

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build
npm start
```

## Variables de Entorno

Necesitas configurar estas variables en Railway:

```
OPENAI_API_KEY=tu_api_key_aqui
DATABASE_URL=tu_database_url_aqui (opcional)
```

## Deployment en Railway

1. Conecta tu repositorio de GitHub
2. Railway detectará automáticamente `railway.toml`
3. Configura las variables de entorno
4. Railway despliega automático

## Estructura

- `server/` - Backend Express
- `constants/` - Configuración y prompts
- `package.json` - Dependencias
- `railway.toml` - Configuración de Railway

## Soporte

Para más información, contacta a Nomahost.
