import { describe, it, expect, vi } from "vitest";
import { VOICES, BACKGROUND_VIDEOS, BACKGROUND_MUSIC, generateBrainrotScript, generateVideo } from "./videoService";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "Yo, listen up! [EMPHASIS] This is some fire content right here. [PAUSE] Let me break it down for you..."
        }
      }
    ]
  })
}));

describe("Video Service", () => {
  describe("VOICES", () => {
    it("should have at least one voice option", () => {
      expect(VOICES.length).toBeGreaterThan(0);
    });

    it("should have valid voice structure", () => {
      VOICES.forEach(voice => {
        expect(voice).toHaveProperty("id");
        expect(voice).toHaveProperty("name");
        expect(voice).toHaveProperty("description");
        expect(typeof voice.id).toBe("string");
        expect(typeof voice.name).toBe("string");
        expect(typeof voice.description).toBe("string");
      });
    });
  });

  describe("BACKGROUND_VIDEOS", () => {
    it("should have at least one background video option", () => {
      expect(BACKGROUND_VIDEOS.length).toBeGreaterThan(0);
    });

    it("should have valid background video structure", () => {
      BACKGROUND_VIDEOS.forEach(bg => {
        expect(bg).toHaveProperty("id");
        expect(bg).toHaveProperty("name");
        expect(bg).toHaveProperty("videoUrl");
        expect(typeof bg.id).toBe("string");
        expect(typeof bg.name).toBe("string");
        expect(typeof bg.videoUrl).toBe("string");
      });
    });
  });

  describe("BACKGROUND_MUSIC", () => {
    it("should have at least one music option", () => {
      expect(BACKGROUND_MUSIC.length).toBeGreaterThan(0);
    });

    it("should include a 'no music' option", () => {
      const noMusicOption = BACKGROUND_MUSIC.find(m => m.id === "none");
      expect(noMusicOption).toBeDefined();
    });
  });

  describe("generateBrainrotScript", () => {
    it("should generate a brainrot-style script from source text", async () => {
      const sourceText = "Machine learning is a subset of artificial intelligence.";
      const title = "Intro to ML";
      
      const result = await generateBrainrotScript(sourceText, title);
      
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("generateVideo", () => {
    it("should return video URL, thumbnail URL, and duration", async () => {
      const result = await generateVideo({
        script: "Test script content",
        voiceId: "alloy",
        backgroundVideoId: "minecraft",
        backgroundMusicId: "lofi",
      });

      expect(result).toHaveProperty("videoUrl");
      expect(result).toHaveProperty("thumbnailUrl");
      expect(result).toHaveProperty("duration");
      expect(typeof result.videoUrl).toBe("string");
      expect(typeof result.duration).toBe("number");
    });

    it("should use default background if invalid ID provided", async () => {
      const result = await generateVideo({
        script: "Test script",
        voiceId: "alloy",
        backgroundVideoId: "invalid-id",
      });

      expect(result.videoUrl).toBe(BACKGROUND_VIDEOS[0].videoUrl);
    });
  });
});
