import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { Request, Response } from "express";

// Mock LiveKit SDK
vi.mock("livekit-server-sdk", () => ({
  AccessToken: vi.fn().mockImplementation(() => ({
    addGrant: vi.fn(),
    toJwt: vi.fn().mockResolvedValue("mock-jwt-token"),
  })),
  RoomServiceClient: vi.fn().mockImplementation(() => ({
    createRoom: vi.fn().mockResolvedValue({}),
  })),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            title: "Test Lesson",
            topics: [
              {
                title: "Topic 1",
                content: "Content for topic 1",
                subtopics: ["Subtopic A", "Subtopic B"],
              },
              {
                title: "Topic 2",
                content: "Content for topic 2",
                subtopics: ["Subtopic C"],
              },
            ],
          }),
        },
      },
    ],
  }),
}));

// Mock environment variables
vi.stubEnv("LIVEKIT_URL", "wss://test.livekit.cloud");
vi.stubEnv("LIVEKIT_API_KEY", "test-api-key");
vi.stubEnv("LIVEKIT_API_SECRET", "test-api-secret");

describe("Voice Router", () => {
  const createMockContext = (): TrpcContext => ({
    user: null,
    req: {} as Request,
    res: {
      clearCookie: vi.fn(),
    } as unknown as Response,
  });

  const caller = appRouter.createCaller(createMockContext());

  describe("createRoom", () => {
    it("should create a room and return connection config", async () => {
      const result = await caller.voice.createRoom({});

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("wsUrl");
      expect(result).toHaveProperty("roomName");
      expect(result.token).toBe("mock-jwt-token");
      expect(result.wsUrl).toMatch(/^wss:\/\//);
      expect(result.roomName).toMatch(/^tutor-/);
    });

    it("should create a room with lesson plan ID", async () => {
      const result = await caller.voice.createRoom({ lessonPlanId: "test-plan-id" });

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("wsUrl");
      expect(result).toHaveProperty("roomName");
    });
  });

  describe("generateLessonPlan", () => {
    it("should generate a lesson plan from topic", async () => {
      const result = await caller.voice.generateLessonPlan({ topic: "Machine Learning" });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("topics");
      expect(result.topics.length).toBeGreaterThan(0);
      expect(result.topics[0]).toHaveProperty("title");
      expect(result.topics[0]).toHaveProperty("content");
      expect(result.topics[0]).toHaveProperty("subtopics");
    });

    it("should reject empty topic", async () => {
      await expect(caller.voice.generateLessonPlan({ topic: "" })).rejects.toThrow();
    });
  });

  describe("getLessonPlan", () => {
    it("should return null for non-existent plan", async () => {
      const result = await caller.voice.getLessonPlan({ id: "non-existent-id" });
      expect(result).toBeNull();
    });

    it("should return lesson plan after generation", async () => {
      // First generate a plan
      const generated = await caller.voice.generateLessonPlan({ topic: "Test Topic" });

      // Then retrieve it
      const result = await caller.voice.getLessonPlan({ id: generated.id });

      expect(result).not.toBeNull();
      expect(result?.id).toBe(generated.id);
      expect(result?.title).toBe(generated.title);
    });
  });
});
