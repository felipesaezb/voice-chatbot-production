/**
 * Base de conocimiento específica de la empresa
 * Contiene información que el bot debe conocer sobre el negocio
 */

export const knowledge = {
  // Servicios o productos principales
  services: [
    {
      name: "Hosting Compartido",
      description: "Hosting web económico para pequeños negocios",
      price: "$5.99/mes",
    },
    {
      name: "VPS",
      description: "Servidor virtual privado con control total",
      price: "$19.99/mes",
    },
    {
      name: "Hosting Dedicado",
      description: "Servidor dedicado para empresas grandes",
      price: "Consultar",
    },
    {
      name: "Dominios",
      description: "Registro y gestión de dominios .cl, .com, etc",
      price: "$12.99/año",
    },
  ],

  // Horarios de atención
  hours: {
    monday: "09:00 - 18:00",
    tuesday: "09:00 - 18:00",
    wednesday: "09:00 - 18:00",
    thursday: "09:00 - 18:00",
    friday: "09:00 - 18:00",
    saturday: "10:00 - 14:00",
    sunday: "Cerrado",
  },

  // Preguntas frecuentes
  faq: [
    {
      question: "¿Cuál es la diferencia entre hosting compartido y VPS?",
      answer: "El hosting compartido es más económico pero comparte recursos. El VPS te da un servidor virtual dedicado con más control y mejor rendimiento.",
    },
    {
      question: "¿Cómo puedo migrar mi sitio web?",
      answer: "Ofrecemos migración gratuita. Contacta a nuestro equipo de soporte y te ayudaremos con el proceso.",
    },
    {
      question: "¿Incluye SSL?",
      answer: "Sí, todos nuestros planes incluyen certificado SSL gratuito.",
    },
    {
      question: "¿Hay contrato de larga duración?",
      answer: "No, puedes cancelar en cualquier momento sin penalidades.",
    },
  ],

  // Políticas
  policies: {
    refund: "Garantía de devolución de dinero en 30 días",
    uptime: "99.9% de disponibilidad garantizada",
    support: "Soporte 24/7 por chat, email y teléfono",
    security: "Backups automáticos diarios",
  },

  // Información de la empresa
  about: {
    founded: 2015,
    employees: 50,
    customers: 10000,
    description: "Proveedor de hosting web confiable en Chile",
  },

  // Palabras clave relacionadas con el negocio
  keywords: [
    "hosting",
    "dominio",
    "servidor",
    "sitio web",
    "WordPress",
    "SSL",
    "email corporativo",
    "DNS",
  ],
};

export type Knowledge = typeof knowledge;
