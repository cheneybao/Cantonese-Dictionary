import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'server/data', 'dictionary.db');

export class DictionaryDatabase {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.initDatabase();
  }

  private initDatabase() {
    // 创建词条表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        pinyin TEXT NOT NULL,
        weight INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(word, pinyin)
      );

      CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
      CREATE INDEX IF NOT EXISTS idx_words_pinyin ON words(pinyin);
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

  // 导入词典数据
  importDictionary(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const insertWord = this.db.prepare(`
      INSERT OR IGNORE INTO words (word, pinyin, weight)
      VALUES (?, ?, ?)
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

    const insertMany = this.db.transaction((entries: Array<{word: string, pinyin: string, weight: number}>) => {
      for (const entry of entries) {
        // 插入词条
        insertWord.run(entry.word, entry.pinyin, entry.weight);

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
    const entries: Array<{word: string, pinyin: string, weight: number}> = [];
    for (const line of lines) {
      // 跳过注释和空行
      if (line.startsWith('#') || line.trim() === '') continue;

      // 解析行：汉字 拼音 词频
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const word = parts[0];
        const pinyin = parts[1];
        const weight = parts.length >= 3 ? parseInt(parts[2]) || 0 : 0;

        entries.push({ word, pinyin, weight });
      }
    }

    insertMany(entries);

    console.log(`导入完成：${entries.length} 条词条`);
  }

  // 搜索词条（支持拼音和汉字）
  searchWords(query: string, limit = 20) {
    const stmt = this.db.prepare(`
      SELECT word, pinyin, weight
      FROM words
      WHERE word LIKE ? OR pinyin LIKE ?
      ORDER BY weight DESC
      LIMIT ?
    `);

    return stmt.all(`%${query}%`, `%${query}%`, limit) as Array<{
      word: string;
      pinyin: string;
      weight: number;
    }>;
  }

  // 获取词条详情
  getWordDetail(word: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM words WHERE word = ?
      ORDER BY weight DESC
      LIMIT 1
    `);

    return stmt.get(word) as {
      id: number;
      word: string;
      pinyin: string;
      weight: number;
      created_at: string;
    } | undefined;
  }

  // 按音节检索
  searchBySyllable(syllable: string) {
    const stmt = this.db.prepare(`
      SELECT DISTINCT w.word, w.pinyin, w.weight
      FROM words w
      JOIN syllable_words sw ON w.id = sw.word_id
      JOIN syllables s ON sw.syllable_id = s.id
      WHERE s.syllable = ?
      ORDER BY w.weight DESC
      LIMIT 50
    `);

    return stmt.all(syllable) as Array<{
      word: string;
      pinyin: string;
      weight: number;
    }>;
  }

  // 获取所有音节
  getAllSyllables() {
    const stmt = this.db.prepare(`
      SELECT syllable, COUNT(*) as count
      FROM syllables
      JOIN syllable_words sw ON syllables.id = sw.syllable_id
      GROUP BY syllable
      ORDER BY syllable
    `);

    return stmt.all() as Array<{
      syllable: string;
      count: number;
    }>;
  }

  close() {
    this.db.close();
  }
}
