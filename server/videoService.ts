import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Available voices for TTS
export const VOICES = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "echo", name: "Echo", description: "Warm and engaging" },
  { id: "fable", name: "Fable", description: "British and expressive" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "nova", name: "Nova", description: "Friendly and upbeat" },
  { id: "shimmer", name: "Shimmer", description: "Clear and gentle" },
];

// Available background videos (gaming footage)
export const BACKGROUND_VIDEOS = [
  { id: "minecraft", name: "Minecraft Parkour", thumbnail: "/backgrounds/minecraft.jpg", videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
  { id: "subway", name: "Subway Surfers", thumbnail: "/backgrounds/subway.jpg", videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
  { id: "gta", name: "GTA Driving", thumbnail: "/backgrounds/gta.jpg", videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
  { id: "satisfying", name: "Satisfying Clips", thumbnail: "/backgrounds/satisfying.jpg", videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" },
];

// Available background music
export const BACKGROUND_MUSIC = [
  { id: "none", name: "No Music" },
  { id: "lofi", name: "Lo-Fi Beats" },
  { id: "phonk", name: "Phonk" },
  { id: "chill", name: "Chill Vibes" },
];

/**
 * Transform study content into brainrot-style script
 */
export async function generateBrainrotScript(sourceText: string, title: string): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a Gen-Z content creator who transforms boring study material into engaging, TikTok-style "brainrot" content. Your job is to:

1. Keep the educational content accurate but make it entertaining
2. Use casual, conversational language that Gen-Z would use
3. Add hooks and attention-grabbing phrases
4. Break complex concepts into bite-sized, memorable chunks
5. Use analogies and references that resonate with young people
6. Keep each segment short (2-3 sentences max)
7. Add emphasis markers like [PAUSE], [EMPHASIS], [SPEED UP] for the TTS

Output format: Just the script text with markers, no explanations. Each segment on a new line.`
      },
      {
        role: "user",
        content: `Transform this study material into an engaging brainrot-style script:

Title: ${title}

Content:
${sourceText}`
      }
    ],
  });

  const content = response.choices[0]?.message?.content;
  return typeof content === 'string' ? content : sourceText;
}

/**
 * Extract text from PDF (simplified - in production would use proper PDF parsing)
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  // For MVP, we'll use a simple approach
  // In production, you'd use pdf-parse or similar library
  const text = pdfBuffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');
  return text.slice(0, 10000); // Limit to first 10k chars
}

/**
 * Generate a placeholder video URL
 * In production, this would integrate with a video generation service
 */
export async function generateVideo(params: {
  script: string;
  voiceId: string;
  backgroundVideoId: string;
  backgroundMusicId?: string;
}): Promise<{ videoUrl: string; thumbnailUrl: string; duration: number }> {
  // For MVP, we return a sample video
  // In production, this would:
  // 1. Generate TTS audio from script
  // 2. Combine with background video
  // 3. Add captions
  // 4. Add background music
  // 5. Upload to S3

  const background = BACKGROUND_VIDEOS.find(v => v.id === params.backgroundVideoId) || BACKGROUND_VIDEOS[0];
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    videoUrl: background.videoUrl,
    thumbnailUrl: background.thumbnail,
    duration: 60, // placeholder duration
  };
}
