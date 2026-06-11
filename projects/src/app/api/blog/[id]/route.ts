import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      return NextResponse.json({ error: '无效的文章ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('blog_posts')
      .select('id, title, summary, content, created_at')
      .eq('id', postId)
      .maybeSingle();

    if (error) throw new Error(`查询文章失败: ${error.message}`);
    if (!data) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    return NextResponse.json({ post: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    console.error('[Blog API] Detail error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
