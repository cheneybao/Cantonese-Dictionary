#!/usr/bin/env node

/**
 * 将 CSV 词典数据转换为 JSON 格式
 * 用于纯前端部署（无需后端）
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'data', 'word.csv');
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary.json');

console.log('开始转换 CSV 为 JSON...');
console.log('CSV 文件:', CSV_PATH);

if (!fs.existsSync(CSV_PATH)) {
  console.error('CSV 文件不存在:', CSV_PATH);
  process.exit(1);
}

// 读取 CSV 文件
const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = csvContent.split('\n');

// 跳过文件头
const dataLines = lines.slice(1).filter(line => line.trim() !== '');

console.log(`找到 ${dataLines.length} 行数据`);

// 解析 CSV 并构建数据结构
const words = [];
const syllables = new Set();
const wordIndex = {};

dataLines.forEach((line) => {
  const parts = line.trim().split(',');
  if (parts.length >= 2) {
    const word = parts[0];
    const pinyin = parts[1];

    // 验证拼音有效性
    const hasValidSyllable = pinyin.split(' ').some(syl => {
      return /^[a-z]+\d+$/.test(syl);
    });

    if (hasValidSyllable) {
      words.push({
        w: word,
        j: pinyin,
        d: null,
        e: null
      });

      // 收集音节
      const sylList = pinyin.split(' ');
      sylList.forEach(syl => {
        if (/^[a-z]+\d+$/.test(syl)) {
          syllables.add(syl);
        }
      });

      // 建立索引
      const firstChar = word.charAt(0);
      if (!wordIndex[firstChar]) {
        wordIndex[firstChar] = [];
      }
      wordIndex[firstChar].push({
        w: word,
        j: pinyin
      });
    }
  }
});

// 构建音节索引
const syllableIndex = {};

syllables.forEach((syl) => {
  const initial = syl.charAt(0);
  if (!syllableIndex[initial]) {
    syllableIndex[initial] = [];
  }
  syllableIndex[initial].push(syl);
});

// 按声母分组并排序
for (const initial in syllableIndex) {
  syllableIndex[initial].sort();
}

// 导出数据
const dictionaryData = {
  v: '1.2.0',
  date: new Date().toISOString(),
  stats: {
    words: words.length,
    syllables: syllables.size
  },
  w: words,
  s: Array.from(syllables),
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
console.log(`🔊 音节数: ${syllables.size}`);

// 估算 IndexedDB 存储大小
const estimatedSize = stats.size;
console.log(`\n💡 估算 IndexedDB 存储空间:`);
console.log(`   - 压缩后: ${(estimatedSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   - 浏览器 IndexedDB 限制: 通常 > 50 MB`);
console.log(`   - 结论: ✅ 可以完全存储在本地`);
