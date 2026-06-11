"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SCENES, VOICE_OPTIONS, type Gender, type VoiceId } from "@/lib/game-config";
import { unlockAudio } from "@/hooks/useAudio";

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState<"gender" | "scene" | "voice">("gender");
  const [gender, setGender] = useState<Gender | null>(null);
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<VoiceId | null>(null);

  const handleGenderSelect = (g: Gender) => {
    setGender(g);
    setStep("scene");
  };

  const handleSceneSelect = (id: string) => {
    setSceneId(id);
    setStep("voice");
  };

  const handleVoiceSelect = (id: VoiceId) => {
    setVoiceId(id);
  };

  const handleStart = () => {
    if (gender && sceneId && voiceId) {
      // 在用户手势中解锁音频，确保后续 TTS 能自动播放
      unlockAudio();
      router.push(`/game?gender=${gender}&scene=${sceneId}&voice=${voiceId}`);
    }
  };

  const filteredVoices = VOICE_OPTIONS.filter(
    (v) => gender && v.gender.includes(gender)
  );

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col items-center justify-center px-4 py-8 relative">
      {/* 标题区 */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-warm-text mb-3">
          哄哄模拟器
        </h1>
        <p className="text-warm-muted text-lg">
          AI 扮演你正在生气的对象，10 轮内把 TA 哄好！
        </p>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center gap-2 mb-8">
        {(["gender", "scene", "voice"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step === s
                  ? "bg-coral text-white scale-110"
                  : i < ["gender", "scene", "voice"].indexOf(step)
                    ? "bg-coral/80 text-white"
                    : "bg-coral/20 text-warm-muted"
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && (
              <div
                className={`w-8 h-0.5 transition-all duration-300 ${
                  i < ["gender", "scene", "voice"].indexOf(step)
                    ? "bg-coral/80"
                    : "bg-coral/20"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* 选择区域 */}
      <div className="w-full max-w-lg">
        {/* 第一步：选择性别 */}
        {step === "gender" && (
          <div className="animate-slide-up">
            <h2 className="text-xl font-bold text-warm-text text-center mb-6">
              你的对象是？
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleGenderSelect("girlfriend")}
                className="group relative bg-white rounded-2xl p-6 border-2 border-transparent hover:border-coral transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <div className="text-5xl mb-3 animate-float">💅</div>
                <div className="font-bold text-warm-text text-lg">女朋友</div>
                <div className="text-warm-muted text-sm mt-1">温柔又爱生气的她</div>
              </button>
              <button
                onClick={() => handleGenderSelect("boyfriend")}
                className="group relative bg-white rounded-2xl p-6 border-2 border-transparent hover:border-coral transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <div className="text-5xl mb-3 animate-float" style={{ animationDelay: "0.5s" }}>🎮</div>
                <div className="font-bold text-warm-text text-lg">男朋友</div>
                <div className="text-warm-muted text-sm mt-1">嘴硬心软的他</div>
              </button>
            </div>
          </div>
        )}

        {/* 第二步：选择场景 */}
        {step === "scene" && (
          <div className="animate-slide-up">
            <h2 className="text-xl font-bold text-warm-text text-center mb-6">
              你犯了什么错？
            </h2>
            <div className="space-y-3">
              {SCENES.map((scene, i) => (
                <button
                  key={scene.id}
                  onClick={() => handleSceneSelect(scene.id)}
                  className="w-full bg-white rounded-xl p-4 text-left border-2 border-transparent hover:border-coral transition-all duration-300 hover:shadow-md active:scale-[0.98] animate-option-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{scene.emoji}</span>
                    <div>
                      <div className="font-bold text-warm-text">{scene.title}</div>
                      <div className="text-warm-muted text-sm">{scene.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setStep("gender");
                setGender(null);
              }}
              className="mt-4 text-warm-muted hover:text-coral transition-colors text-sm"
            >
              ← 返回上一步
            </button>
          </div>
        )}

        {/* 第三步：选择声音 */}
        {step === "voice" && (
          <div className="animate-slide-up">
            <h2 className="text-xl font-bold text-warm-text text-center mb-6">
              TA 的声音类型？
            </h2>
            <div className="space-y-3">
              {filteredVoices.map((voice, i) => (
                <button
                  key={voice.id}
                  onClick={() => handleVoiceSelect(voice.id)}
                  className={`w-full rounded-xl p-4 text-left border-2 transition-all duration-300 hover:shadow-md active:scale-[0.98] animate-option-in ${
                    voiceId === voice.id
                      ? "border-coral bg-coral-light shadow-md"
                      : "border-transparent bg-white hover:border-coral"
                  }`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {voice.id.includes("cute") ? "🎀" : voice.id.includes("dominant") ? "👑" : voice.id.includes("deep") ? "🎤" : voice.id.includes("gentle_female") ? "🌸" : "🌤️"}
                    </span>
                    <div>
                      <div className="font-bold text-warm-text">{voice.label}</div>
                      <div className="text-warm-muted text-sm">{voice.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {voiceId && (
                <button
                  onClick={handleStart}
                  className="w-full bg-coral text-white font-bold py-4 rounded-xl text-lg transition-all duration-300 hover:bg-coral/90 hover:shadow-lg hover:scale-[1.02] active:scale-95 animate-option-in"
                >
                  开始哄人！
                </button>
              )}
              <button
                onClick={() => {
                  setStep("scene");
                  setSceneId(null);
                  setVoiceId(null);
                }}
                className="w-full text-warm-muted hover:text-coral transition-colors text-sm"
              >
                ← 返回上一步
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 快捷入口 */}
      <div className="mt-6 flex items-center gap-3 animate-fade-in">
        <button
          onClick={() => router.push("/blog")}
          className="flex items-center gap-2 bg-white/80 hover:bg-white rounded-full px-5 py-2.5 border border-coral/20 hover:border-coral/40 transition-all duration-300 hover:shadow-md active:scale-95"
        >
          <span className="text-lg">📖</span>
          <span className="text-warm-text font-medium text-sm">恋爱攻略</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warm-muted/50">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
        <button
          onClick={() => router.push("/leaderboard")}
          className="flex items-center gap-2 bg-white/80 hover:bg-white rounded-full px-5 py-2.5 border border-coral/20 hover:border-coral/40 transition-all duration-300 hover:shadow-md active:scale-95"
        >
          <span className="text-lg">🏆</span>
          <span className="text-warm-text font-medium text-sm">排行榜</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warm-muted/50">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* 底部提示 */}
      <div className="mt-4 text-warm-muted text-xs text-center">
        全程 AI 动态生成，每次都不一样
      </div>
    </div>
  );
}
