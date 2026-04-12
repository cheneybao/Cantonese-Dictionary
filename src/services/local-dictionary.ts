/**
 * 纯前端词典服务（使用 IndexedDB）
 * 无需后端，数据完全存储在浏览器本地
 */

import chineseS2t from 'chinese-s2t';

const { s2t } = chineseS2t;

// 数据类型定义
export interface WordEntry {
  w: string;  // word
  j: string;  // jyutping
  d?: string; // definition
  e?: string; // example
}

export interface DictionaryData {
  v: string;
  date: string;
  stats: {
    words: number;
    syllables: number;
  };
  w: WordEntry[];
  s: string[];
  si: Record<string, string[]>;
  wi: Record<string, WordEntry[]>;
}

export interface WordDetail {
  id: string;
  word: string;
  jyutping: string;
  pronunciation?: string[];
  definition?: string;
  examples?: {
    chinese: string;
    jyutping: string;
    english?: string;
  }[];
  related?: string[];
}

// IndexedDB 数据库名和版本
const DB_NAME = 'CantoneseDictionaryDB';
const DB_VERSION = 1;
const STORE_NAME = 'dictionary';

class LocalDictionaryService {
  private db: IDBDatabase | null = null;
  private isReady = false;
  private loadPromise: Promise<void> | null = null;

  // 初始化数据库
  async init(): Promise<void> {
    if (this.isReady) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._initDB();
    await this.loadPromise;
  }

