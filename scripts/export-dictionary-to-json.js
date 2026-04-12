#!/usr/bin/env node

/**
 * 将 SQLite 词典数据转换为 JSON 格式
 * 用于纯前端部署（无需后端）
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'server', 'data', 'dictionary.db');
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary.json');

console.log('开始转换数据库为 JSON...');
console.log('数据库路径:', DB_PATH);

if (!fs.existsSync(DB_PATH)) {
  console.error('数据库文件不存在:', DB_PATH);
  console.log('请先运行数据导入脚本');
  process.exit(1);
}

const db = new Database(DB_PATH);

// 查询所有词条
console.log('查询词条...');
const words = db.prepare(`
  SELECT word, pinyin, definition, example
  FROM words
  ORDER BY weight DESC
`).all();

console.log(`找到 ${words.length} 条词条`);

// 查询所有音节
console.log('查询音节...');
const syllables = db.prepare('SELECT syllable FROM syllables').all();

console.log(`找到 ${syllables.length} 个音节`);

// 构建音节索引（用于快速查找）
const syllableIndex = {};

syllables.forEach((syl) => {
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
const wordIndex = {};

words.forEach((word) => {
  // 用首字建立索引
  const firstChar = word.word.charAt(0);
  if (!wordIndex[firstChar]) {
    wordIndex[firstChar] = [];
  }
  wordIndex[firstChar].push({
    w: word.word,      // 压缩字段名
    j: word.pinyin,   // jyutping
    d: word.definition,
    e: word.example
  });
});

// 压缩数据格式
const compressedWords = words.map((word) => ({
  w: word.word,
  j: word.pinyin,
  d: word.definition,
  e: word.example
}));

// 导出数据
const dictionaryData = {
  v: '1.0.0',
  date: new Date().toISOString(),
  stats: {
    words: words.length,
    syllables: syllables.length
  },
  w: compressedWords,
  s: syllables.map(s => s.syllable),
  si: syllableIndex,
  wi: wordIndex
};

console.log('压缩数据...');
const jsonString = JSON.stringify(dictionaryData);

console.log(`JSON 大小: ${(jsonString.length / 1024 / 1024).toFixed(2)} MB`);

// 创建输出目录
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 保存 JSON 文件
fs.writeFileSync(OUTPUT_PATH, jsonString);

const stats = fs.statSync(OUTPUT_PATH);

console.log(`\n✅ 转换完成！`);
console.log(`📁 输出文件: ${OUTPUT_PATH}`);
console.log(`📦 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`📚 词条数: ${words.length}`);
console.log(`🔊 音节数: ${syllables.length}`);

db.close();
