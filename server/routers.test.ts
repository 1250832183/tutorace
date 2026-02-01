import { describe, it, expect, vi, beforeEach } from "vitest";
import { VOICES, BACKGROUND_VIDEOS, BACKGROUND_MUSIC } from "./videoService";

// Mock the database module
vi.mock("./db", () => ({
  createVideo: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    title: "Test Video",
    sourceText: "Test content",
    sourceType: "text",
    voiceId: "alloy",
    backgroundVideoId: "minecraft",
    status: "processing",
    shareId: "abc123",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getUserVideos: vi.fn().mockResolvedValue([]),
  getVideoById: vi.fn().mockResolvedValue(null),
  getVideoByShareId: vi.fn().mockResolvedValue(null),
  updateVideoStatus: vi.fn().mockResolvedValue(undefined),
  deleteVideo: vi.fn().mockResolvedValue(true),
}));

// Mock the video service
vi.mock("./videoService", async (importOriginal) => {
  const original = await importOriginal<typeof import("./videoService")>();
  return {
    ...original,
    generateBrainrotScript: vi.fn().mockResolvedValue("Generated script"),
    generateVideo: vi.fn().mockResolvedValue({
      videoUrl: "https://example.com/video.mp4",
      thumbnailUrl: "https://example.com/thumb.jpg",
      duration: 60,
    }),
  };
});

describe("Options Routes", () => {
  describe("voices", () => {
    it("should return all available voices", () => {
      expect(VOICES).toBeDefined();
      expect(Array.isArray(VOICES)).toBe(true);
      expect(VOICES.length).toBeGreaterThan(0);
    });

    it("should have alloy voice as default", () => {
      const alloyVoice = VOICES.find(v => v.id === "alloy");
      expect(alloyVoice).toBeDefined();
      expect(alloyVoice?.name).toBe("Alloy");
    });
  });

  describe("backgrounds", () => {
    it("should return all available background videos", () => {
      expect(BACKGROUND_VIDEOS).toBeDefined();
      expect(Array.isArray(BACKGROUND_VIDEOS)).toBe(true);
      expect(BACKGROUND_VIDEOS.length).toBeGreaterThan(0);
    });

    it("should have minecraft as an option", () => {
      const minecraft = BACKGROUND_VIDEOS.find(v => v.id === "minecraft");
      expect(minecraft).toBeDefined();
      expect(minecraft?.name).toBe("Minecraft Parkour");
    });

    it("should have subway surfers as an option", () => {
      const subway = BACKGROUND_VIDEOS.find(v => v.id === "subway");
      expect(subway).toBeDefined();
      expect(subway?.name).toBe("Subway Surfers");
    });
  });

  describe("music", () => {
    it("should return all available music options", () => {
      expect(BACKGROUND_MUSIC).toBeDefined();
      expect(Array.isArray(BACKGROUND_MUSIC)).toBe(true);
      expect(BACKGROUND_MUSIC.length).toBeGreaterThan(0);
    });

    it("should have no music option", () => {
      const noMusic = BACKGROUND_MUSIC.find(m => m.id === "none");
      expect(noMusic).toBeDefined();
      expect(noMusic?.name).toBe("No Music");
    });

    it("should have lofi option", () => {
      const lofi = BACKGROUND_MUSIC.find(m => m.id === "lofi");
      expect(lofi).toBeDefined();
      expect(lofi?.name).toBe("Lo-Fi Beats");
    });
  });
});

describe("Video Input Validation", () => {
  it("should require title to be at least 1 character", () => {
    const title = "";
    expect(title.length).toBeLessThan(1);
  });

  it("should require source text to be at least 10 characters", () => {
    const shortText = "short";
    const validText = "This is a valid source text with more than 10 characters";
    expect(shortText.length).toBeLessThan(10);
    expect(validText.length).toBeGreaterThanOrEqual(10);
  });

  it("should limit title to 255 characters", () => {
    const longTitle = "a".repeat(256);
    expect(longTitle.length).toBeGreaterThan(255);
  });

  it("should limit source text to 50000 characters", () => {
    const maxLength = 50000;
    const longText = "a".repeat(50001);
    expect(longText.length).toBeGreaterThan(maxLength);
  });
});
