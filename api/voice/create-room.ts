import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { v4 as uuidv4 } from 'uuid';

const LIVEKIT_URL = process.env.LIVEKIT_URL || '';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lessonPlanId } = req.body || {};

    const roomName = `tutor-${uuidv4().slice(0, 8)}`;
    const participantName = `user-${uuidv4().slice(0, 8)}`;

    // Create room service client
    const livekitHost = LIVEKIT_URL.replace('wss://', 'https://');
    const roomService = new RoomServiceClient(livekitHost, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    // Create the room
    try {
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 600,
        maxParticipants: 2,
      });
    } catch (e) {
      // Room might already exist
      console.log('Room creation note:', e);
    }

    // Generate token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      ttl: '1h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return res.status(200).json({
      token,
      wsUrl: LIVEKIT_URL,
      roomName,
    });
  } catch (error) {
    console.error('Room creation error:', error);
    return res.status(500).json({ error: 'Failed to create voice room' });
  }
}
