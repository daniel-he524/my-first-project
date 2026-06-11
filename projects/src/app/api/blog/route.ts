import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('blog_posts')
      .select('id, title, summary, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`查询博客列表失败: ${error.message}`);

    return NextResponse.json({ posts: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    console.error('[Blog API] List error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);

    const prompt = `你是一个恋爱沟通技巧专家，风格轻松幽默。请生成一篇关于恋爱沟通技巧的短文。

要求：
1. 主题从以下中随机选一个：如何用幽默化解尴尬、冷战时怎么主动破冰、如何在吵架时保持冷静、怎样表达不满又不伤人、如何给对方安全感、异地恋怎么维持亲密感、怎么处理对方的坏情绪、如何在恋爱中保持自我、怎么让对方感受到被重视、如何优雅地求和
2. 标题要吸引人，有趣味性，15字以内
3. 摘要50字以内，让人想点进去看
4. 正文300-500字，段落分明，可以用粗体标记重点句子（用**包裹）
5. 风格参考：轻松幽默、接地气、像朋友在聊天，偶尔来个反转或比喻
6. 必须包含至少一个具体的行动建议

请严格返回以下JSON格式，不要返回任何其他内容：
{"title":"文章标题","summary":"文章摘要","content":"文章正文"}`;

    const messages = [
      { role: 'user' as const, content: prompt },
    ];
    const llmResult = await llmClient.invoke(messages, { temperature: 1.0 });
    const rawText = llmResult.content?.trim() || '';

    // Extract JSON from the response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM 返回格式无效，无法解析 JSON');
    }

    let parsed: { title?: string; summary?: string; content?: string };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('LLM 返回的 JSON 解析失败');
    }

    if (!parsed.title || !parsed.summary || !parsed.content) {
      throw new Error('LLM 返回的文章缺少必要字段');
    }

    // Insert into database
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title: parsed.title,
        summary: parsed.summary,
        content: parsed.content,
      })
      .select('id, title, summary, created_at')
      .single();

    if (error) throw new Error(`插入文章失败: ${error.message}`);

    return NextResponse.json({ post: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成文章失败';
    console.error('[Blog API] Generate error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
