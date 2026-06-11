'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  score: number;
  scenario: string;
  playedAt: string;
}

interface CurrentUser {
  userId: number;
  username: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lbRes, userRes] = await Promise.all([
          fetch('/api/leaderboard'),
          fetch('/api/auth/me'),
        ]);

        const lbData = await lbRes.json();
        if (lbData.leaderboard) {
          setLeaderboard(lbData.leaderboard);
        }

        const userData = await userRes.json();
        if (userData.user) {
          setCurrentUser({
            userId: userData.user.userId,
            username: userData.user.username,
          });
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getScenarioEmoji = (scenario: string) => {
    const map: Record<string, string> = {
      '忘记纪念日': '💔',
      '深夜不回消息': '📱',
      '被发现和异性聊天': '💬',
      '把对方的猫弄丢了': '🐱',
      '当众让对方没面子': '😳',
    };
    return map[scenario] || '🎮';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF8F0' }}>
      {/* Header */}
      <div className="pt-20 pb-6 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-2xl font-bold" style={{ color: '#3D3029' }}>
            🏆 哄人排行榜
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#9B8E82' }}>
            通关玩家按最高好感度排名
          </p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-4 pb-24">
        <div className="max-w-lg mx-auto">
          {loading ? (
            <div className="flex flex-col items-center py-20">
              <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#FF6B6B', borderTopColor: 'transparent', borderWidth: '3px' }} />
              <p className="mt-4 text-sm" style={{ color: '#9B8E82' }}>加载中...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🎯</p>
              <p className="text-lg font-medium" style={{ color: '#3D3029' }}>
                还没有人上榜
              </p>
              <p className="mt-2 text-sm" style={{ color: '#9B8E82' }}>
                登录后通关即可上榜！
              </p>
              <Link
                href="/"
                className="inline-block mt-6 px-6 py-2.5 rounded-full text-white text-sm font-medium transition-transform hover:scale-105"
                style={{ backgroundColor: '#FF6B6B' }}
              >
                去哄人
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => {
                const isCurrentUser = currentUser && currentUser.userId === entry.userId;
                const badge = getRankBadge(entry.rank);

                return (
                  <div
                    key={entry.rank}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                    style={{
                      backgroundColor: isCurrentUser ? '#FFE4E8' : '#FFFFFF',
                      border: isCurrentUser ? '2px solid #FF6B6B' : '2px solid transparent',
                      boxShadow: isCurrentUser
                        ? '0 2px 12px rgba(255,107,107,0.2)'
                        : '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center flex-shrink-0">
                      {badge ? (
                        <span className="text-xl">{badge}</span>
                      ) : (
                        <span
                          className="text-sm font-bold"
                          style={{ color: '#9B8E82' }}
                        >
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-medium text-sm truncate"
                          style={{ color: isCurrentUser ? '#FF6B6B' : '#3D3029' }}
                        >
                          {entry.username}
                          {isCurrentUser && (
                            <span className="ml-1 text-xs font-normal" style={{ color: '#FF6B6B' }}>
                              (你)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: '#9B8E82' }}>
                          {getScenarioEmoji(entry.scenario)} {entry.scenario}
                        </span>
                        <span className="text-xs" style={{ color: '#C4B8AB' }}>·</span>
                        <span className="text-xs" style={{ color: '#9B8E82' }}>
                          {formatDate(entry.playedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0 text-right">
                      <div
                        className="text-lg font-bold"
                        style={{ color: isCurrentUser ? '#FF6B6B' : '#22C55E' }}
                      >
                        {entry.score}
                      </div>
                      <div className="text-xs" style={{ color: '#9B8E82' }}>好感度</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer hint */}
          {currentUser && leaderboard.length > 0 && (
            <p className="text-center text-xs mt-6" style={{ color: '#9B8E82' }}>
              登录用户通关后自动上榜 · 按最高好感度排名
            </p>
          )}
          {!currentUser && leaderboard.length > 0 && (
            <div className="text-center mt-6">
              <p className="text-xs mb-3" style={{ color: '#9B8E82' }}>
                登录后你的通关成绩才能上榜哦
              </p>
              <Link
                href="/login"
                className="inline-block px-5 py-2 rounded-full text-sm font-medium text-white transition-transform hover:scale-105"
                style={{ backgroundColor: '#FF6B6B' }}
              >
                去登录
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
