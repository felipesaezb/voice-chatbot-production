/**
 * Configuración de la empresa
 * Edita estos valores para personalizar el chatbot para cada cliente
 */

export const company = {
  // Nombre de la empresa
  name: "Nomahost",
  
  // Slug para URLs y identificadores
  slug: "nomahost",
  
  // Colores corporativos
  colors: {
    primary: "#1869ea",      // Color principal (botón, header)
    primaryDark: "#0f4c91",  // Color principal oscuro
    secondary: "#4ade80",    // Color secundario (online indicator)
    background: "#ffffff",   // Fondo
    text: "#1a1a2e",         // Texto principal
    textMuted: "#687076",    // Texto secundario
  },
  
  // Avatar del bot
  avatar: {
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663304313323/fjTzkebkOyNsgNRY.png",
    alt: "Felipe - Asistente Virtual",
  },
  
  // Información de contacto
  contact: {
    phone: "+56912345678",
    email: "soporte@nomahost.cl",
    website: "https://nomahost.cl",
    hours: "Lunes a Viernes 9:00 - 18:00",
  },
  
  // Redes sociales
  social: {
    instagram: "https://instagram.com/nomahost",
    facebook: "https://facebook.com/nomahost",
    twitter: "https://twitter.com/nomahost",
  },
  
  // Información general
  description: "Hosting y dominios web para tu negocio",
  industry: "Tecnología / Hosting",
};

export type Company = typeof company;
