"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登录失败");
        return;
      }

      // 使用全页刷新确保 cookie 生效，Navbar 能立即读取登录状态
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-changed"));
      }
      window.location.href = "/";
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #FFF8F0 0%, #FFE4E8 50%, #E0F5EE 100%)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block text-5xl mb-3">💝</div>
          <h1 className="text-2xl font-bold" style={{ color: "#3D3029" }}>
            欢迎回来
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9B8E82" }}>
            登录后继续哄人
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl p-6 shadow-lg"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#3D3029" }}>
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入你的用户名"
                required
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2"
                style={{
                  borderColor: "#E8DDD4",
                  color: "#3D3029",
                  background: "#FFFAF5",
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#3D3029" }}>
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入你的密码"
                required
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2"
                style={{
                  borderColor: "#E8DDD4",
                  color: "#3D3029",
                  background: "#FFFAF5",
                }}
              />
            </div>

            {error && (
              <div className="text-sm text-center py-2 px-3 rounded-lg"
                style={{ background: "#FEF2F2", color: "#EF4444" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#FF6B6B" }}
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm" style={{ color: "#9B8E82" }}>
            还没有账号？
            <Link
              href="/register"
              className="font-medium hover:underline"
              style={{ color: "#FF6B6B" }}
            >
              去注册
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm hover:underline"
            style={{ color: "#9B8E82" }}
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
