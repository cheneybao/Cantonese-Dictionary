#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'src', 'static', 'data', 'dictionary.json');

console.log('检查词典数据文件...');
console.log('文件路径:', DATA_PATH);

if (!fs.existsSync(DATA_PATH)) {
  console.error('文件不存在:', DATA_PATH);
  process.exit(1);
}

const stats = fs.statSync(DATA_PATH);
console.log('文件大小:', (stats.size / 1024 / 1024).toFixed(2), 'MB');

// 读取文件
console.log('读取文件内容...');
const jsonContent = fs.readFileSync(DATA_PATH, 'utf-8');
console.log('JSON 长度:', jsonContent.length);

// 解析 JSON
console.log('解析 JSON...');
const data = JSON.parse(jsonContent);

console.log('\n========== 数据结构 ==========');
console.log('版本:', data.v);
console.log('日期:', data.date);
console.log('统计:', data.stats);

console.log('\n========== 词条数据 ==========');
console.log('词条数组长度:', data.w ? data.w.length : 0);

if (data.w && data.w.length > 0) {
  console.log('\n前10条词条:');
  data.w.slice(0, 10).forEach((item, index) => {
    console.log(`\n#${index + 1}`);
    console.log('  词条 (w):', JSON.stringify(item.w));
    console.log('  粤拼 (j):', JSON.stringify(item.j));
    console.log('  释义 (d):', JSON.stringify(item.d ? item.d.substring(0, 50) : null));
    console.log('  例句 (e):', JSON.stringify(item.e ? item.e.substring(0, 50) : null));
  });

  // 搜索"你好"
  console.log('\n========== 搜索"你好" ==========');
  const hello = data.w.find(item => item.w === '你好');
  if (hello) {
    console.log('找到"你好":', hello);
  } else {
    console.log('未找到"你好"');
    // 搜索包含"你"的词条
    const withYou = data.w.filter(item => item.w && item.w.includes('你')).slice(0, 10);
    console.log('包含"你"的词条（前10条）:', withYou);
  }

  // 搜索有释义的词条
  console.log('\n========== 搜索有释义的词条 ==========');
  const wordsWithDefinition = data.w.filter(item => item.d && item.d !== null).slice(0, 10);
  console.log('有释义的词条数量:', data.w.filter(item => item.d && item.d !== null).length);
  console.log('前10条有释义的词条:');
  wordsWithDefinition.forEach((item, index) => {
    console.log(`#${index + 1}: ${item.w} - ${item.d.substring(0, 50)}...`);
  });

  // 搜索空词条
  console.log('\n========== 检查空词条 ==========');
  const emptyWords = data.w.filter(item => !item.w || item.w === '');
  console.log('空词条数量:', emptyWords.length);
  if (emptyWords.length > 0) {
    console.log('前5条空词条:');
    emptyWords.slice(0, 5).forEach((item, index) => {
      console.log(`#${index + 1}:`, item);
    });
  }
} else {
  console.log('词条数据为空！');
}
