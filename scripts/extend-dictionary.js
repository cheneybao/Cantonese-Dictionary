/**
 * 扩展词典数据
 * 合并多个数据源到主词典
 */

const fs = require('fs');
const path = require('path');

// 主词典路径
const mainDictionaryPath = path.join(__dirname, '../data/word.csv');
// 扩展数据路径
const extendedPath = path.join(__dirname, '../data/cantonese-extended.txt');
// 输出路径
const outputPath = path.join(__dirname, '../data/word-extended.csv');

// 读取主词典
const readMainDictionary = () => {
  const content = fs.readFileSync(mainDictionaryPath, 'utf8');
  const lines = content.split('\n');
  const dict = new Map();

  lines.forEach(line => {
    if (!line.trim()) return;
    const parts = line.split(',');
    if (parts.length >= 2) {
      const word = parts[0];
      const jyutping = parts[1];
      const definition = parts[2] || null;
      dict.set(word, { w: word, j: jyutping, d: definition, e: null });
    }
  });

  console.log(`主词典: ${dict.size} 条`);
  return dict;
};

// 读取扩展数据
const readExtendedData = () => {
  const content = fs.readFileSync(extendedPath, 'utf8');
  const lines = content.split('\n');
  const dict = new Map();

  lines.forEach(line => {
    if (!line.trim() || line.startsWith('#')) return;
    const parts = line.split('\t');
    if (parts.length >= 4) {
      const word = parts[0];
      const jyutping = parts[1];
      const definition = parts[3] || null;
      const example = parts[4] || null;
      dict.set(word, { w: word, j: jyutping, d: definition, e: example });
    }
  });

  console.log(`扩展数据: ${dict.size} 条`);
  return dict;
};

// 添加粤语特有词汇
const addCantoneseSpecificWords = (dict) => {
  const words = [
    // 商业/经济
    { w: '执笠', j: 'zap1 lap1', d: '倒闭；收档', e: '間舖執笠咗' },
    { w: '散水', j: 'saan2 seoi2', d: '解散；解散', e: '公司散水' },
    { w: '頂手', j: 'ding2 sau2', d: '承接生意', e: '頂手間舖' },
    { w: '落價', j: 'lok6 gaa3', d: '降价', e: '件貨落價賣' },
    { w: '平靓正', j: 'peng4 loeng6 zeng3', d: '便宜又好', e: '呢間鋪平靓正' },

    // 日常生活
    { w: '走堂', j: 'zau2 tong4', d: '逃课', e: '今日走堂' },
    { w: '收皮', j: 'sau1 pei4', d: '闭嘴；滚蛋', e: '你收皮啦' },
    { w: '收聲', j: 'sau1 seng1', d: '闭嘴', e: '收聲啦你' },
    { w: '收工', j: 'sau1 gung1', d: '下班', e: '五點收工' },
    { w: '返工', j: 'faan1 gung1', d: '上班', e: '九點返工' },

    // 情感/态度
    { w: '冇鬼用', j: 'mou5 gwai2 jung6', d: '没有用', e: '呢樣嘢冇鬼用' },
    { w: '好鬼正', j: 'hou2 gwai2 zeng3', d: '非常好', e: '個好鬼正' },
    { w: '好鬼煩', j: 'hou2 gwai2 faan4', d: '很烦人', e: '你好鬼煩' },
    { w: '好掂', j: 'hou2 dim6', d: '很好；很棒', e: '個好掂' },
    { w: '好大鑊', j: 'hou2 daai6 wok6', d: '很厉害；很严重', e: '件事好大鑊' },

    // 食物/饮食
    { w: '出街食', j: 'ceot1 gaai1 sik6', d: '出去吃饭', e: '今晚出街食' },
    { w: '飲茶', j: 'jam2 caa4', d: '喝早茶', e: '去飲茶' },
    { w: '下午茶', j: 'haa6 ng5 caa4', d: '下午茶点', e: '食下午茶' },
    { w: '宵夜', j: 'siu1 je6', d: '夜宵', e: '食宵夜' },

    // 动作/行为
    { w: '睇書', j: 'tai2 syu1', d: '读书', e: '去圖書館睇書' },
    { w: '瞓覺', j: 'fan3 gaau3', d: '睡觉', e: '早啲瞓覺' },
    { w: '沖涼', j: 'cung1 loeng4', d: '洗澡', e: '去沖涼' },
    { w: '行街', j: 'haang4 gaai1', d: '逛街', e: '去行街' },
    { w: '買嘢', j: 'maai5 je5', d: '买东西', e: '去買嘢' },

    // 人称/称呼
    { w: '我哋', j: 'ngo5 dei6', d: '我们', e: '我哋一齊去' },
    { w: '你哋', j: 'nei5 dei6', d: '你们', e: '你哋幾時去' },
    { w: '佢哋', j: 'keoi5 dei6', d: '他们', e: '佢哋去咗' },
    { w: '佢', j: 'keoi5', d: '他/她', e: '佢係我朋友' },

    // 其他常用词
    { w: '幾時', j: 'gei2 si4', d: '什么时候', e: '幾時去' },
    { w: '邊度', j: 'bin1 dou6', d: '哪里', e: '你去邊度' },
    { w: '做乜', j: 'zou6 mat1', d: '做什么', e: '你做乜' },
    { w: '好唔好', j: 'hou2 m4 hou2', d: '好不好', e: '去好唔好' },
    { w: '唔係', j: 'm4 hai6', d: '不是', e: '佢唔係嚟嘅' },
  ];

  words.forEach(word => {
    if (!dict.has(word.w)) {
      dict.set(word.w, word);
      console.log(`添加: ${word.w} - ${word.j} - ${word.d}`);
    }
  });

  console.log(`粤语特有词汇: ${words.length} 条`);
};

// 合并词典
const mergeDictionaries = () => {
  console.log('=== 开始合并词典 ===\n');

  const mainDict = readMainDictionary();
  const extendedDict = readExtendedData();

  // 合并扩展数据
  let addedCount = 0;
  extendedDict.forEach((value, key) => {
    if (!mainDict.has(key)) {
      mainDict.set(key, value);
      addedCount++;
    }
  });

  console.log(`从扩展数据添加: ${addedCount} 条\n`);

  // 添加粤语特有词汇
  addCantoneseSpecificWords(mainDict);

  // 转换为 CSV
  const csvContent = Array.from(mainDict.values())
    .map(word => {
      const parts = [word.w, word.j];
      if (word.d) parts.push(word.d);
      if (word.e) parts.push(word.e);
      return parts.join(',');
    })
    .join('\n');

  // 添加标题行
  const fullContent = 'char,jyutping,definition,example\n' + csvContent;

  // 写入文件
  fs.writeFileSync(outputPath, fullContent, 'utf8');

  console.log(`\n=== 合并完成 ===`);
  console.log(`原始词典: ${fs.statSync(mainDictionaryPath).size} bytes`);
  console.log(`扩展数据: ${fs.statSync(extendedPath).size} bytes`);
  console.log(`合并后: ${fs.statSync(outputPath).size} bytes`);
  console.log(`总词条数: ${mainDict.size} 条`);
  console.log(`输出文件: ${outputPath}`);
};

// 执行合并
mergeDictionaries();
