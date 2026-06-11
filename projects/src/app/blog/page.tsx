"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BlogPost {
  id: number;
  title: string;
  summary: string;
  created_at: string;
}

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch("/api/blog");
      if (!res.ok) throw new Error("获取文章失败");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/blog", { method: "POST" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "生成失败");
      }
      const data = await res.json();
      setPosts((prev) => [data.post, ...prev]);
    } catch (err) {
      console.error("Failed to generate post:", err);
      alert(err instanceof Error ? err.message : "生成文章失败，请重试");
    } finally {
      setGenerating(false);
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  return (
    <div className="min-h-screen bg-warm-bg">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-warm-bg/80 backdrop-blur-md border-b border-coral/10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-warm-muted hover:text-coral transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-warm-text">恋爱攻略</h1>
        </div>
      </div>

      {/* 页面标题区 */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📖</div>
          <h2 className="text-2xl font-bold text-warm-text mb-2">哄人必修课</h2>
          <p className="text-warm-muted">吵完架不知道怎么办？先来补补课</p>
        </div>
      </div>

      {/* 生成新文章按钮 */}
      <div className="max-w-2xl mx-auto px-4 mb-6">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-gradient-to-r from-coral/10 to-peach/20 border-2 border-dashed border-coral/30 rounded-2xl p-4 text-center transition-all duration-300 hover:border-coral/60 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {generating ? (
            <div className="flex items-center justify-center gap-2 text-coral">
              <div className="w-4 h-4 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
              <span className="font-medium">AI 正在写文章...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-coral">
              <span className="text-xl">✨</span>
              <span className="font-medium">让 AI 再写一篇</span>
            </div>
          )}
        </button>
      </div>

      {/* 文章列表 */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-warm-muted">
            <div className="text-4xl mb-3">📝</div>
            <p>还没有文章，点击上方按钮让 AI 写一篇吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => (
              <button
                key={post.id}
                onClick={() => router.push(`/blog/${post.id}`)}
                className="w-full bg-white rounded-2xl p-5 text-left border-2 border-transparent hover:border-coral/40 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] animate-option-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0 mt-1">💌</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-warm-text text-lg mb-1.5 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-warm-muted text-sm leading-relaxed line-clamp-2">
                      {post.summary}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-warm-muted/60">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warm-muted/40 flex-shrink-0 mt-2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 底部提示 */}
        <div className="mt-8 text-center">
          <p className="text-warm-muted text-sm mb-4">看完了？去实战试试吧！</p>
          <button
            onClick={() => router.push("/")}
            className="bg-coral text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:bg-coral/90 hover:shadow-lg hover:scale-105 active:scale-95"
          >
            开始哄人！
          </button>
        </div>
      </div>
    </div>
  );
}
