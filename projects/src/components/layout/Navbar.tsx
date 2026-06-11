"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface UserInfo {
  id: number;
  username: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = () => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user || null);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  // Listen for custom auth change event
  useEffect(() => {
    const handleAuthChange = () => {
      checkAuth();
    };
    window.addEventListener("auth-changed", handleAuthChange);
    return () => window.removeEventListener("auth-changed", handleAuthChange);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  // Don't show navbar on login/register pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#FFF8F0]/90 backdrop-blur-md border-b border-coral/10">
      <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
        {/* Left: Logo / Home */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <span className="text-lg">💖</span>
          <span className="font-bold text-red-500 text-sm">哄哄模拟器</span>
        </button>

        {/* Center: Leaderboard link */}
        <button
          onClick={() => router.push("/leaderboard")}
          className="text-warm-muted hover:text-coral text-sm font-medium transition-colors px-2 py-1 rounded-full hover:bg-coral/5"
        >
          🏆 排行榜
        </button>

        {/* Right: Auth buttons */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-20 h-7 bg-warm-muted/10 rounded-full animate-pulse" />
          ) : user ? (
            <>
              <button
                onClick={() => router.push("/profile")}
                className="flex items-center gap-1.5 bg-white/80 rounded-full px-3 py-1 border border-coral/15 hover:border-coral/30 transition-colors"
              >
                <span className="text-sm">👋</span>
                <span className="text-warm-text text-sm font-medium max-w-[80px] truncate">
                  {user.username}
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="text-warm-muted hover:text-coral text-xs transition-colors px-2 py-1"
              >
                退出登录
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/login")}
                className="text-warm-text hover:text-coral text-sm font-medium transition-colors px-3 py-1.5 rounded-full hover:bg-coral/5"
              >
                登录
              </button>
              <button
                onClick={() => router.push("/register")}
                className="bg-coral text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-coral/90 transition-all active:scale-95"
              >
                注册
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
