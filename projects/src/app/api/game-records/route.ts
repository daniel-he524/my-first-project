import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { getAuthUser } from "@/lib/auth";

// POST: 保存游戏记录
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { scenario, final_score, result } = body;

    if (!scenario || final_score === undefined || !result) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    if (!["通关", "失败"].includes(result)) {
      return NextResponse.json(
        { error: "result 只能是 通关 或 失败" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("game_records")
      .insert({
        user_id: user.userId,
        scenario,
        final_score,
        result,
      })
      .select("id, scenario, final_score, result, played_at")
      .single();

    if (error) {
      console.error("保存游戏记录失败:", error);
      return NextResponse.json(
        { error: "保存游戏记录失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ record: data });
  } catch (err) {
    console.error("游戏记录 API 错误:", err);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

// GET: 获取当前用户的游戏记录
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("game_records")
      .select("id, scenario, final_score, result, played_at")
      .eq("user_id", user.userId)
      .order("played_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("查询游戏记录失败:", error);
      return NextResponse.json(
        { error: "查询游戏记录失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ records: data });
  } catch (err) {
    console.error("游戏记录 API 错误:", err);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
