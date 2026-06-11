import { NextRequest, NextResponse } from "next/server";
import { TTSClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { VOICE_OPTIONS, type VoiceId } from "@/lib/game-config";

interface TTSRequestBody {
  text: string;
  voiceId: VoiceId;
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequestBody = await request.json();
    const { text, voiceId } = body;

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const voiceOption = VOICE_OPTIONS.find((v) => v.id === voiceId);
    if (!voiceOption) {
      return NextResponse.json(
        { error: "无效的声音ID" },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new TTSClient(config, customHeaders);

    const response = await client.synthesize({
      uid: `game_user_${Date.now()}`,
      text,
      speaker: voiceOption.speaker,
      audioFormat: "mp3",
      sampleRate: 24000,
    });

    return NextResponse.json({
      audioUri: response.audioUri,
      audioSize: response.audioSize,
    });
  } catch (error) {
    console.error("[TTS API Error]", error);
    return NextResponse.json(
      { error: "语音生成失败" },
      { status: 500 }
    );
  }
}
