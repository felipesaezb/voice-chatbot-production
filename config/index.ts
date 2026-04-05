/**
 * Configuración centralizada del chatbot
 * Importa desde aquí en toda la aplicación
 */

export { company, type Company } from "./company";
export { personality, type Personality } from "./personality";
export { knowledge, type Knowledge } from "./knowledge";
export { generateSystemPrompt, getOffensiveLanguageDetectionPrompt, getIntentDetectionPrompt } from "./prompts";
