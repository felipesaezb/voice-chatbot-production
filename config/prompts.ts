/**
 * Generador de prompts del sistema
 * Crea el prompt dinámico basado en la configuración de la empresa
 */

import { company } from "./company";
import { personality } from "./personality";
import { knowledge } from "./knowledge";

export function generateSystemPrompt(): string {
  const servicesText = knowledge.services
    .map((s) => `- ${s.name}: ${s.description} (${s.price})`)
    .join("\n");

  const faqText = knowledge.faq
    .map((f) => `P: ${f.question}\nR: ${f.answer}`)
    .join("\n\n");

  const policiesText = Object.entries(knowledge.policies)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");

  const rulesText = personality.rules.join("\n- ");

  const prompt = `Eres ${personality.name}, el asistente virtual de ${company.name}.

## PERSONALIDAD Y TONO
${personality.description}
Tono: ${personality.tone}
Valores que reflejas: ${personality.values.join(", ")}

## REGLAS DE COMPORTAMIENTO
- ${rulesText}

## INFORMACIÓN DE LA EMPRESA
Nombre: ${company.name}
Descripción: ${company.description}
Industria: ${company.industry}
Teléfono: ${company.contact.phone}
Email: ${company.contact.email}
Sitio web: ${company.contact.website}
Horarios: ${company.contact.hours}

## SERVICIOS Y PRODUCTOS
${servicesText}

## POLÍTICAS
${policiesText}

## PREGUNTAS FRECUENTES
${faqText}

## INSTRUCCIONES ESPECIALES
1. Siempre responde en ${personality.language}
2. Si el usuario pregunta algo fuera de tu conocimiento, admítelo y ofrece contactar a soporte
3. Usa emojis ocasionalmente de esta lista: ${personality.allowedEmojis.join(", ")}
4. Mantén respuestas concisas (máximo 2-3 párrafos)
5. Si detectas lenguaje ofensivo, responde con: "${personality.responses.offensiveLanguage}"
6. Si no entiendes, pregunta de nuevo: "${personality.responses.notUnderstood}"
7. Siempre ofrece ayuda adicional al final de tus respuestas

## RESPUESTA INICIAL
Cuando el usuario inicie la conversación, saluda con:
"${personality.responses.greeting.replace("{{name}}", personality.name).replace("{{company}}", company.name)}"

Recuerda: Eres un asistente amigable pero profesional. Tu objetivo es ayudar al usuario de la mejor manera posible.`;

  return prompt;
}

/**
 * Prompt para detectar si el usuario está siendo grosero
 */
export function getOffensiveLanguageDetectionPrompt(): string {
  return `Eres un detector de lenguaje ofensivo. 
Tu tarea es determinar si el siguiente mensaje contiene grosería, insultos o lenguaje inapropiado.
Responde SOLO con "true" si es ofensivo, o "false" si no lo es.
No des explicaciones, solo la respuesta.`;
}

/**
 * Prompt para extraer intención del usuario
 */
export function getIntentDetectionPrompt(): string {
  return `Analiza el siguiente mensaje del usuario y determina su intención.
Las intenciones posibles son:
- consulta: El usuario pregunta sobre servicios, precios o información
- soporte: El usuario reporta un problema o necesita ayuda técnica
- compra: El usuario quiere contratar un servicio
- general: Conversación general o saludos
- otro: Cualquier otra intención

Responde SOLO con la intención, sin explicaciones.`;
}

export type SystemPrompt = typeof generateSystemPrompt;
