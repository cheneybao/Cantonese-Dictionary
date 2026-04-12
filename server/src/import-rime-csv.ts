import { DictionaryDatabase } from './database/dictionary-db';
import * as fs from 'fs';
import * as path from 'path';

async function importRimeCSV() {
  console.log('开始导入 Rime Cantonese CSV 词库数据...');

  const db = new DictionaryDatabase();

  // 导入词语词库（word.csv）
  const wordCSVPath = path.join(process.cwd(), '..', 'data', 'word.csv');
  console.log('\n词语词库文件路径：', wordCSVPath);

  if (fs.existsSync(wordCSVPath)) {
    importCSVFile(db, wordCSVPath, '词语');
  } else {
    console.log('词语词库文件不存在，跳过导入');
  }

  // 导入专有名词词库（proper_nouns.csv）
  const properNounsCSVPath = path.join(process.cwd(), '..', 'data', 'proper_nouns.csv');
  console.log('\n专有名词词库文件路径：', properNounsCSVPath);

  if (fs.existsSync(properNounsCSVPath)) {
    importCSVFile(db, properNounsCSVPath, '专有名词');
  } else {
    console.log('专有名词词库文件不存在，跳过导入');
  }

  // 统计数据
  const wordCount = db['db'].prepare('SELECT COUNT(*) as count FROM words').get();
  const syllableCount = db['db'].prepare('SELECT COUNT(*) as count FROM syllables').get();

  console.log(`\n最终统计：`);
  console.log(`  总词条数：${wordCount.count}`);
  console.log(`  总音节数：${syllableCount.count}`);

  // 测试查询
  console.log('\n测试查询功能：');
  console.log('搜索 "食飯"：', db.searchWords('食飯', 5));
  console.log('搜索 "飲水"：', db.searchWords('飲水', 5));
  console.log('搜索 "瞓覺"：', db.searchWords('瞓覺', 5));
  console.log('搜索 "返工"：', db.searchWords('返工', 5));
  console.log('搜索 "放工"：', db.searchWords('放工', 5));
  console.log('获取词条详情（"食飯"）：', db.getWordDetail('食飯'));

  db.close();
  console.log('\n导入完成！');
}

function importCSVFile(db: DictionaryDatabase, filePath: string, fileType: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // 跳过文件头
  const dataLines = lines.slice(1).filter(line => line.trim() !== '');

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

  const insertMany = db['db'].transaction((entries: Array<{word: string, pinyin: string}>) => {
    for (const entry of entries) {
      // 插入词条
      insertWord.run(entry.word, entry.pinyin, 50); // 使用中等权重

      // 获取词条 ID
      const word = getWordId.get(entry.word, entry.pinyin) as {id: number};
      const wordId = word.id;

      if (wordId) {
        // 提取音节（按空格分割）
        const syllables = entry.pinyin.split(' ');
        for (const syl of syllables) {
          if (syl && /^[a-z]+\d+$/.test(syl)) {
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

  const entries: Array<{word: string, pinyin: string}> = [];

  for (const line of dataLines) {
    // 解析 CSV 行：char,jyutping
    const parts = line.trim().split(',');
    if (parts.length >= 2) {
      const word = parts[0];
      const pinyin = parts[1];

      // 验证拼音有效性
      const hasValidSyllable = pinyin.split(' ').some(syl => {
        return /^[a-z]+\d+$/.test(syl);
      });

      if (hasValidSyllable) {
        entries.push({ word, pinyin });

        // 每 1000 条提交一次
        if (entries.length >= 1000) {
          insertMany(entries);
          entries.length = 0;
          console.log(`${fileType}导入进度：${entries.length / 1000 * 1000} 条...`);
        }
      }
    }
  }

  // 导入剩余的条目
  if (entries.length > 0) {
    insertMany(entries);
  }

  console.log(`${fileType}导入完成：${dataLines.length} 条`);
}

importRimeCSV().catch(console.error);
