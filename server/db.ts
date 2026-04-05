import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, conversations, messages, InsertConversation, InsertMessage } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== Conversaciones y Mensajes =====

/**
 * Crear o actualizar una conversación
 */
export async function upsertConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(conversations)
    .where(eq(conversations.sessionId, data.sessionId))
    .limit(1);

  if (existing.length > 0) {
    // Actualizar conversación existente
    await db
      .update(conversations)
      .set({
        lastMessage: data.lastMessage,
        lastMessageAt: new Date(),
        messageCount: existing[0].messageCount + 1,
      })
      .where(eq(conversations.sessionId, data.sessionId));
    return existing[0].id;
  } else {
    // Crear nueva conversación
    const result = await db.insert(conversations).values({
      ...data,
      messageCount: 1,
    });
    return result[0].insertId;
  }
}

/**
 * Guardar un mensaje en la base de datos
 */
export async function saveMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(data);
  return result[0].insertId;
}

/**
 * Obtener todas las conversaciones ordenadas por último mensaje
 */
export async function getAllConversations() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.lastMessageAt));
}

/**
 * Obtener una conversación por sessionId
 */
export async function getConversationBySessionId(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(conversations)
    .where(eq(conversations.sessionId, sessionId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Obtener todos los mensajes de una conversación
 */
export async function getMessagesByConversationId(conversationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.timestamp);
}

/**
 * Actualizar el status de una conversación
 */
export async function updateConversationStatus(
  conversationId: number,
  status: "nuevo_lead" | "oportunidad" | "demo_agendada" | "propuesta_enviada" | "negociacion" | "venta_cerrada"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(conversations)
    .set({ status })
    .where(eq(conversations.id, conversationId));
}

/**
 * Actualizar el valor monetario de una conversación
 */
export async function updateConversationDealValue(
  conversationId: number,
  dealValue: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(conversations)
    .set({ dealValue })
    .where(eq(conversations.id, conversationId));
}

/**
 * Actualizar las notas internas de una conversación
 */
export async function updateConversationNotes(
  conversationId: number,
  notes: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(conversations)
    .set({ notes })
    .where(eq(conversations.id, conversationId));
}

/**
 * Pausar o reanudar el bot en una conversación
 */
export async function toggleBotPaused(
  conversationId: number,
  botPaused: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(conversations)
    .set({ botPaused })
    .where(eq(conversations.id, conversationId));
}

/**
 * Obtener el estado del bot de una conversación por sessionId
 */
export async function getBotStatus(sessionId: string) {
  const db = await getDb();
  if (!db) return { botPaused: false };

  const result = await db
    .select({ botPaused: conversations.botPaused })
    .from(conversations)
    .where(eq(conversations.sessionId, sessionId))
    .limit(1);

  return result.length > 0 ? result[0] : { botPaused: false };
}

/**
 * Actualizar datos del usuario en una conversación
 */
export async function updateConversationUserData(
  sessionId: string,
  data: {
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    userCountryCode?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(conversations)
    .set(data)
    .where(eq(conversations.sessionId, sessionId));
}

/**
 * Actualizar el motivo principal de una conversación
 */
export async function updateConversationReason(
  sessionId: string,
  mainReason: "reserva_cotizacion" | "disponibilidad" | "precios_tarifas" | "politicas" | "ubicacion" | "pagos_comprobante" | "checkin_checkout" | "soporte_problema" | "otro"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(conversations)
    .set({ mainReason })
    .where(eq(conversations.sessionId, sessionId));
}

/**
 * Cerrar una conversación con resultado final
 */
export async function closeConversation(
  sessionId: string,
  finalResult: "resuelto_bot" | "derivado_humano" | "usuario_no_respondio" | "cerrado_inactividad"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(conversations)
    .set({
      isClosed: true,
      closedAt: new Date(),
      finalResult,
    })
    .where(eq(conversations.sessionId, sessionId));
}

