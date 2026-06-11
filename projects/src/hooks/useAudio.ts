"use client";

import { useRef, useState, useCallback, useEffect } from "react";

// 全局音频解锁状态（跨组件共享）
let audioUnlocked = false;

export function isAudioUnlocked(): boolean {
  return audioUnlocked;
}

/** 在用户手势中调用，预热浏览器音频播放权限 */
export function unlockAudio(): void {
  if (audioUnlocked) return;
  try {
    const silentAudio = new Audio(
      "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYgFssGAAAAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYgFssGAAAAAAAAAAAAAAAAAAAA"
    );
    silentAudio.volume = 0;
    const promise = silentAudio.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          audioUnlocked = true;
          silentAudio.pause();
          silentAudio.remove();
        })
        .catch(() => {
          // 解锁失败，后续 TTS 将需要用户交互后才能播放
        });
    } else {
      audioUnlocked = true;
    }
  } catch {
    // 忽略解锁失败
  }
}

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState(false);

  // 播放新音频：设置 URL，由 AutoPlayAudio 组件通过 autoPlay 属性自动播放
  const play = useCallback((url: string) => {
    setCurrentUrl(url);
    setIsPlaying(true);
    setAudioError(false);
  }, []);

  // 停止播放
  const stop = useCallback(() => {
    setCurrentUrl(null);
    setIsPlaying(false);
    setAudioError(false);
  }, []);

  // 音频播放结束回调
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // 音频播放错误回调
  const handleError = useCallback(() => {
    setIsPlaying(false);
    setAudioError(true);
  }, []);

  // 音频开始播放回调（autoPlay 生效时触发）
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setAudioError(false);
  }, []);

  return {
    play,
    stop,
    isPlaying,
    currentUrl,
    audioError,
    handleEnded,
    handleError,
    handlePlay,
  };
}

/**
 * 隐藏的自动播放音频组件
 * 使用 <audio> 标签的 autoPlay 属性，浏览器会根据音频上下文状态决定是否自动播放
 * 如果音频已在用户手势中解锁（首页预热），则 autoPlay 会生效
 * 否则浏览器会静默跳过，用户交互后可再次触发
 */
export function AutoPlayAudio({
  url,
  onEnded,
  onError,
  onPlay,
}: {
  url: string | null;
  onEnded?: () => void;
  onError?: () => void;
  onPlay?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!url) return;

    // 停止之前的音频
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }

    const audio = new Audio();
    audioRef.current = audio;
    audio.src = url;
    audio.autoplay = true;

    if (onEnded) audio.addEventListener("ended", onEnded);
    if (onError) audio.addEventListener("error", onError);
    if (onPlay) audio.addEventListener("play", onPlay);

    return () => {
      if (onEnded) audio.removeEventListener("ended", onEnded);
      if (onError) audio.removeEventListener("error", onError);
      if (onPlay) audio.removeEventListener("play", onPlay);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, [url, onEnded, onError, onPlay]);

  return null;
}
