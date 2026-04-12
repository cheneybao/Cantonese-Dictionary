/**
 * 粤语发音功能
 * 使用 Web Speech API 实现粤语发音
 */

export interface SpeechOptions {
  rate?: number;       // 语速 (0.1-10)
  pitch?: number;      // 音调 (0-2)
  volume?: number;     // 音量 (0-1)
}

/**
 * 检查浏览器是否支持 Web Speech API
 */
export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * 检查是否支持粤语语音
 */
export function isCantoneseVoiceAvailable(): boolean {
  if (!isSpeechSupported()) return false;

  const voices = window.speechSynthesis.getVoices();
  // 查找包含 'yue'、'cantonese'、'粤' 或 'HK' 的语音
  return voices.some(voice =>
    voice.lang === 'yue' ||
    voice.lang.includes('cantonese') ||
    voice.name.includes('粤') ||
    voice.name.includes('HK')
  );
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

    // 停止当前播放
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const cantoneseVoice = getCantoneseVoice();

    if (cantoneseVoice) {
      utterance.voice = cantoneseVoice;
      utterance.lang = cantoneseVoice.lang;
    } else {
      // 如果没有粤语语音，使用中文语音
      utterance.lang = 'zh-CN';
    }

    // 设置发音参数
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;

    utterance.onend = () => {
      resolve(true);
    };

    utterance.onerror = (event) => {
      console.error('发音错误:', event.error);
      resolve(false);
    };

    window.speechSynthesis.speak(utterance);
  });
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
