import { DictionaryDatabase } from './database/dictionary-db';
import * as path from 'path';

async function importDictionary() {
  console.log('开始导入词典数据...');

  const db = new DictionaryDatabase();

  // 导入扩展词典数据
  const dataPath = path.join(process.cwd(), '..', 'data', 'cantonese-extended.txt');
  console.log('数据文件路径：', dataPath);
  db.importDictionary(dataPath);

  // 测试查询
  console.log('\n测试查询功能：');
  console.log('搜索 "你好"：', db.searchWords('你好', 5));
  console.log('搜索 "nei5"：', db.searchWords('nei5', 5));
  console.log('按音节 "nei5" 检索：', db.searchBySyllable('nei5'));

  console.log('\n获取词条详情（"你好"）：');
  const detail = db.getWordDetail('你好');
  console.log(detail);

  console.log('\n获取所有音节（前10个）：');
  const syllables = db.getAllSyllables().slice(0, 10);
  console.log(syllables);

  db.close();
  console.log('\n导入完成！');
}

importDictionary().catch(console.error);
