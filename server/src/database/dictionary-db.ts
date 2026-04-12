import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const DB_DIR = path.join(process.cwd(), 'server', 'data');
const DB_PATH = path.join(DB_DIR, 'dictionary.db');

// 确保数据库目录存在
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export class DictionaryDatabase {
  private db: Database.Database;
  private cache: Map<string, { data: any, timestamp: number }>;
  private cacheTimeout: number; // 缓存超时时间（毫秒）

  constructor(cacheTimeout: number = 5 * 60 * 1000) {
    this.db = new Database(DB_PATH);
    this.cacheTimeout = cacheTimeout;
    this.cache = new Map();
    this.initDatabase();
  }

  private initDatabase() {
    // 创建词条表（包含释义和例句）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        pinyin TEXT NOT NULL,
        weight INTEGER DEFAULT 0,
        definition TEXT,
        example TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(word, pinyin)
      );

      CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
      CREATE INDEX IF NOT EXISTS idx_words_pinyin ON words(pinyin);
      CREATE INDEX IF NOT EXISTS idx_words_weight ON words(weight DESC);
    `);

    // 创建音节表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS syllables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        syllable TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_syllables_syllable ON syllables(syllable);
    `);

    // 创建音节-词条关联表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS syllable_words (
        syllable_id INTEGER NOT NULL,
        word_id INTEGER NOT NULL,
        PRIMARY KEY (syllable_id, word_id),
        FOREIGN KEY (syllable_id) REFERENCES syllables(id),
        FOREIGN KEY (word_id) REFERENCES words(id)
      );

      CREATE INDEX IF NOT EXISTS idx_syllable_words_syllable ON syllable_words(syllable_id);
      CREATE INDEX IF NOT EXISTS idx_syllable_words_word ON syllable_words(word_id);
    `);
  }

  // 缓存辅助方法
  private getCacheKey(method: string, params: any): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  // 导入词典数据（支持扩展格式：word pinyin weight definition example）
  importDictionary(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const insertWord = this.db.prepare(`
      INSERT OR IGNORE INTO words (word, pinyin, weight, definition, example)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertSyllable = this.db.prepare(`
      INSERT OR IGNORE INTO syllables (syllable)
      VALUES (?)
    `);

    const getSyllableId = this.db.prepare(`
      SELECT id FROM syllables WHERE syllable = ?
    `);

    const getWordId = this.db.prepare(`
      SELECT id FROM words WHERE word = ? AND pinyin = ?
    `);

    const linkSyllableWord = this.db.prepare(`
      INSERT OR IGNORE INTO syllable_words (syllable_id, word_id)
      VALUES (?, ?)
    `);

    const insertMany = this.db.transaction((entries: Array<{
      word: string,
      pinyin: string,
      weight: number,
      definition?: string,
      example?: string
    }>) => {
      for (const entry of entries) {
        // 插入词条（包含释义和例句）
        insertWord.run(entry.word, entry.pinyin, entry.weight, entry.definition || null, entry.example || null);

        // 获取词条 ID
        const word = getWordId.get(entry.word, entry.pinyin) as {id: number};
        const wordId = word.id;

        // 提取音节（按空格分割）
        const syllables = entry.pinyin.split(' ');
        for (const syl of syllables) {
          if (syl) {
            // 插入音节
            insertSyllable.run(syl);

            // 获取音节 ID
            const syllable = getSyllableId.get(syl) as {id: number};
            const syllableId = syllable.id;

            // 建立关联
            linkSyllableWord.run(syllableId, wordId);
          }
        }
      }
    });

    // 解析数据并导入
    const entries: Array<{
      word: string,
      pinyin: string,
      weight: number,
      definition?: string,
      example?: string
    }> = [];
    for (const line of lines) {
      // 跳过注释和空行
      if (line.startsWith('#') || line.startsWith('---') || line.startsWith('...') || line.trim() === '') continue;

      // 使用制表符分割，保持拼音中的空格
      const parts = line.trim().split('\t');

      if (parts.length >= 2) {
        const word = parts[0].trim();
        const pinyin = parts[1].trim();
        const weight = parts.length >= 3 ? parseInt(parts[2]) || 0 : 0;

        // 尝试提取释义和例句
        let definition: string | undefined;
        let example: string | undefined;

        if (parts.length >= 4) {
          definition = parts[3].trim();
        }

        if (parts.length >= 5) {
          example = parts[4].trim();
        }

        // 只有当拼音不为空时才添加
        if (pinyin) {
          entries.push({ word, pinyin, weight, definition, example });
        }
      }
    }

    insertMany(entries);

    console.log(`导入完成：${entries.length} 条词条`);
  }

  // 搜索词条（支持拼音和汉字）
  searchWords(query: string, limit = 20) {
    const cacheKey = this.getCacheKey('searchWords', { query, limit });
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const stmt = this.db.prepare(`
      SELECT word, pinyin, weight, definition
      FROM words
      WHERE word LIKE ? OR pinyin LIKE ?
      ORDER BY weight DESC
      LIMIT ?
    `);

    const result = stmt.all(`%${query}%`, `%${query}%`, limit) as Array<{
      word: string;
      pinyin: string;
      weight: number;
      definition: string | null;
    }>;

    this.setCache(cacheKey, result);
    return result;
  }

  // 获取词条详情（包含释义和例句）
  getWordDetail(word: string) {
    const cacheKey = this.getCacheKey('getWordDetail', { word });
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const stmt = this.db.prepare(`
      SELECT * FROM words WHERE word = ?
      ORDER BY weight DESC
      LIMIT 1
    `);

    const result = stmt.get(word) as {
      id: number;
      word: string;
      pinyin: string;
      weight: number;
      definition: string | null;
      example: string | null;
      created_at: string;
    } | undefined;

    this.setCache(cacheKey, result);
    return result;
  }

  // 按音节检索
  searchBySyllable(syllable: string) {
    const cacheKey = this.getCacheKey('searchBySyllable', { syllable });
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const stmt = this.db.prepare(`
      SELECT DISTINCT w.word, w.pinyin, w.weight
      FROM words w
      JOIN syllable_words sw ON w.id = sw.word_id
      JOIN syllables s ON sw.syllable_id = s.id
      WHERE s.syllable = ?
      ORDER BY w.weight DESC
      LIMIT 50
    `);

    const result = stmt.all(syllable) as Array<{
      word: string;
      pinyin: string;
      weight: number;
    }>;

    this.setCache(cacheKey, result);
    return result;
  }

  // 获取所有音节
  getAllSyllables() {
    const cacheKey = this.getCacheKey('getAllSyllables', {});
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const stmt = this.db.prepare(`
      SELECT syllable, COUNT(*) as count
      FROM syllables
      JOIN syllable_words sw ON syllables.id = sw.syllable_id
      GROUP BY syllable
      ORDER BY syllable
    `);

    const result = stmt.all() as Array<{
      syllable: string;
      count: number;
    }>;

    this.setCache(cacheKey, result);
    return result;
  }

  close() {
    this.db.close();
  }
}
