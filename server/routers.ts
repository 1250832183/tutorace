import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { v4 as uuidv4 } from "uuid";
import { invokeLLM } from "./_core/llm";

// LiveKit configuration from environment
const LIVEKIT_URL = process.env.LIVEKIT_URL || "";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";

// In-memory lesson plan storage (for MVP)
const lessonPlans = new Map<string, LessonPlan>();

interface Topic {
  id: string;
  title: string;
  content: string;
  subtopics: string[];
  completed: boolean;
}

interface LessonPlan {
  id: string;
  title: string;
  topics: Topic[];
  currentTopicIndex: number;
  sourceType: "topic" | "pdf" | "free";
  createdAt: Date;
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Voice tutoring routes
  voice: router({
    // Create a LiveKit room and return connection token
    createRoom: publicProcedure
      .input(z.object({
        lessonPlanId: z.string().optional(),
      }).optional())
      .mutation(async ({ input }) => {
        const roomName = `tutor-${uuidv4().slice(0, 8)}`;
        const participantName = `user-${uuidv4().slice(0, 8)}`;

        // Create room service client
        const livekitHost = LIVEKIT_URL.replace("wss://", "https://");
        const roomService = new RoomServiceClient(livekitHost, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

        // Prepare metadata
        let metadata: string | undefined;
        if (input?.lessonPlanId) {
          const lessonPlan = lessonPlans.get(input.lessonPlanId);
          if (lessonPlan) {
            metadata = JSON.stringify({
              lesson_plan: {
                id: lessonPlan.id,
                title: lessonPlan.title,
                topics: lessonPlan.topics.map(t => ({
                  id: t.id,
                  title: t.title,
                  content: t.content,
                  subtopics: t.subtopics,
                })),
              },
            });
          }
        }

        // Create the room
        try {
          await roomService.createRoom({
            name: roomName,
            emptyTimeout: 600,
            maxParticipants: 2,
            metadata,
          });
        } catch (e) {
          // Room might already exist
          console.log("Room creation note:", e);
        }

        // Generate token
        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
          identity: participantName,
          ttl: "1h",
        });

        at.addGrant({
          roomJoin: true,
          room: roomName,
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
        });

        const token = await at.toJwt();

        return {
          token,
          wsUrl: LIVEKIT_URL,
          roomName,
        };
      }),

    // Generate lesson plan from topic
    generateLessonPlan: publicProcedure
      .input(z.object({
        topic: z.string().min(1).max(500),
      }))
      .mutation(async ({ input }) => {
        const prompt = `Create a comprehensive lesson plan to teach someone about: "${input.topic}"

Break it down into 5-8 logical topics that would help a student learn progressively from basics to advanced concepts.

Respond in JSON format:
{
  "title": "Overall lesson title",
  "topics": [
    {
      "title": "Topic title",
      "content": "Detailed content to teach (3-5 sentences covering key concepts)",
      "subtopics": ["subtopic1", "subtopic2", "subtopic3"]
    }
  ]
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert educator who creates comprehensive, engaging lesson plans. Always respond with valid JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });

        const messageContent = response.choices[0]?.message?.content;
        const content = typeof messageContent === "string" ? messageContent : "{}";

        const result = JSON.parse(content);

        const lessonPlan: LessonPlan = {
          id: uuidv4(),
          title: result.title || input.topic,
          topics: (result.topics || []).map((t: { title?: string; content?: string; subtopics?: string[] }, i: number) => ({
            id: uuidv4(),
            title: t.title || `Topic ${i + 1}`,
            content: t.content || "",
            subtopics: t.subtopics || [],
            completed: false,
          })),
          currentTopicIndex: 0,
          sourceType: "topic",
          createdAt: new Date(),
        };

        // Store lesson plan
        lessonPlans.set(lessonPlan.id, lessonPlan);

        return lessonPlan;
      }),

    // Get lesson plan by ID
    getLessonPlan: publicProcedure
      .input(z.object({
        id: z.string(),
      }))
      .query(({ input }) => {
        return lessonPlans.get(input.id) || null;
      }),
  }),
});

export type AppRouter = typeof appRouter;
