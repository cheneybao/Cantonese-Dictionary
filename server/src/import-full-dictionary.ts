import { DictionaryDatabase } from './database/dictionary-db';
import * as fs from 'fs';
import * as path from 'path';

async function importRimeDictionary() {
  console.log('开始导入 Rime Cantonese 词典数据...');

  const db = new DictionaryDatabase();

  // 导入扩展词典数据（包含释义和例句）
  const extendedDataPath = path.join(process.cwd(), '..', 'data', 'cantonese-extended.txt');
  console.log('扩展数据文件路径：', extendedDataPath);
  if (fs.existsSync(extendedDataPath)) {
    db.importDictionary(extendedDataPath);
  }

  // 导入 Rime Cantonese 单字词典
  const rimeDataPath = path.join(process.cwd(), '..', 'data', 'rime-cantonese-chars.txt');
  console.log('\nRime 数据文件路径：', rimeDataPath);

  if (!fs.existsSync(rimeDataPath)) {
    console.log('Rime 词典文件不存在，跳过导入');
  } else {
    const content = fs.readFileSync(rimeDataPath, 'utf-8');
    const lines = content.split('\n');

    let count = 0;
    const insertWord = db['db'].prepare(`
      INSERT OR IGNORE INTO words (word, pinyin, weight)
      VALUES (?, ?, ?)
    `);

    const insertSyllable = db['db'].prepare(`
      INSERT OR IGNORE INTO syllables (syllable)
      VALUES (?)
    `);

    const getSyllableId = db['db'].prepare(`
      SELECT id FROM syllables WHERE syllable = ?
    `);

    const getWordId = db['db'].prepare(`
      SELECT id FROM words WHERE word = ? AND pinyin = ?
    `);

    const linkSyllableWord = db['db'].prepare(`
      INSERT OR IGNORE INTO syllable_words (syllable_id, word_id)
      VALUES (?, ?)
    `);

    // 跳过文件头（以 --- 结束）
    let skipHeader = true;

    const insertMany = db['db'].transaction((entries: Array<{word: string, pinyin: string, weight: number}>) => {
      for (const entry of entries) {
        // 插入词条
        insertWord.run(entry.word, entry.pinyin, entry.weight);

        // 获取词条 ID
        const word = getWordId.get(entry.word, entry.pinyin) as {id: number};
        const wordId = word.id;

        if (wordId) {
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
              if (syllableId) {
                linkSyllableWord.run(syllableId, wordId);
              }
            }
          }
        }
      }
    });

    const entries: Array<{word: string, pinyin: string, weight: number}> = [];

    for (const line of lines) {
      // 跳过注释和空行
      if (line.startsWith('#') || line.trim() === '') continue;

      // 跳过文件头
      if (skipHeader) {
        if (line.startsWith('---') || line.startsWith('...')) {
          continue;
        }
        if (line.startsWith('name:') || line.startsWith('version:') || line.startsWith('sort:')) {
          continue;
        }
        // 遇到第一个有效行，停止跳过
        skipHeader = false;
      }

      // 解析行：汉字 拼音 [词频]
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const word = parts[0];
        const pinyin = parts[1];
        const weight = parts.length >= 3 ? parseInt(parts[2]) || 0 : 0;

        // 验证拼音有效性
        const hasValidSyllable = pinyin.split(' ').some(syl => {
          return /^[a-z]+\d+$/.test(syl);
        });

        if (hasValidSyllable) {
          entries.push({ word, pinyin, weight });
          count++;

          // 每 1000 条提交一次
          if (entries.length >= 1000) {
            insertMany(entries);
            entries.length = 0;
            console.log(`已导入 ${count} 条...`);
          }
        }
      }
    }

    // 导入剩余的条目
    if (entries.length > 0) {
      insertMany(entries);
    }

    console.log(`Rime 词典导入完成：${count} 条单字`);
  }

  // 统计数据
  const wordCount = db['db'].prepare('SELECT COUNT(*) as count FROM words').get();
  const syllableCount = db['db'].prepare('SELECT COUNT(*) as count FROM syllables').get();

  console.log(`\n最终统计：`);
  console.log(`  总词条数：${wordCount.count}`);
  console.log(`  总音节数：${syllableCount.count}`);

  // 测试查询
  console.log('\n测试查询功能：');
  console.log('搜索 "你好"：', db.searchWords('你好', 5));
  console.log('搜索 "一"：', db.searchWords('一', 5));
  console.log('获取词条详情（"一"）：', db.getWordDetail('一'));

  db.close();
  console.log('\n导入完成！');
}

importRimeDictionary().catch(console.error);
