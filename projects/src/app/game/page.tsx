"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SCENES,
  VOICE_OPTIONS,
  INITIAL_FAVORABILITY,
  WIN_THRESHOLD,
  MIN_FAVORABILITY,
  MAX_ROUNDS,
  type Gender,
  type VoiceId,
  type ChatOption,
  type ChatMessage,
  getEmotionLevel,
} from "@/lib/game-config";
import { useAudio, unlockAudio, AutoPlayAudio } from "@/hooks/useAudio";

// SVG 头像组件
function PartnerAvatar({ gender }: { gender: Gender }) {
  return (
    <div className="w-10 h-10 rounded-full bg-coral-light flex items-center justify-center flex-shrink-0 text-lg">
      {gender === "girlfriend" ? "😤" : "😡"}
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="w-10 h-10 rounded-full bg-mint flex items-center justify-center flex-shrink-0 text-lg">
      🧑
    </div>
  );
}

// 好感度进度条
function FavorabilityBar({
  value,
  scoreChange,
  round,
}: {
  value: number;
  scoreChange: number | null;
  round: number;
}) {
  const percentage = Math.max(
    0,
    Math.min(100, ((value - MIN_FAVORABILITY) / (WIN_THRESHOLD - MIN_FAVORABILITY)) * 100)
  );

  return (
    <div className="bg-white/80 backdrop-blur-sm px-4 py-3 border-b border-warm-bg">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-warm-text">好感度</span>
          {scoreChange !== null && scoreChange !== 0 && (
            <span
              className={`text-sm font-bold animate-score-up ${
                scoreChange > 0 ? "text-mint-dark" : "text-danger"
              }`}
            >
              {scoreChange > 0 ? `+${scoreChange}` : scoreChange}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-warm-muted">{getEmotionLevel(value)}</span>
          <span className="text-xs font-medium text-warm-muted">
            第 {round}/{MAX_ROUNDS} 轮
          </span>
        </div>
      </div>
      <div className="h-2.5 bg-warm-bg rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            value >= 60
              ? "bg-mint-dark"
              : value >= 30
                ? "bg-amber-400"
                : "bg-coral"
          }`}
          style={{ width: `${percentage}%` }}
        />
        {/* 胜利线 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-coral/40"
          style={{
            left: `${((WIN_THRESHOLD - MIN_FAVORABILITY) / (100 - MIN_FAVORABILITY)) * 100}%`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-warm-muted">{value} 分</span>
        <span className="text-[10px] text-warm-muted">80 分通关</span>
      </div>
    </div>
  );
}

// 聊天气泡
function ChatBubble({
  message,
  gender,
  isPlaying,
}: {
  message: ChatMessage;
  gender: Gender;
  isPlaying?: boolean;
}) {
  const isPartner = message.role === "partner";

  return (
    <div
      className={`flex gap-2 animate-bubble-in ${
        isPartner ? "justify-start" : "justify-end"
      }`}
    >
      {isPartner && <PartnerAvatar gender={gender} />}
      <div className="max-w-[75%] relative">
        <div
          className={`rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
            isPartner
              ? "bg-coral-light text-warm-text rounded-tl-sm"
              : "bg-mint text-warm-text rounded-tr-sm"
          }`}
        >
          {message.content}
          {/* 正在播放语音时显示小音量动画 */}
          {isPartner && isPlaying && (
            <span className="inline-flex items-center ml-1.5 gap-0.5 align-middle">
              <span className="inline-block w-0.5 h-2 bg-coral/60 rounded-full animate-sound-1" />
              <span className="inline-block w-0.5 h-3 bg-coral/60 rounded-full animate-sound-2" />
              <span className="inline-block w-0.5 h-2 bg-coral/60 rounded-full animate-sound-3" />
            </span>
          )}
        </div>
        {/* 好感度变化提示 */}
        {message.scoreChange !== undefined && message.scoreChange !== 0 && (
          <div
            className={`text-xs font-bold mt-1 ${
              message.scoreChange > 0 ? "text-mint-dark" : "text-danger"
            } ${message.scoreChange < 0 ? "animate-shake" : ""}`}
          >
            {message.scoreChange > 0
              ? `💕 好感度 +${message.scoreChange}`
              : `💔 好感度 ${message.scoreChange}`}
          </div>
        )}
      </div>
      {!isPartner && <UserAvatar />}
    </div>
  );
}

// 选项卡片
function OptionCard({
  option,
  index,
  onSelect,
  disabled,
}: {
  option: ChatOption;
  index: number;
  onSelect: (option: ChatOption) => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onSelect(option)}
      disabled={disabled}
      className="w-full text-left bg-white rounded-xl px-4 py-3 border border-transparent hover:border-coral hover:shadow-md transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none animate-option-in text-[14px] leading-relaxed text-warm-text"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {option.text}
    </button>
  );
}

// 结果页面
function GameResult({
  won,
  favorability,
  sceneTitle,
  partnerMessage,
  audioUrl,
  gender,
  sceneId,
}: {
  won: boolean;
  favorability: number;
  sceneTitle: string;
  partnerMessage: string;
  audioUrl: string | null;
  gender: Gender;
  sceneId: string;
}) {
  const router = useRouter();
  const { play, isPlaying, currentUrl: resultCurrentUrl, handleEnded, handleError, handlePlay } = useAudio();
  const [toast, setToast] = useState<string | null>(null);

  // 保存游戏记录
  useEffect(() => {
    const saveRecord = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();

        if (meData.user) {
          // 已登录 - 保存记录
          await fetch("/api/game-records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scenario: sceneTitle,
              final_score: favorability,
              result: won ? "通关" : "失败",
            }),
          });
          setToast("您的游戏记录已保存");
        } else {
          // 未登录 - 提示
          setToast("登录后可保存你的游戏记录");
        }
      } catch {
        // 静默失败，不影响游戏体验
      }
    };
    saveRecord();
  }, [won, favorability, sceneTitle]);

  // 自动隐藏 toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 使用 useState 预生成粒子位置，避免渲染期 Math.random
  const confettiParticles = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      left: (i * 37 + 13) % 100,
      top: 60 + (i * 23 + 7) % 40,
      delay: (i * 11 + 3) % 20 / 10,
      duration: 1 + (i * 17 + 5) % 20 / 10,
    }))
  )[0];

  const heartbreakParticles = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      left: 20 + (i * 31 + 7) % 60,
      top: 30 + (i * 19 + 3) % 40,
      delay: (i * 7 + 2) % 10 / 10,
    }))
  )[0];

  useEffect(() => {
    if (audioUrl) {
      play(audioUrl);
    }
  }, [audioUrl, play]);

  const handleShare = async () => {
    const domain = process.env.NEXT_PUBLIC_COZE_PROJECT_DOMAIN_DEFAULT || window.location.host;
    const shareUrl = `${window.location.protocol}//${domain}?scene=${sceneId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("链接已复制！发给朋友试试吧~");
    } catch {
      // fallback
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("链接已复制！发给朋友试试吧~");
    }
  };

  const handleRetry = () => {
    router.push(`/?scene=${sceneId}`);
  };

  return (
    <div className="fixed inset-0 bg-warm-bg z-50 flex items-center justify-center px-4">
      {/* 背景动画 */}
      {won ? (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confettiParticles.map((p, i) => (
            <div
              key={i}
              className="absolute animate-confetti text-2xl"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            >
              {["💖", "✨", "🎉", "🌸", "💝", "🎊"][i % 6]}
            </div>
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {heartbreakParticles.map((p, i) => (
            <div
              key={i}
              className="absolute animate-heart-break text-2xl"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
              }}
            >
              💔
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 text-center max-w-sm w-full animate-slide-up">
        {/* 状态图标 */}
        <div className="text-6xl mb-4 animate-float">
          {won ? "😍" : "😢"}
        </div>

        <h2 className="text-2xl font-bold text-warm-text mb-2">
          {won ? "哄好啦！" : "哄失败了..."}
        </h2>

        <p className="text-warm-muted text-sm mb-4">
          场景：{sceneTitle} | 最终好感度：{favorability} 分
        </p>

        {/* 对方最后一句话 */}
        <div className="bg-white rounded-2xl p-4 mb-6 relative">
          <div className="flex items-start gap-3">
            <PartnerAvatar gender={gender} />
            <div className="flex-1">
              <div className="text-[15px] text-warm-text leading-relaxed">
                {partnerMessage}
                {isPlaying && (
                  <span className="inline-flex items-center ml-1.5 gap-0.5 align-middle">
                    <span className="inline-block w-0.5 h-2 bg-coral/60 rounded-full animate-sound-1" />
                    <span className="inline-block w-0.5 h-3 bg-coral/60 rounded-full animate-sound-2" />
                    <span className="inline-block w-0.5 h-2 bg-coral/60 rounded-full animate-sound-3" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 自动播放结果语音 */}
        <AutoPlayAudio
          url={resultCurrentUrl}
          onEnded={handleEnded}
          onError={handleError}
          onPlay={handlePlay}
        />

        {/* 操作按钮 */}
        <div className="space-y-3">
          {won && (
            <button
              onClick={handleShare}
              className="w-full bg-coral text-white font-bold py-3.5 rounded-xl text-base transition-all duration-300 hover:bg-coral/90 hover:shadow-lg hover:scale-[1.02] active:scale-95"
            >
              分享给朋友试试
            </button>
          )}
          <button
            onClick={handleRetry}
            className="w-full bg-white text-coral font-bold py-3.5 rounded-xl text-base border-2 border-coral transition-all duration-300 hover:bg-coral-light hover:scale-[1.02] active:scale-95"
          >
            {won ? "换个场景试试" : "再试一次"}
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full text-warm-muted hover:text-coral transition-colors text-sm py-2"
          >
            返回首页
          </button>
        </div>

        {/* Toast 提示 */}
        {toast && (
          <div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-warm-text text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up"
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

// 游戏主逻辑
function GamePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { stop: stopAudio, isPlaying, currentUrl, audioError, handleEnded, handleError, handlePlay, play: playAudio } = useAudio();

  const gender = searchParams.get("gender") as Gender;
  const sceneId = searchParams.get("scene");
  const voiceId = searchParams.get("voice") as VoiceId;

  const scene = SCENES.find((s) => s.id === sceneId);

  const [favorability, setFavorability] = useState(INITIAL_FAVORABILITY);
  const [round, setRound] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentOptions, setCurrentOptions] = useState<ChatOption[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scoreChange, setScoreChange] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [resultMessage, setResultMessage] = useState("");
  const [resultAudioUrl, setResultAudioUrl] = useState<string | null>(null);
  const [typingReply, setTypingReply] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const optionContainerRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false); // 防止 React Strict Mode 双次触发

  // 在游戏页面也尝试解锁音频（用户可能直接打开了游戏链接）
  useEffect(() => {
    const handleUserGesture = () => {
      unlockAudio();
    };
    document.addEventListener("touchstart", handleUserGesture, { once: true });
    document.addEventListener("click", handleUserGesture, { once: true });
    return () => {
      document.removeEventListener("touchstart", handleUserGesture);
      document.removeEventListener("click", handleUserGesture);
    };
  }, []);

  // 验证参数
  useEffect(() => {
    if (!gender || !sceneId || !voiceId || !scene) {
      router.push("/");
    }
  }, [gender, sceneId, voiceId, scene, router]);

  // 滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingReply]);

  // 调用 LLM 生成对话
  const fetchChat = useCallback(
    async (userChoice?: string, isFirstRound = false) => {
      setIsLoading(true);
      setScoreChange(null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gender,
            sceneId,
            round: isFirstRound ? 1 : round,
            favorability,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            userChoice,
            isFirstRound,
          }),
        });

        if (!res.ok) {
          throw new Error("请求失败");
        }

        const data = await res.json();

        // 模拟打字效果
        setTypingReply("");
        const fullReply = data.reply as string;
        let displayed = "";
        for (let i = 0; i < fullReply.length; i++) {
          displayed += fullReply[i];
          setTypingReply(displayed);
          await new Promise((r) => setTimeout(r, 30));
        }

        // 添加对方消息
        const partnerMessage: ChatMessage = {
          role: "partner",
          content: fullReply,
        };

        // 如果不是第一轮，显示好感度变化
        if (!isFirstRound && userChoice) {
          // 计算用户选择的好感度变化
          const chosenOption = currentOptions?.find(
            (o) => o.text === userChoice
          );
          if (chosenOption) {
            partnerMessage.scoreChange = chosenOption.score_change;
            const newFav = Math.max(
              MIN_FAVORABILITY,
              Math.min(100, favorability + chosenOption.score_change)
            );
            setFavorability(newFav);
            setScoreChange(chosenOption.score_change);

            // 检查是否游戏结束
            if (newFav >= WIN_THRESHOLD) {
              setGameStatus("won");
              setTypingReply(null);
              setMessages((prev) => [...prev, partnerMessage]);
              setCurrentOptions(null);
              await generateResultMessage(true, newFav);
              return;
            }
            if (newFav <= MIN_FAVORABILITY) {
              setGameStatus("lost");
              setTypingReply(null);
              setMessages((prev) => [...prev, partnerMessage]);
              setCurrentOptions(null);
              await generateResultMessage(false, newFav);
              return;
            }
          }
        }

        setTypingReply(null);
        setMessages((prev) => [...prev, partnerMessage]);

        // 检查是否达到最大轮数
        const nextRound = isFirstRound ? 1 : round + 1;
        if (!isFirstRound) {
          setRound(nextRound);
        }

        if (nextRound > MAX_ROUNDS && favorability < WIN_THRESHOLD) {
          setGameStatus("lost");
          setCurrentOptions(null);
          await generateResultMessage(false, favorability);
          return;
        }

        // 设置新选项
        setCurrentOptions(data.options);

        // 生成 TTS 语音
        generateTTS(fullReply);
      } catch (error) {
        console.error("Chat fetch error:", error);
        setTypingReply(null);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    },
    [gender, sceneId, round, favorability, messages, currentOptions]
  );

  // 生成 TTS 语音
  const generateTTS = async (text: string) => {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      });

      if (res.ok) {
        const data = await res.json();
        // 设置音频 URL，由 AutoPlayAudio 组件自动播放
        playAudio(data.audioUri);
      }
    } catch (error) {
      console.error("TTS error:", error);
    }
  };

  // 生成结果消息
  const generateResultMessage = async (won: boolean, fav: number) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender,
          sceneId,
          round: round,
          favorability: fav,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          userChoice: won
            ? "（游戏胜利！请说一句甜蜜的话）"
            : "（游戏失败！请说一句绝情的话）",
          isFirstRound: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResultMessage(data.reply);

        // 生成结果语音
        try {
          const ttsRes = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: data.reply, voiceId }),
          });
          if (ttsRes.ok) {
            const ttsData = await ttsRes.json();
            setResultAudioUrl(ttsData.audioUri);
          }
        } catch {
          // TTS 失败不影响结果展示
        }
      }
    } catch {
      setResultMessage(won ? "哼，算你厉害~" : "我们分手吧。");
    }
  };

  // 用户选择选项
  const handleOptionSelect = async (option: ChatOption) => {
    if (isLoading) return;

    // 添加用户消息
    const userMessage: ChatMessage = {
      role: "user",
      content: option.text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setCurrentOptions(null);
    stopAudio();

    // 调用 API 获取下一轮
    await fetchChat(option.text, false);
  };

  // 首次加载获取第一轮对话（用 ref 防止 Strict Mode 双次触发）
  useEffect(() => {
    if (gender && sceneId && voiceId && scene && !hasStartedRef.current) {
      hasStartedRef.current = true;
      fetchChat(undefined, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, sceneId, voiceId, scene]);

  if (!gender || !sceneId || !voiceId || !scene) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-warm-bg max-w-lg mx-auto relative">
      {/* 顶部状态栏 */}
      <FavorabilityBar value={favorability} scoreChange={scoreChange} round={round} />

      {/* 聊天区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chat-scroll">
        {/* 场景提示 */}
        <div className="text-center text-xs text-warm-muted bg-warm-bg/80 py-2 px-3 rounded-full inline-block mx-auto">
          🎬 {scene.title} — {scene.description}
        </div>

        {/* 消息列表 */}
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            message={msg}
            gender={gender}
            isPlaying={
              msg.role === "partner" && i === messages.length - 1 && !typingReply
                ? isPlaying
                : false
            }
          />
        ))}

        {/* 正在输入 */}
        {typingReply && (
          <div className="flex gap-2 justify-start animate-bubble-in">
            <PartnerAvatar gender={gender} />
            <div className="max-w-[75%] bg-coral-light text-warm-text rounded-2xl rounded-tl-sm px-4 py-2.5 text-[15px] leading-relaxed">
              {typingReply}
              <span className="inline-block w-0.5 h-4 bg-coral/50 ml-0.5 animate-pulse" />
            </div>
          </div>
        )}

        {/* 加载中 */}
        {isLoading && !typingReply && (
          <div className="flex gap-2 justify-start animate-bubble-in">
            <PartnerAvatar gender={gender} />
            <div className="bg-coral-light rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-coral/40 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-coral/40 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-2 h-2 bg-coral/40 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 选项区域 */}
      {currentOptions && gameStatus === "playing" && (
        <div
          ref={optionContainerRef}
          className="bg-white/90 backdrop-blur-sm border-t border-warm-bg px-4 py-3 space-y-2 max-h-[45vh] overflow-y-auto"
        >
          <div className="text-xs text-warm-muted mb-1 text-center">
            选择你的回应 ↓
          </div>
          {currentOptions.map((option, i) => (
            <OptionCard
              key={`${round}-${i}`}
              option={option}
              index={i}
              onSelect={handleOptionSelect}
              disabled={isLoading}
            />
          ))}
        </div>
      )}

      {/* 游戏结果 */}
      {gameStatus !== "playing" && resultMessage && (
        <GameResult
          won={gameStatus === "won"}
          favorability={favorability}
          sceneTitle={scene.title}
          partnerMessage={resultMessage}
          audioUrl={resultAudioUrl}
          gender={gender}
          sceneId={sceneId}
        />
      )}

      {/* 自动播放音频组件（隐藏，通过 autoPlay 属性自动播放） */}
      <AutoPlayAudio
        url={currentUrl}
        onEnded={handleEnded}
        onError={handleError}
        onPlay={handlePlay}
      />
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-warm-bg">
          <div className="text-warm-muted">加载中...</div>
        </div>
      }
    >
      <GamePageContent />
    </Suspense>
  );
}
