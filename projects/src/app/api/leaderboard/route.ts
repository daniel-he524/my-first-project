import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Query top 20 highest scores with user info
    const { data: records, error } = await supabase
      .from('game_records')
      .select(`
        id,
        scenario,
        final_score,
        result,
        played_at,
        user_id,
        users!inner (
          id,
          username
        )
      `)
      .eq('result', '通关')
      .order('final_score', { ascending: false })
      .order('played_at', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Leaderboard query error:', error);
      return NextResponse.json(
        { error: '获取排行榜失败' },
        { status: 500 }
      );
    }

    // Format leaderboard entries with rank
    const leaderboard = (records || []).map((record: Record<string, unknown>, index: number) => {
      const user = record.users as Record<string, unknown>;
      return {
        rank: index + 1,
        userId: user.id,
        username: user.username,
        score: record.final_score,
        scenario: record.scenario,
        playedAt: record.played_at,
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: '获取排行榜失败' },
      { status: 500 }
    );
  }
}
