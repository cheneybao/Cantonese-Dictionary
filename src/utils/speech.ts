/**
 * 粤语发音功能
 * 使用 Web Speech API 实现粤语发音
 */

export interface SpeechOptions {
  rate?: number;       // 语速 (0.1-10)，默认 1.0
  pitch?: number;      // 音调 (0-2)，默认 1.0
  volume?: number;     // 音量 (0-1)，默认 1.0
  slowMode?: boolean;  // 慢速模式，自动设置为 0.7 倍速
}

export interface VoiceDetectionResult {
  isSupported: boolean;
  hasCantoneseVoice: boolean;
  availableCantoneseVoices: SpeechSynthesisVoice[];
  fallbackVoices: SpeechSynthesisVoice[];
  recommendation: string;
}

// 默认发音参数
export const DEFAULT_SPEECH_OPTIONS: Required<SpeechOptions> = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  slowMode: false,
};

// 慢速模式参数
export const SLOW_SPEECH_OPTIONS: Required<SpeechOptions> = {
  rate: 0.7,
  pitch: 1.0,
  volume: 1.0,
  slowMode: true,
};

/**
 * 检查浏览器是否支持 Web Speech API
 */
export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * 检测语音包状态并提供建议
 */
export function detectVoiceSupport(): VoiceDetectionResult {
  const isSupported = isSpeechSupported();
  const voices = getAllVoices();

  if (!isSupported) {
    return {
      isSupported: false,
      hasCantoneseVoice: false,
      availableCantoneseVoices: [],
      fallbackVoices: [],
      recommendation: '您的浏览器不支持 Web Speech API，建议使用 Chrome、Edge 或 Safari 浏览器。'
    };
  }

  const cantoneseVoices = getAvailableCantoneseVoices();
  const chineseVoices = voices.filter(voice =>
    voice.lang.startsWith('zh') ||
    voice.name.includes('中文') ||
    voice.name.includes('Chinese')
  );

  let recommendation = '';

  if (cantoneseVoices.length > 0) {
    recommendation = `检测到 ${cantoneseVoices.length} 个粤语语音包，可以直接使用粤语发音。`;
  } else if (chineseVoices.length > 0) {
    recommendation = '未检测到粤语语音包，将使用中文语音包替代。发音可能不够准确，建议在浏览器设置中添加粤语语音包。';
  } else {
    recommendation = '未检测到中文语音包，发音功能可能无法正常使用。建议在系统设置中添加中文语音包。';
  }

  return {
    isSupported: true,
    hasCantoneseVoice: cantoneseVoices.length > 0,
    availableCantoneseVoices: cantoneseVoices,
    fallbackVoices: chineseVoices,
    recommendation
  };
}

/**
 * 检查是否支持粤语语音
 */
export function isCantoneseVoiceAvailable(): boolean {
  return detectVoiceSupport().hasCantoneseVoice;
}

/**
 * 获取粤语语音
 */
export function getCantoneseVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;

  const voices = window.speechSynthesis.getVoices();

  // 优先查找粤语语音
  let cantoneseVoice = voices.find(voice =>
    voice.lang === 'yue' ||
    voice.lang.includes('cantonese') ||
    voice.name.includes('粤') ||
    voice.name.includes('HK')
  );

  // 如果没有粤语语音，尝试使用中文语音
  if (!cantoneseVoice) {
    cantoneseVoice = voices.find(voice =>
      voice.lang.startsWith('zh') ||
      voice.name.includes('中文') ||
      voice.name.includes('Chinese')
    );
  }

  return cantoneseVoice || null;
}

/**
 * 播放粤语发音
 * @param text 要发音的文本
 * @param options 发音选项
 * @returns Promise<boolean> 是否成功播放
 */
export function speakCantonese(text: string, options: SpeechOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isSpeechSupported()) {
      console.error('Web Speech API 不支持');
      resolve(false);
      return;
    }

    // 如果文本为空，直接返回
    if (!text || text.trim() === '') {
      console.warn('要发音的文本为空');
      resolve(false);
      return;
    }

    // 停止当前播放
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    const cantoneseVoice = getCantoneseVoice();

    if (cantoneseVoice) {
      utterance.voice = cantoneseVoice;
      utterance.lang = cantoneseVoice.lang;
    } else {
      // 如果没有粤语语音，使用中文语音
      utterance.lang = 'zh-CN';
    }

    // 合并选项
    const mergedOptions = { ...DEFAULT_SPEECH_OPTIONS, ...options };

    // 如果启用慢速模式，使用慢速参数
    const finalRate = mergedOptions.slowMode ? SLOW_SPEECH_OPTIONS.rate : mergedOptions.rate;

    // 设置发音参数
    utterance.rate = Math.max(0.1, Math.min(10, finalRate)); // 限制在 0.1-10 范围内
    utterance.pitch = Math.max(0, Math.min(2, mergedOptions.pitch)); // 限制在 0-2 范围内
    utterance.volume = Math.max(0, Math.min(1, mergedOptions.volume)); // 限制在 0-1 范围内

    console.log('发音参数:', {
      text,
      voice: utterance.voice?.name || 'Default',
      lang: utterance.lang,
      rate: utterance.rate,
      pitch: utterance.pitch,
      volume: utterance.volume,
    });

    utterance.onend = () => {
      console.log('发音完成');
      resolve(true);
    };

    utterance.onerror = (event) => {
      console.error('发音错误:', event.error);
      resolve(false);
    };

    utterance.onstart = () => {
      console.log('开始发音');
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * 播放慢速粤语发音
 * @param text 要发音的文本
 * @param options 发音选项（可选，会自动应用慢速模式）
 * @returns Promise<boolean> 是否成功播放
 */
export function speakCantoneseSlow(text: string, options: SpeechOptions = {}): Promise<boolean> {
  return speakCantonese(text, { ...options, slowMode: true });
}

/**
 * 播放自定义速度的粤语发音
 * @param text 要发音的文本
 * @param rate 播放速度 (0.1-10)
 * @param options 其他发音选项
 * @returns Promise<boolean> 是否成功播放
 */
export function speakCantoneseWithRate(
  text: string,
  rate: number,
  options: SpeechOptions = {}
): Promise<boolean> {
  return speakCantonese(text, { ...options, rate });
}

/**
 * 停止发音
 */
export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * 检查是否正在播放
 */
export function isSpeaking(): boolean {
  if (!isSpeechSupported()) return false;
  return window.speechSynthesis.speaking;
}

/**
 * 获取所有可用语音
 */
export function getAllVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * 获取可用的粤语语音列表
 */
export function getAvailableCantoneseVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(voice =>
    voice.lang === 'yue' ||
    voice.lang.includes('cantonese') ||
    voice.name.includes('粤') ||
    voice.name.includes('HK')
  );
}
