// 游戏配置与类型定义

export type Gender = "girlfriend" | "boyfriend";

export type VoiceId =
  | "gentle_female"
  | "dominant_female"
  | "cute_female"
  | "deep_male"
  | "gentle_male";

export interface Scene {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

export interface VoiceOption {
  id: VoiceId;
  label: string;
  description: string;
  speaker: string;
  gender: Gender[];
}

export interface ChatOption {
  text: string;
  score_change: number;
  is_correct: boolean;
}

export interface ChatResponse {
  reply: string;
  emotion_score_change: number;
  options: ChatOption[];
}

export interface ChatMessage {
  role: "partner" | "user";
  content: string;
  scoreChange?: number;
}

export interface GameState {
  gender: Gender;
  scene: string;
  voiceId: VoiceId;
  favorability: number;
  round: number;
  maxRounds: number;
  messages: ChatMessage[];
  currentOptions: ChatOption[] | null;
  status: "playing" | "won" | "lost";
  partnerReply: string | null;
  audioUrl: string | null;
}

// 预设场景
export const SCENES: Scene[] = [
  {
    id: "anniversary",
    title: "忘记纪念日",
    description: "今天是你们在一起三周年，你完全忘了",
    emoji: "💔",
  },
  {
    id: "no_reply",
    title: "深夜不回消息",
    description: "你昨晚打游戏到凌晨三点，对方发了十几条消息你都没回",
    emoji: "🎮",
  },
  {
    id: "flirting",
    title: "被发现和异性聊天",
    description: "对方看到你和异性朋友的暧昧聊天记录",
    emoji: "📱",
  },
  {
    id: "lost_cat",
    title: "把对方的猫弄丢了",
    description: "你帮对方照顾猫的时候，猫跑丢了",
    emoji: "🐱",
  },
  {
    id: "public_shame",
    title: "当众让对方没面子",
    description: "你在朋友聚会上开了一个过分的玩笑",
    emoji: "😳",
  },
];

// 声音选项
export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "gentle_female",
    label: "温柔女声",
    description: "轻柔细腻，如春风拂面",
    speaker: "zh_female_vv_uranus_bigtts",
    gender: ["girlfriend"],
  },
  {
    id: "dominant_female",
    label: "霸道御姐",
    description: "气场全开，不怒自威",
    speaker: "zh_female_mizai_saturn_bigtts",
    gender: ["girlfriend"],
  },
  {
    id: "cute_female",
    label: "可爱软妹",
    description: "奶声奶气，生气也萌",
    speaker: "saturn_zh_female_keainvsheng_tob",
    gender: ["girlfriend"],
  },
  {
    id: "deep_male",
    label: "低沉男声",
    description: "低音炮，冷冷的生气",
    speaker: "zh_male_m191_uranus_bigtts",
    gender: ["boyfriend"],
  },
  {
    id: "gentle_male",
    label: "温柔男声",
    description: "暖暖的，像大哥哥",
    speaker: "zh_male_taocheng_uranus_bigtts",
    gender: ["boyfriend"],
  },
];

// 游戏常量
export const INITIAL_FAVORABILITY = 20;
export const MAX_FAVORABILITY = 100;
export const MIN_FAVORABILITY = -50;
export const WIN_THRESHOLD = 80;
export const MAX_ROUNDS = 10;
export const OPTIONS_PER_ROUND = 6;

// 根据好感度获取情绪描述
export function getEmotionLevel(favorability: number): string {
  if (favorability < 0) return "非常生气";
  if (favorability < 30) return "还在生气";
  if (favorability < 60) return "开始软化";
  if (favorability < 80) return "快要原谅你了";
  return "已经原谅你了";
}

// 根据好感度获取情绪区间提示（给 LLM 的）
export function getEmotionPrompt(favorability: number): string {
  if (favorability < 0) {
    return "非常生气，冷暴力或激烈质问。语气要尖锐、冷漠或爆发式愤怒。";
  }
  if (favorability < 30) {
    return "还在生气，但愿意听你说。语气带着怨气但不是完全拒绝。";
  }
  if (favorability < 60) {
    return "开始软化，嘴上生气但语气缓和。偶尔会露出被逗笑的迹象，但马上又绷住。";
  }
  if (favorability < 80) {
    return '快被哄好了，可能撒娇或小声说"哼"。偶尔还会嘴硬一下，但明显气消了大半。';
  }
  return "原谅了，但还要你保证不再犯。语气甜蜜中带着一点点傲娇。";
}