  private async _initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[LocalDictionary] 数据库打开失败:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[LocalDictionary] 数据库打开成功');
        this.isReady = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'w' });
          store.createIndex('j', 'j', { unique: false });
        }

        console.log('[LocalDictionary] 数据库升级完成');
      };

      request.onblocked = () => {
        console.warn('[LocalDictionary] 数据库被阻塞，请关闭其他标签页');
      };
    });
  }

  // 加载 JSON 数据到 IndexedDB
  async loadDataFromJson(jsonData: DictionaryData): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // 清空旧数据
      store.clear();

      // 批量插入
      jsonData.w.forEach((word) => {
        store.put(word);

        // 调试：打印前10个词
        if (jsonData.w.indexOf(word) < 10) {
          console.log('[LocalDictionary] 导入词:', word.w, word.j);
        }
      });

      transaction.oncomplete = () => {
        console.log(`[LocalDictionary] 成功导入 ${jsonData.stats.words} 条词条`);
        resolve();
      };

      transaction.onerror = () => {
        console.error('[LocalDictionary] 数据导入失败:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  // 从网络加载 JSON 数据
  async loadFromNetwork(forceReload = false): Promise<void> {
    try {
      console.log('[LocalDictionary] 从网络加载数据...');

      const response = await fetch('/data/dictionary.json');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonData: DictionaryData = await response.json();

      // 检查版本
      const localVersion = localStorage.getItem('dictionary_version');

      if (localVersion === jsonData.v && !forceReload) {
        console.log('[LocalDictionary] 版本相同，跳过加载');
        return;
      }

      console.log('[LocalDictionary] 版本:', localVersion, '->', jsonData.v, forceReload ? '(强制)' : '');

      // 如果有旧数据，先清除
      if (localVersion) {
        console.log('[LocalDictionary] 清除旧数据');
        await this.clearAllData();
      }

      console.log('[LocalDictionary] 数据下载完成，导入 IndexedDB...');
      await this.loadDataFromJson(jsonData);

      // 保存版本号
      localStorage.setItem('dictionary_version', jsonData.v);

      console.log('[LocalDictionary] 数据导入完成');
    } catch (error) {
      console.error('[LocalDictionary] 从网络加载数据失败:', error);
      throw error;
    }
  }

  // 清除所有数据（用于版本更新或手动刷新）
  async clearAllData(): Promise<void> {
    console.log('[LocalDictionary] 清除所有数据...');

    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      store.clear();

      transaction.oncomplete = () => {
        console.log('[LocalDictionary] 数据清除完成');
        localStorage.removeItem('dictionary_version');
        resolve();
      };

      transaction.onerror = () => {
        console.error('[LocalDictionary] 数据清除失败:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  // 搜索词条
  async searchWords(query: string, limit = 20): Promise<WordEntry[]> {
    console.log('[LocalDictionary] 开始搜索:', query);

    if (!this.isReady) {
      console.log('[LocalDictionary] 数据库未就绪，正在初始化...');
      await this.init();
    }

    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      // 使用游标进行模糊搜索
      const results: WordEntry[] = [];
      const request = store.openCursor();

      // 简繁体转换：同时搜索简体和繁体
      const traditionalQuery = s2t(query);
      const searchTerms = [query];
      if (traditionalQuery !== query) {
        searchTerms.push(traditionalQuery);
      }

      console.log('[LocalDictionary] 搜索词:', query);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor && results.length < limit) {
          const word = cursor.value as WordEntry;

          // 模糊匹配：检查是否匹配任何搜索词
          const matchesWord = searchTerms.some(term => word.w.includes(term));
          const matchesJyutping = word.j.toLowerCase().includes(query.toLowerCase());

          if (matchesWord || matchesJyutping) {
            results.push(word);
          }

          cursor.continue();
        } else {
          console.log('[LocalDictionary] 搜索完成，找到', results.length, '条结果');
          resolve(results);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 获取词条详情
  async getWordDetail(word: string): Promise<WordDetail | null> {
    console.log('[LocalDictionary] ========== getWordDetail 开始 ==========');
    console.log('[LocalDictionary] 获取词条详情:', word);

    if (!this.isReady) {
      console.log('[LocalDictionary] 数据库未就绪，正在初始化...');
      await this.init();
    }

    if (!this.db) {
      console.error('[LocalDictionary] 数据库未初始化，db为null');
      throw new Error('数据库未初始化');
    }

    console.log('[LocalDictionary] 数据库已就绪，开始查询...');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      // 先尝试直接查询
      let request = store.get(word);

      // 如果是简体字，也需要尝试繁体查询
      const traditionalWord = s2t(word);
      const tryTraditional = word !== traditionalWord;

      console.log('[LocalDictionary] 繁体转换:', word, '->', traditionalWord, tryTraditional);

      request.onsuccess = () => {
        let wordEntry = request.result as WordEntry | undefined;

        if (wordEntry) {
          console.log('[LocalDictionary] 直接查询成功:', wordEntry.w, wordEntry.j);
        } else {
          console.log('[LocalDictionary] 直接查询未找到');
        }

        // 如果直接查询不到，且是简体字，尝试用繁体查询
        if (!wordEntry && tryTraditional) {
          console.log('[LocalDictionary] 尝试用繁体查询:', traditionalWord);
          request = store.get(traditionalWord);
          request.onsuccess = () => {
            wordEntry = request.result as WordEntry | undefined;

            if (!wordEntry) {
              console.log('[LocalDictionary] 繁体查询也未找到词条');
              // 如果查询的是单字，尝试查找以该字开头的词语
              if (word.length === 1 || traditionalWord.length === 1) {
                console.log('[LocalDictionary] 查询单字未找到，尝试查找相关词语');
                this.findWordsStartingWith(word, resolve);
                return;
              }
              console.log('[LocalDictionary] ========== getWordDetail 结束 (null) ==========');
              resolve(null);
              return;
            }

            console.log('[LocalDictionary] 繁体查询成功:', wordEntry.w, wordEntry.j);
            this.buildWordDetail(wordEntry, resolve);
          };
          request.onerror = () => {
            console.error('[LocalDictionary] 繁体查询失败:', request.error);
            console.log('[LocalDictionary] ========== getWordDetail 结束 (error) ==========');
            reject(request.error);
          };
          return;
        }

        if (!wordEntry) {
          console.log('[LocalDictionary] 未找到词条');
          // 如果查询的是单字，尝试查找以该字开头的词语
          if (word.length === 1) {
            console.log('[LocalDictionary] 查询单字未找到，尝试查找相关词语');
            this.findWordsStartingWith(word, resolve);
            return;
          }
          console.log('[LocalDictionary] ========== getWordDetail 结束 (null) ==========');
          resolve(null);
          return;
        }

        console.log('[LocalDictionary] 准备构建词条详情...');
        this.buildWordDetail(wordEntry, resolve);
      };

      request.onerror = () => {
        console.error('[LocalDictionary] 查询失败:', request.error);
        console.log('[LocalDictionary] ========== getWordDetail 结束 (error) ==========');
        reject(request.error);
      };
    });
  }

  // 查找以指定字开头的词语（用于单字查询）
  private findWordsStartingWith(word: string, resolve: (value: WordDetail | null) => void) {
    if (!this.db) {
      resolve(null);
      return;
    }

    const transaction = this.db!.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('idx_w');

    const range = IDBKeyRange.lowerBound(word);
    const request = index.openCursor(range);
    const results: WordEntry[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor && results.length < 10) {
        const wordEntry = cursor.value as WordEntry;
        if (wordEntry.w.startsWith(word)) {
          results.push(wordEntry);
          cursor.continue();
        } else {
          // 不再匹配，结束查询
          this.buildSuggestionDetail(word, results, resolve);
        }
      } else {
        // 已达到限制或查询完成
        this.buildSuggestionDetail(word, results, resolve);
      }
    };

    request.onerror = () => {
      console.error('[LocalDictionary] 查找相关词语失败:', request.error);
      resolve(null);
    };
  }

  // 构建建议详情（用于单字查询）
  private buildSuggestionDetail(word: string, relatedWords: WordEntry[], resolve: (value: WordDetail | null) => void) {
    if (relatedWords.length === 0) {
      console.log('[LocalDictionary] ========== getWordDetail 结束 (null, 无相关词语) ==========');
      resolve(null);
      return;
    }

    console.log('[LocalDictionary] 找到相关词语:', relatedWords.map(w => w.w).join(', '));

    // 使用第一个词作为主词
    const mainWord = relatedWords[0];
    const detail: WordDetail = {
      id: word,
      word: word,
      jyutping: word.length > 0 && mainWord.j.length > 0 ? mainWord.j.split(' ')[0] : '',
      pronunciation: word.length > 0 && mainWord.j.length > 0 ? [mainWord.j.split(' ')[0]] : [],
      definition: `该字在词典中无独立词条，以下是包含"${word}"的词语：`,
      examples: [],
      related: relatedWords.slice(0, 10).map(w => w.w)
    };

    console.log('[LocalDictionary] buildSuggestionDetail 完成，detail:', detail);
    console.log('[LocalDictionary] ========== getWordDetail 结束 (success with suggestions) ==========');
    resolve(detail);
  }

  private buildWordDetail(wordEntry: WordEntry, resolve: (value: WordDetail | null) => void) {
    console.log('[LocalDictionary] buildWordDetail 开始，词条:', wordEntry.w);

    // 获取相关词条（相同首字）
    const related: string[] = [];
    // 简化处理：不查询相关词以提高性能

    // 解析例句（如果存在）
    let examples: Array<{
      chinese: string;
      jyutping: string;
      english?: string;
    }> = [];
    if (wordEntry.e) {
      try {
        // 例句格式1：中文句子|粤拼|英文翻译（可选）
        // 例句格式2：中文句子（简单格式，只有中文）
        const exampleLines = wordEntry.e.split('\n');
        examples = exampleLines
          .map(line => {
            const trimmed = line.trim();
            if (!trimmed) return null;

            if (trimmed.includes('|')) {
              // 格式1：包含分隔符
              const parts = trimmed.split('|');
              return {
                chinese: parts[0] || '',
                jyutping: parts[1] || '',
                english: parts[2] || undefined
              };
            } else {
              // 格式2：简单格式，只有中文
              return {
                chinese: trimmed,
                jyutping: '',
                english: undefined
              };
            }
          })
          .filter((ex): ex is NonNullable<typeof ex> => ex !== null && ex.chinese !== '') as Array<{
            chinese: string;
            jyutping: string;
            english?: string;
          }>;
      } catch (error) {
        console.error('[LocalDictionary] 解析例句失败:', error);
      }
    }

    const detail: WordDetail = {
      id: wordEntry.w,
      word: wordEntry.w,
      jyutping: wordEntry.j,
      pronunciation: wordEntry.j.split(' '),
      definition: wordEntry.d || '来自 Rime Cantonese 词典',
      examples,
      related: related.length > 0 ? related.slice(0, 5) : []
    };

    console.log('[LocalDictionary] buildWordDetail 完成，detail:', detail);
    console.log('[LocalDictionary] ========== getWordDetail 结束 (success) ==========');
    resolve(detail);
  }

  // 获取联想建议
  async getSuggestions(query: string): Promise<Array<{ word: string; jyutping: string; type: 'word' | 'syllable' }>> {
    console.log('[LocalDictionary] getSuggestions 被调用，query:', JSON.stringify(query));

    if (!query || query.trim().length === 0) {
      console.log('[LocalDictionary] query 为空，返回空数组');
      return [];
    }

    if (!this.isReady) {
      console.log('[LocalDictionary] 数据库未就绪，正在初始化...');
      await this.init();
    }

    const trimmedQuery = query.trim();
    console.log('[LocalDictionary] 搜索词:', trimmedQuery);

    const words = await this.searchWords(trimmedQuery, 10);

    console.log('[LocalDictionary] getSuggestions 搜索结果:', words.length, '条');
    console.log('[LocalDictionary] 前3条结果:', words.slice(0, 3));

    return words.map(word => ({
      word: word.w,
      jyutping: word.j,
      type: 'word' as const
    }));
  }

  // 获取数据统计
  async getStats(): Promise<{ words: number; loaded: boolean }> {
    if (!this.isReady) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => {
        resolve({
          words: request.result,
          loaded: true
        });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 检查是否已加载数据
  async isDataLoaded(): Promise<boolean> {
    if (!this.isReady) {
      await this.init();
    }

    const stats = await this.getStats();
    return stats.words > 0;
  }
}

// 导出单例
export const localDictionary = new LocalDictionaryService();
