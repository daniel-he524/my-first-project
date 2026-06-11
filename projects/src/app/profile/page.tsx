"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface GameRecord {
  id: number;
  scenario: string;
  final_score: number;
  result: string;
  played_at: string;
}

interface UserInfo {
  id: number;
  username: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch("/api/game-records");
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user, fetchRecords]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 30) return "text-amber-500";
    return "text-red-500";
  };

  const getResultBadge = (result: string) => {
    if (result === "通关") {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-medium px-2.5 py-1 rounded-full">
          ✅ 通关
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-red-50 text-red-500 text-xs font-medium px-2.5 py-1 rounded-full">
        💔 失败
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month}-${day} ${hours}:${minutes}`;
  };

  const stats = {
    total: records.length,
    wins: records.filter((r) => r.result === "通关").length,
    avgScore:
      records.length > 0
        ? Math.round(
            records.reduce((sum, r) => sum + r.final_score, 0) / records.length
          )
        : 0,
    bestScore:
      records.length > 0
        ? Math.max(...records.map((r) => r.final_score))
        : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-warm-muted text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] pt-20 pb-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* 用户信息卡 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-center">
          <div className="w-16 h-16 bg-coral/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">😊</span>
          </div>
          <h1 className="text-xl font-bold text-warm-text">{user?.username}</h1>
          <p className="text-warm-muted text-sm mt-1">哄哄模拟器玩家</p>
        </div>

        {/* 数据统计 */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-warm-text">{stats.total}</div>
            <div className="text-[11px] text-warm-muted">总场次</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-emerald-500">{stats.wins}</div>
            <div className="text-[11px] text-warm-muted">通关</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-amber-500">{stats.avgScore}</div>
            <div className="text-[11px] text-warm-muted">平均分</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-coral">{stats.bestScore}</div>
            <div className="text-[11px] text-warm-muted">最高分</div>
          </div>
        </div>

        {/* 游戏记录列表 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-warm-text text-base">🎮 游戏记录</h2>
          </div>

          {records.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-warm-muted text-sm">还没有游戏记录</p>
              <p className="text-warm-muted text-xs mt-1">
                快去哄哄你的对象吧！
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 bg-coral text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-coral/90 transition-colors"
              >
                开始游戏
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-warm-text text-sm truncate">
                        {record.scenario}
                      </span>
                      {getResultBadge(record.result)}
                    </div>
                    <div className="text-xs text-warm-muted">
                      {formatDate(record.played_at)}
                    </div>
                  </div>
                  <div className="ml-3 text-right">
                    <div
                      className={`font-bold text-lg ${getScoreColor(record.final_score)}`}
                    >
                      {record.final_score}
                    </div>
                    <div className="text-[10px] text-warm-muted">好感度</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex-1 bg-coral text-white py-3 rounded-xl font-medium hover:bg-coral/90 transition-colors"
          >
            🏠 回首页
          </button>
          <button
            onClick={() => router.push("/game?gender=girlfriend&scene=anniversary&voice=gentle_female")}
            className="flex-1 bg-white text-coral border-2 border-coral py-3 rounded-xl font-medium hover:bg-coral/5 transition-colors"
          >
            🎮 再来一局
          </button>
        </div>
      </div>
    </div>
  );
}
