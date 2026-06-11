"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (password.length < 6) {
      setError("密码长度至少6个字符");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "注册失败");
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
      style={{ background: "linear-gradient(135deg, #FFF8F0 0%, #E0F5EE 50%, #FFE4E8 100%)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block text-5xl mb-3">🎮</div>
          <h1 className="text-2xl font-bold" style={{ color: "#3D3029" }}>
            加入哄哄模拟器
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9B8E82" }}>
            注册账号，开始你的哄人之旅
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
                placeholder="给自己取个名字"
                required
                minLength={2}
                maxLength={50}
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
                placeholder="至少6个字符"
                required
                minLength={6}
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
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再输入一次密码"
                required
                minLength={6}
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
              style={{ background: "#22C55E" }}
            >
              {loading ? "注册中..." : "注册"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm" style={{ color: "#9B8E82" }}>
            已有账号？
            <Link
              href="/login"
              className="font-medium hover:underline"
              style={{ color: "#FF6B6B" }}
            >
              去登录
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
