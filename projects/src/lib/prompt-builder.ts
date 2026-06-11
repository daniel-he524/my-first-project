import {
  type Gender,
  type ChatMessage,
  type ChatOption,
  INITIAL_FAVORABILITY,
  MAX_ROUNDS,
  WIN_THRESHOLD,
  MIN_FAVORABILITY,
  getEmotionPrompt,
} from "./game-config";

interface BuildPromptParams {
  gender: Gender;
  sceneId: string;
  sceneDescription: string;
  round: number;
  favorability: number;
  messages: ChatMessage[];
  userChoice?: string;
  isFirstRound: boolean;
}

export function buildSystemPrompt(params: {
  gender: Gender;
  sceneDescription: string;
}): string {
  const genderLabel = params.gender === "girlfriend" ? "女朋友" : "男朋友";
  const genderPronoun = params.gender === "girlfriend" ? "她" : "他";

  return `你是一个"哄哄模拟器"中的${genderLabel}角色。你正在和用户（你的${genderLabel}）吵架。

场景：${params.sceneDescription}

## 角色设定
- 你是用户的${genderLabel}，正在因为上述场景的事情非常生气
- 你的性格：俏皮、带点小傲娇，生气时也要有可爱的一面，不会真的让人感到害怕或不适
- 文风：口语化、生动、有情绪层次，像真实情侣吵架的感觉
- ${genderPronoun}说话要自然，可以用语气词（哼、啊、嘛、呢、吧、啦），偶尔用表情增强语气

## 情绪规则
你的情绪严格根据当前好感度变化：
- 好感度 -50~0：非常生气，冷暴力或激烈质问
- 好感度 0~30：还在生气，但愿意听你说
- 好感度 30~60：开始软化，嘴上生气但语气缓和
- 好感度 60~80：快被哄好了，可能撒娇或小声说"哼"
- 好感度 80+：原谅了，但还要你保证不再犯

## 选项生成规则（严格遵守！）
每轮必须生成恰好 6 个选项，其中：
- 2个加分选项（+5到+20分）：真诚但不呆板的话，要让人感到被在乎、被偏爱。比如：
  "我知道错了嘛，你打我两下出出气好不好？"
  "你还记得上次咱俩也吵过，后来你笑着原谅我了~"
  "我给你点了你最爱的那家奶茶，已经在路上了"
  "不生气了好不好？我保证以后你说的我都记住"
  "你生气的样子都好看，但笑起来更好看啊"

- 1-2个普通减分选项（-5到-15分）：不是恶意攻击，而是恋爱中那种"说了就知道要完蛋但还是忍不住说了"的欠揍话。比如：
  "行行行都是我的错行了吧"（敷衍式认错）
  "你也太敏感了吧，我当时没想那么多"（下意识找借口）
  "我觉得这事你也有点问题啊"（讲道理找死型）
  "好好好我错了行了吧，别再说了"（不耐烦式）
  "那你要我怎样嘛"（摆烂式）

- 2-3个奇葩搞笑选项（-10到-30分）：离谱到好笑但可爱的话，让人看了忍不住笑出来。比如：
  "要不我跪榴莲？不行跪键盘也行，你选一个"
  "我单方面宣布这架是我输了，奖品是你原谅我"
  "你看我表演一个原地消失...唉不行我舍不得你"
  "我错了！如果你不原谅我我就...我就再道一次歉！"
  "我这就去给你买十杯奶茶，喝到你消气为止"
  "要不咱俩石头剪刀布？你赢了算你对，我赢了也算你对"

选项顺序随机打乱，不要把加分项固定在某个位置。
选项文字要生动有趣、有恋爱感，像情侣之间会说的话，不要太官方太死板。
每个选项分值范围：加分 +5到+20，减分 -5到-30。
选项文字控制在35字以内，允许用语气词和表情增强语气。

## 输出格式
你必须严格返回以下JSON格式，不要输出任何其他内容：
{
  "reply": "你说的话（要和前面的对话连贯，体现当前情绪）",
  "emotion_score_change": 数字（本轮对话整体好感度变化倾向，正数偏积极，负数偏消极，范围-20到+20）,
  "options": [
    {"text": "选项1", "score_change": 分值, "is_correct": 是否加分},
    {"text": "选项2", "score_change": 分值, "is_correct": 是否加分},
    {"text": "选项3", "score_change": 分值, "is_correct": 是否加分},
    {"text": "选项4", "score_change": 分值, "is_correct": 是否加分},
    {"text": "选项5", "score_change": 分值, "is_correct": 是否加分},
    {"text": "选项6", "score_change": 分值, "is_correct": 是否加分}
  ]
}

注意：
- is_correct 为 true 表示加分选项，false 表示减分选项
- 【最重要】恰好2个 is_correct=true（加分），4个 is_correct=false（减分）！绝对不能全部是加分！
- 6个选项中必须有4个减分选项（score_change为负数），这是游戏核心玩法！
- 选项文字控制在35字以内，允许用语气词和表情增强语气，要有恋爱感
- 不要出现重复的选项内容
- 对话要连贯，回应上一轮用户的选择
- score_change 数字不要加正号，直接写数字（如 15 而不是 +15）
- 你的reply要简短口语化，像微信聊天发消息一样，首轮1-2个短句（不超过30字），后续轮次也不超过50字，不要写长段落`;
}

