import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, videos, InsertVideo, Video } from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from "nanoid";

let _db: ReturnType<typeof drizzle> | null = null;

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

// ============ User Operations ============

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
      values.role = 'admin';
      updateSet.role = 'admin';
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

// ============ Video Operations ============

export async function createVideo(data: Omit<InsertVideo, "shareId">): Promise<Video> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const shareId = nanoid(16);
  const result = await db.insert(videos).values({
    ...data,
    shareId,
  });

  const insertedId = result[0].insertId;
  const [video] = await db.select().from(videos).where(eq(videos.id, insertedId)).limit(1);
  return video;
}

export async function getVideoById(id: number): Promise<Video | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [video] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return video;
}

export async function getVideoByShareId(shareId: string): Promise<Video | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [video] = await db.select().from(videos).where(eq(videos.shareId, shareId)).limit(1);
  return video;
}

export async function getUserVideos(userId: number): Promise<Video[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(videos).where(eq(videos.userId, userId)).orderBy(desc(videos.createdAt));
}

export async function updateVideoStatus(
  id: number,
  status: "pending" | "processing" | "completed" | "failed",
  updates?: Partial<Pick<Video, "videoUrl" | "thumbnailUrl" | "duration" | "generatedScript" | "errorMessage">>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(videos).set({
    status,
    ...updates,
  }).where(eq(videos.id, id));
}

export async function deleteVideo(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [video] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!video || video.userId !== userId) return false;

  await db.delete(videos).where(eq(videos.id, id));
  return true;
}
