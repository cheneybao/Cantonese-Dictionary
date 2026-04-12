import { Database } from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'server', 'data', 'dictionary.db');
const OUTPUT_PATH = path.join(process.cwd(), 'src', 'data', 'dictionary.json');

console.log('开始转换数据库为 JSON...');

const db = new Database(DB_PATH);

// 查询所有词条
const words = db.prepare(`
  SELECT word, pinyin, definition, example
  FROM words
  ORDER BY weight DESC
`).all();

console.log(`找到 ${words.length} 条词条`);

// 查询所有音节
const syllables = db.prepare('SELECT syllable FROM syllables').all();

console.log(`找到 ${syllables.length} 个音节`);

// 构建音节索引（用于快速查找）
const syllableIndex: Record<string, string[]> = {};

syllables.forEach((syl: any) => {
  const initial = syl.syllable.charAt(0);
  if (!syllableIndex[initial]) {
    syllableIndex[initial] = [];
  }
  syllableIndex[initial].push(syl.syllable);
});

// 按声母分组并排序
for (const initial in syllableIndex) {
  syllableIndex[initial].sort();
}

// 构建单词索引（用于快速查找）
const wordIndex: Record<string, any> = {};

words.forEach((word: any) => {
  // 用首字建立索引
  const firstChar = word.word.charAt(0);
  if (!wordIndex[firstChar]) {
    wordIndex[firstChar] = [];
  }
  wordIndex[firstChar].push({
    word: word.word,
    jyutping: word.pinyin,
    definition: word.definition,
    example: word.example
  });
});

// 导出数据
const dictionaryData = {
  version: '1.0.0',
  exportDate: new Date().toISOString(),
  stats: {
    totalWords: words.length,
    totalSyllables: syllables.length,
    approxSize: JSON.stringify(words).length
  },
  words: words.map((word: any) => ({
    w: word.word,      // 压缩字段名
    j: word.pinyin,   // jyutping
    d: word.definition,
    e: word.example
  })),
  syllables: syllables.map((syl: any) => syl.syllable),
  syllableIndex,
  wordIndex
};

// 保存 JSON 文件
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dictionaryData, null, 2));

const stats = fs.statSync(OUTPUT_PATH);

console.log(`\n转换完成！`);
console.log(`输出文件: ${OUTPUT_PATH}`);
console.log(`文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`词条数: ${words.length}`);
console.log(`音节数: ${syllables.length}`);

db.close();
