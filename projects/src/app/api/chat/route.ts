import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { buildMessages, validateChatResponse } from "@/lib/prompt-builder";
import { SCENES, type Gender, type ChatOption } from "@/lib/game-config";

interface ChatRequestBody {
  gender: Gender;
  sceneId: string;
  round: number;
  favorability: number;
  messages: Array<{ role: "partner" | "user"; content: string }>;
  userChoice?: string;
  isFirstRound: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { gender, sceneId, round, favorability, messages, userChoice, isFirstRound } = body;

    // 验证必要参数
    if (!gender || !sceneId || round === undefined || favorability === undefined) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const scene = SCENES.find((s) => s.id === sceneId);
    if (!scene) {
      return NextResponse.json(
        { error: "无效的场景ID" },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const llmMessages = buildMessages({
      gender,
      sceneId,
      sceneDescription: scene.description,
      round,
      favorability,
      messages,
      userChoice,
      isFirstRound,
    });

    // 调用 LLM（非流式，因为需要结构化 JSON 输出）
    const response = await client.invoke(llmMessages, {
      model: "doubao-seed-2-0-lite-260215",
      temperature: 0.9,
    });

    // 尝试解析 JSON
    let parsed: unknown;
    const rawContent = response.content.trim();
    console.log("[Chat API] Raw LLM response length:", rawContent.length);
    try {
      // 清理 LLM 输出中的非标准 JSON：去掉数字前的 + 号（如 +18 → 18）
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      let jsonStr = jsonMatch ? jsonMatch[1].trim() : rawContent;
      // 修复 +数字 为 数字（JSON 不支持前导 + 号）
      jsonStr = jsonStr.replace(/:\s*\+(\d+)/g, ": $1");
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.log("[Chat API] First parse failed, trying fallback extraction...");
      // 尝试提取花括号内的内容
      const braceMatch = rawContent.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        try {
          let cleaned = braceMatch[0].replace(/:\s*\+(\d+)/g, ": $1");
          parsed = JSON.parse(cleaned);
          console.log("[Chat API] Fallback brace extraction succeeded");
        } catch {
          console.log("[Chat API] Fallback brace extraction also failed:", parseErr);
          // 重试一次
          try {
            const retryResponse = await client.invoke(llmMessages, {
              model: "doubao-seed-2-0-lite-260215",
              temperature: 0.9,
            });
            const retryContent = retryResponse.content.trim();
            const retryBraceMatch = retryContent.match(/\{[\s\S]*\}/);
            if (retryBraceMatch) {
              let cleaned = retryBraceMatch[0].replace(/:\s*\+(\d+)/g, ": $1");
              parsed = JSON.parse(cleaned);
            } else {
              const retryJsonMatch = retryContent.match(/```(?:json)?\s*([\s\S]*?)```/);
              let retryJsonStr = retryJsonMatch ? retryJsonMatch[1].trim() : retryContent;
              retryJsonStr = retryJsonStr.replace(/:\s*\+(\d+)/g, ": $1");
              parsed = JSON.parse(retryJsonStr);
            }
          } catch (retryErr) {
            console.log("[Chat API] Retry also failed:", retryErr);
            parsed = null;
          }
        }
      } else {
        console.log("[Chat API] No JSON found in response, retrying...");
        try {
          const retryResponse = await client.invoke(llmMessages, {
            model: "doubao-seed-2-0-lite-260215",
            temperature: 0.9,
          });
          const retryContent = retryResponse.content.trim();
          const retryBraceMatch = retryContent.match(/\{[\s\S]*\}/);
          if (retryBraceMatch) {
            let cleaned = retryBraceMatch[0].replace(/:\s*\+(\d+)/g, ": $1");
            parsed = JSON.parse(cleaned);
          } else {
            parsed = null;
          }
        } catch (retryErr) {
          console.log("[Chat API] Retry also failed:", retryErr);
          parsed = null;
        }
      }
    }

    const result = validateChatResponse(parsed);

    // 随机打乱选项顺序
    const shuffledOptions = shuffleArray([...result.options]);

    return NextResponse.json({
      reply: result.reply,
      emotion_score_change: result.emotion_score_change,
      options: shuffledOptions,
    });
  } catch (error) {
    console.error("[Chat API Error]", error);
    return NextResponse.json(
      { error: "对话生成失败，请重试" },
      { status: 500 }
    );
  }
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