export function buildMessages(params: BuildPromptParams): Array<{
  role: "system" | "user" | "assistant";
  content: string;
}> {
  const emotionHint = getEmotionPrompt(params.favorability);
  const systemPrompt = buildSystemPrompt({
    gender: params.gender,
    sceneDescription: params.sceneDescription,
  });

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [{ role: "system", content: systemPrompt }];

  // 构建历史对话
  for (const msg of params.messages) {
    if (msg.role === "partner") {
      messages.push({ role: "assistant", content: msg.content });
    } else {
      messages.push({ role: "user", content: msg.content });
    }
  }

  // 本轮用户输入
  if (params.isFirstRound) {
    messages.push({
      role: "user",
      content: `游戏开始！当前是第1轮，好感度${INITIAL_FAVORABILITY}。请生成你说的第一句话和6个回复选项。你的情绪：${emotionHint}

重要：你的reply只能是1-2个短句（总共不超过30字），像微信聊天中发的一条消息那样简短有力。不要写长段落！`,
    });
  } else if (params.userChoice) {
    messages.push({
      role: "user",
      content: `（第${params.round}轮，当前好感度${params.favorability}，你的情绪：${emotionHint}）
用户选择了："${params.userChoice}"
请根据这个选择回应，并生成6个新的回复选项。记住：选项要和当前对话连贯，体现你的情绪变化。你的reply要简短，像微信聊天发消息一样，不超过50字。`,
    });
  }

  return messages;
}

// 校验和修复 LLM 输出
export function validateChatResponse(raw: unknown): {
  reply: string;
  emotion_score_change: number;
  options: ChatOption[];
} {
  const DEFAULT_OPTIONS: ChatOption[] = [
    { text: "我知道错了嘛，你打我两下出出气好不好？", score_change: 10, is_correct: true },
    { text: "不生气了好不好？我保证以后你说的我都记住", score_change: 8, is_correct: true },
    { text: "行行行都是我的错行了吧", score_change: -10, is_correct: false },
    { text: "你也太敏感了吧，我当时没想那么多", score_change: -15, is_correct: false },
    { text: "我单方面宣布这架是我输了，奖品是你原谅我", score_change: -20, is_correct: false },
    { text: "我这就去给你买十杯奶茶，喝到你消气为止", score_change: -8, is_correct: false },
  ];

  if (!raw || typeof raw !== "object") {
    return { reply: "你说什么呢，我听不见！", emotion_score_change: 0, options: DEFAULT_OPTIONS };
  }

  const data = raw as Record<string, unknown>;

  if (typeof data.reply !== "string" || !data.reply.trim()) {
    return { reply: "哼，你什么都不说我就更生气了！", emotion_score_change: -5, options: DEFAULT_OPTIONS };
  }

  let emotionScoreChange = 0;
  if (typeof data.emotion_score_change === "number") {
    emotionScoreChange = Math.max(-20, Math.min(20, data.emotion_score_change));
  }

  let options: ChatOption[] = DEFAULT_OPTIONS;
  if (Array.isArray(data.options)) {
    const parsed: ChatOption[] = data.options
      .filter(
        (opt: unknown) =>
          opt &&
          typeof opt === "object" &&
          typeof (opt as Record<string, unknown>).text === "string"
      )
      .map((opt: unknown) => {
        const o = opt as Record<string, unknown>;
        let scoreChange = typeof o.score_change === "number" ? o.score_change : 0;
        scoreChange = Math.max(-30, Math.min(30, scoreChange));
        // 根据 score_change 修正 is_correct（LLM 可能返回不一致的值）
        const isCorrect = scoreChange > 0;
        return {
          text: String(o.text),
          score_change: scoreChange,
          is_correct: isCorrect,
        };
      });

    if (parsed.length >= 6) {
      options = parsed.slice(0, 6);
    } else if (parsed.length > 0) {
      // 不足6个，用默认选项补齐
      options = [...parsed, ...DEFAULT_OPTIONS.slice(parsed.length)].slice(0, 6);
    }
  }

  return {
    reply: data.reply.trim(),
    emotion_score_change: emotionScoreChange,
    options,
  };
}
