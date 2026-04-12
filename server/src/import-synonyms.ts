import { DictionaryDatabase } from './database/dictionary-db';
import * as fs from 'fs';
import * as path from 'path';

async function importSynonyms() {
  console.log('开始导入普通话-粤语同义词映射...');

  const db = new DictionaryDatabase();

  // 导入同义词映射
  const synonymsFilePath = path.join(process.cwd(), '..', 'data', 'mandarin-cantonese-synonyms.txt');
  console.log('同义词映射文件路径：', synonymsFilePath);

  if (!fs.existsSync(synonymsFilePath)) {
    console.log('同义词映射文件不存在，跳过导入');
  } else {
    db.importSynonyms(synonymsFilePath);
  }

  // 测试查询
  console.log('\n测试同义词查询功能：');
  const testCases = [
    { mandarin: '吃饭', cantonese: '食飯' },
    { mandarin: '为什么', cantonese: '點解' },
    { mandarin: '睡觉', cantonese: '瞓覺' },
    { mandarin: '喝水', cantonese: '飲水' },
    { mandarin: '上班', cantonese: '返工' },
    { mandarin: '下班', cantonese: '放工' },
    { mandarin: '谢谢', cantonese: '多謝' },
    { mandarin: '对不起', cantonese: '對唔住' }
  ];

  for (const testCase of testCases) {
    const synonym = db.getCantoneseSynonym(testCase.mandarin);
    console.log(`"${testCase.mandarin}" → "${synonym}" ${synonym === testCase.cantonese ? '✅' : '❌'}`);
  }

  db.close();
  console.log('\n导入完成！');
}

importSynonyms().catch(console.error);
