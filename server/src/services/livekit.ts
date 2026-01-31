import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

// These will be loaded after dotenv.config() is called in index.ts
let LIVEKIT_URL: string;
let LIVEKIT_API_KEY: string;
let LIVEKIT_API_SECRET: string;
let roomService: RoomServiceClient;

export function initLiveKit() {
  LIVEKIT_URL = process.env.LIVEKIT_URL || '';
  LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
  LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
  
  // Extract host from WebSocket URL for REST API
  const livekitHost = LIVEKIT_URL.replace('wss://', 'https://');
  roomService = new RoomServiceClient(livekitHost, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  
  console.log(`LiveKit initialized with URL: ${LIVEKIT_URL}`);
}

export interface RoomConfig {
  roomName: string;
  participantName: string;
  metadata?: string;
}

export async function createRoom(roomName: string, metadata?: string): Promise<void> {
  try {
    await roomService.createRoom({
      name: roomName,
      emptyTimeout: 600, // 10 minutes
      maxParticipants: 2, // User + Agent
      metadata,
    });
    console.log(`Room created: ${roomName}`);
  } catch (error) {
    // Room might already exist, which is fine
    console.log(`Room creation note: ${error}`);
  }
}

export async function generateToken(config: RoomConfig): Promise<string> {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: config.participantName,
    ttl: '1h',
  });

  at.addGrant({
    roomJoin: true,
    room: config.roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();
  return token;
}

export function getWebSocketUrl(): string {
  return LIVEKIT_URL;
}
