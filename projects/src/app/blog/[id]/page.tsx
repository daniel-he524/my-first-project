"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface BlogPostDetail {
  id: number;
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

export default function BlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/blog/${id}`);
        if (!res.ok) throw new Error("文章不存在");
        const data = await res.json();
        setPost(data.post);
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-warm-bg flex flex-col items-center justify-center px-4">
        <div className="text-5xl mb-4">😿</div>
        <p className="text-warm-muted text-lg mb-4">文章不存在</p>
        <button
          onClick={() => router.push("/blog")}
          className="bg-coral text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:bg-coral/90 hover:scale-105 active:scale-95"
        >
          返回攻略列表
        </button>
      </div>
    );
  }

  // 将内容按段落分割并渲染
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-4" />;

      // 粗体段落
      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        return (
          <h3 key={i} className="text-lg font-bold text-warm-text mt-6 mb-2">
            {trimmed.replace(/\*\*/g, "")}
          </h3>
        );
      }

      // 包含粗体的行
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
      if (parts.length > 1) {
        return (
          <p key={i} className="text-warm-text/90 leading-relaxed mb-2">
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={j} className="font-bold text-warm-text">
                    {part.replace(/\*\*/g, "")}
                  </strong>
                );
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      }

      // 列表项（以 - 开头）
      if (trimmed.startsWith("- ")) {
        return (
          <div key={i} className="flex gap-2 ml-2 mb-1.5">
            <span className="text-coral mt-1 flex-shrink-0">•</span>
            <span className="text-warm-text/90 leading-relaxed">
              {trimmed.slice(2)}
            </span>
          </div>
        );
      }

      // 普通段落
      return (
        <p key={i} className="text-warm-text/90 leading-relaxed mb-2">
          {trimmed}
        </p>
      );
    });
  };

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }

  return (
    <div className="min-h-screen bg-warm-bg">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-warm-bg/80 backdrop-blur-md border-b border-coral/10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/blog")}
            className="text-warm-muted hover:text-coral transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-warm-text">恋爱攻略</h1>
        </div>
      </div>

      {/* 文章内容 */}
      <div
        className={`max-w-2xl mx-auto px-4 py-8 transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* 文章头部 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💌</div>
          <h1 className="text-2xl md:text-3xl font-bold text-warm-text mb-3 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center justify-center gap-3 text-sm text-warm-muted">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatDate(post.created_at)}
            </span>
            <span>·</span>
            <span>哄哄编辑部</span>
          </div>
        </div>

        {/* 文章正文 */}
        <article className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
          {renderContent(post.content)}
        </article>

        {/* 底部CTA */}
        <div className="mt-8 text-center bg-white rounded-2xl p-6">
          <div className="text-3xl mb-3">🎮</div>
          <p className="text-warm-muted mb-4">理论学完了，来实战试试？</p>
          <button
            onClick={() => router.push("/")}
            className="bg-coral text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 hover:bg-coral/90 hover:shadow-lg hover:scale-105 active:scale-95"
          >
            开始哄人！
          </button>
        </div>
      </div>
    </div>
  );
}
