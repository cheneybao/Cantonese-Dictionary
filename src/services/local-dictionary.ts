/**
 * 纯前端词典服务（使用 IndexedDB）
 * 无需后端，数据完全存储在浏览器本地
 */

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
  async loadFromNetwork(): Promise<void> {
    try {
      console.log('[LocalDictionary] 从网络加载数据...');
      const response = await fetch('/data/dictionary.json');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonData: DictionaryData = await response.json();
      console.log('[LocalDictionary] 数据下载完成，导入 IndexedDB...');

      await this.loadDataFromJson(jsonData);
      console.log('[LocalDictionary] 数据导入完成');
    } catch (error) {
      console.error('[LocalDictionary] 从网络加载数据失败:', error);
      throw error;
    }
  }

  // 搜索词条
  async searchWords(query: string, limit = 20): Promise<WordEntry[]> {
    if (!this.isReady) {
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

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor && results.length < limit) {
          const word = cursor.value as WordEntry;

          // 模糊匹配
          if (word.w.includes(query) || word.j.includes(query.toLowerCase())) {
            results.push(word);
          }

          cursor.continue();
        } else {
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
    if (!this.isReady) {
      await this.init();
    }

    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(word);

      request.onsuccess = () => {
        const wordEntry = request.result as WordEntry | undefined;

        if (!wordEntry) {
          resolve(null);
          return;
        }

        // 获取相关词条（相同首字）
        const related: string[] = [];
        // 简化处理：不查询相关词以提高性能

        const detail: WordDetail = {
          id: word,
          word: wordEntry.w,
          jyutping: wordEntry.j,
          pronunciation: wordEntry.j.split(' '),
          definition: wordEntry.d || '来自 Rime Cantonese 词典',
          examples: [],
          related: related.length > 0 ? related.slice(0, 5) : []
        };

        resolve(detail);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 获取联想建议
  async getSuggestions(query: string): Promise<Array<{ word: string; jyutping: string; type: 'word' | 'syllable' }>> {
    if (!this.isReady) {
      await this.init();
    }

    const words = await this.searchWords(query, 10);

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
