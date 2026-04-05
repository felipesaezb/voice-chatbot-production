import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { generateSpeech } from "./_core/speechGeneration";
import { NOMAHOST_ASSISTANT_SYSTEM_PROMPT } from "../constants/hotel-info.js";
import * as db from "./db.js";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: router({
    // Procesar mensaje de texto y obtener respuesta del bot
    sendMessage: publicProcedure
      .input(
        z.object({
          message: z.string().min(1),
          conversationHistory: z.array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string(),
            })
          ).optional(),
          sessionId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Verificar si el bot está pausado para esta conversación
        if (input.sessionId) {
          const status = await db.getBotStatus(input.sessionId);
          if (status.botPaused) {
            // Si el bot está pausado, no generar respuesta automática
            return {
              message: "", // Mensaje vacío indica que el bot está pausado
              acceptedDemo: false,
              botPaused: true,
            };
          }
        }
        const messages = [
          {
            role: "system" as const,
            content: NOMAHOST_ASSISTANT_SYSTEM_PROMPT,
          },
          ...(input.conversationHistory || []),
          {
            role: "user" as const,
            content: input.message,
          },
        ];

        const response = await invokeLLM({
          messages,
        });

        const botMessage = response.choices[0]?.message?.content || "Lo siento, no pude generar una respuesta.";

        // Detectar aceptación de demo (palabras clave)
        const demoKeywords = [
          "sí", "si", "me interesa", "ok", "dale", "agendemos", "claro", "perfecto",
          "demo", "llamada", "reunión", "coordinemos", "agenda", "quiero", "acepto"
        ];
        
        const userMessageLower = input.message.toLowerCase();
        const acceptedDemo = demoKeywords.some(keyword => userMessageLower.includes(keyword));

        // Detectar y extraer datos del usuario (nombre, email, teléfono)
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const phoneRegex = /\+?\d{1,4}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}/;
        
        let extractedEmail = null;
        let extractedPhone = null;
        
        if (emailRegex.test(input.message)) {
          extractedEmail = input.message.match(emailRegex)?.[0];
        }
        
        if (phoneRegex.test(input.message)) {
          extractedPhone = input.message.match(phoneRegex)?.[0];
        }

        // Detectar motivo principal de la conversación
        let detectedReason = null;
        const reasonKeywords = {
          reserva_cotizacion: ["reserva", "reservar", "cotización", "cotizar", "precio", "cuánto cuesta"],
          disponibilidad: ["disponibilidad", "disponible", "libre", "ocupado"],
          precios_tarifas: ["precio", "tarifa", "costo", "cuánto"],
          politicas: ["política", "cancelación", "cambio", "reembolso"],
          ubicacion: ["ubicación", "dónde", "cómo llegar", "dirección"],
          pagos_comprobante: ["pago", "comprobante", "factura", "transferencia"],
          checkin_checkout: ["check-in", "check-out", "entrada", "salida", "horario"],
          soporte_problema: ["problema", "ayuda", "soporte", "error", "no funciona"],
        };

        for (const [reason, keywords] of Object.entries(reasonKeywords)) {
          if (keywords.some(keyword => userMessageLower.includes(keyword))) {
            detectedReason = reason;
            break;
          }
        }

        // Detectar si el bot solicita mostrar formulario
        const botMessageStr = typeof botMessage === "string" ? botMessage : "";
        const hasFormRequest = botMessageStr.includes("[FORM:data_capture]");
        let cleanMessage = botMessageStr;
        
        if (hasFormRequest) {
          // Remover el marcador del formulario del mensaje mostrado
          cleanMessage = botMessageStr.replace("[FORM:data_capture]", "").trim();
        }

        return {
          message: cleanMessage,
          acceptedDemo,
          extractedEmail,
          extractedPhone,
          detectedReason,
          hasFormRequest,
        };
      }),

    // Transcribir audio a texto
    transcribeAudio: publicProcedure
      .input(
        z.object({
          audioUrl: z.string().url(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: "es",
        });

        // Verificar si hay un error
        if ('error' in result) {
          throw new Error(result.error);
        }

        return {
          text: result.text,
        };
      }),

    // Subir audio grabado
    uploadAudio: publicProcedure
      .input(
        z.object({
          audioBase64: z.string(),
          mimeType: z.string().default("audio/m4a"),
        })
      )
      .mutation(async ({ input }) => {
        console.log("[SERVER] Recibiendo audio para subir...");
        console.log("[SERVER] Tamaño base64:", input.audioBase64.length, "caracteres");
        console.log("[SERVER] MIME type:", input.mimeType);
        
        const { storagePut } = await import("./storage.js");
        
        // Convertir base64 a buffer
        const buffer = Buffer.from(input.audioBase64, "base64");
        console.log("[SERVER] Tamaño del buffer:", buffer.length, "bytes");
        
        // Generar nombre de archivo único
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `voice-messages/audio-${Date.now()}-${randomSuffix}.m4a`;
        console.log("[SERVER] Subiendo a S3 con key:", fileKey);
        
        // Subir a S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        console.log("[SERVER] Audio subido exitosamente. URL:", url);
        
        return {
          audioUrl: url,
        };
      }),

    // Generar audio a partir de texto
    generateSpeech: publicProcedure
      .input(
        z.object({
          text: z.string().min(1),
          speed: z.enum(["slow", "normal", "fast"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Mapear velocidad a valores numéricos
        const speedMap = {
          slow: 0.75,
          normal: 1.0,
          fast: 1.25,
        };

        const speed = speedMap[input.speed || "normal"];

        const result = await generateSpeech({
          text: input.text,
          voice: "alloy",
          speed,
        });

        return {
          audioUrl: result.url,
        };
      }),

    // Guardar datos del usuario capturados desde el formulario
    saveUserData: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          userData: z.object({
            name: z.string(),
            email: z.string().email(),
            phone: z.string(),
            countryCode: z.string(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        // Obtener la conversacion por sessionId
        const conversation = await db.getConversationBySessionId(input.sessionId);
        if (!conversation) {
          throw new Error("Conversacion no encontrada");
        }

        // Actualizar los datos del usuario en la conversacion
        await db.updateConversationUserData(input.sessionId, {
          userName: input.userData.name,
          userEmail: input.userData.email,
          userPhone: input.userData.phone,
          userCountryCode: input.userData.countryCode,
        });

        return {
          success: true,
          conversationId: conversation.id,
        };
      }),
  }),

  // Endpoints para el panel administrativo
  admin: router({
    // Guardar una conversación y mensaje
    saveConversation: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          message: z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
            messageType: z.enum(["text", "voice"]).optional(),
            audioUrl: z.string().optional(),
            transcription: z.string().optional(),
          }),
          isFirstMessage: z.boolean().optional(),
          acceptedDemo: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Crear o actualizar conversación
        const conversationId = await db.upsertConversation({
          sessionId: input.sessionId,
          firstMessage: input.isFirstMessage ? input.message.content : undefined,
          lastMessage: input.message.content,
        });

        // Si el cliente aceptó la demo, mover a "Oportunidad"
        if (input.acceptedDemo) {
          await db.updateConversationStatus(conversationId, "oportunidad");
        }

        // Guardar el mensaje
        await db.saveMessage({
          conversationId,
          role: input.message.role,
          content: input.message.content,
          messageType: input.message.messageType || "text",
          audioUrl: input.message.audioUrl,
          transcription: input.message.transcription,
        });

        return {
          success: true,
          conversationId,
        };
      }),

    // Obtener todas las conversaciones
    getConversations: publicProcedure.query(async () => {
      const conversations = await db.getAllConversations();
      return conversations;
    }),

    // Obtener mensajes de una conversación específica
    getConversationMessages: publicProcedure
      .input(
        z.object({
          conversationId: z.number(),
        })
      )
      .query(async ({ input }) => {
        const messages = await db.getMessagesByConversationId(input.conversationId);
        return messages;
      }),

    // Actualizar el status de una conversación
    updateConversationStatus: publicProcedure
      .input(
        z.object({
          conversationId: z.number(),
          status: z.enum(["nuevo_lead", "oportunidad", "demo_agendada", "propuesta_enviada", "negociacion", "venta_cerrada"]),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateConversationStatus(input.conversationId, input.status);
        return {
          success: true,
        };
      }),

    // Actualizar el valor monetario de una conversación
    updateConversationDealValue: publicProcedure
      .input(
        z.object({
          conversationId: z.number(),
          dealValue: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateConversationDealValue(input.conversationId, input.dealValue);
        return {
          success: true,
        };
      }),

    // Actualizar las notas internas de una conversación
    updateConversationNotes: publicProcedure
      .input(
        z.object({
          conversationId: z.number(),
          notes: z.string().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateConversationNotes(input.conversationId, input.notes);
        return {
          success: true,
        };
      }),

    // Pausar o reanudar el bot en una conversación
    toggleBotPaused: publicProcedure
      .input(
        z.object({
          conversationId: z.number(),
          botPaused: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        await db.toggleBotPaused(input.conversationId, input.botPaused);
        return {
          success: true,
        };
      }),

    // Guardar datos del usuario capturados desde el formulario
    saveUserData: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          userData: z.object({
            name: z.string(),
            email: z.string().email(),
            phone: z.string(),
            countryCode: z.string(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        // Obtener la conversación por sessionId
        const conversation = await db.getConversationBySessionId(input.sessionId);
        if (!conversation) {
          throw new Error("Conversación no encontrada");
        }

        // Actualizar los datos del usuario en la conversación
        await db.updateConversationUserData(input.sessionId, {
          userName: input.userData.name,
          userEmail: input.userData.email,
          userPhone: input.userData.phone,
          userCountryCode: input.userData.countryCode,
        });

        return {
          success: true,
          conversationId: conversation.id,
        };
      }),

    // Enviar mensaje manual desde el admin
    sendManualMessage: publicProcedure
      .input(
        z.object({
          conversationId: z.number(),
          content: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        // Guardar el mensaje manual
        await db.saveMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: input.content,
          messageType: "text",
        });

        // Actualizar lastMessage de la conversación
        const dbInstance = await db.getDb();
        if (dbInstance) {
          const { conversations } = await import("../drizzle/schema.js");
          const { eq } = await import("drizzle-orm");
          await dbInstance
            .update(conversations)
            .set({ lastMessage: input.content, lastMessageAt: new Date() })
            .where(eq(conversations.id, input.conversationId));
        }

        // Emitir evento WebSocket para enviar el mensaje al cliente en tiempo real
        const io = (global as any).io;
        if (io) {
          io.to(`conversation-${input.conversationId}`).emit("new-manual-message", {
            message: input.content,
          });
          console.log(`[websocket] Mensaje manual enviado a conversación ${input.conversationId}`);
        }

        return {
          success: true,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
