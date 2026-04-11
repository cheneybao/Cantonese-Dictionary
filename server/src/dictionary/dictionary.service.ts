import { Injectable } from '@nestjs/common';

export interface Suggestion {
  word: string;
  jyutping: string;
  type: 'word' | 'syllable';
}

export interface WordDetail {
  id: string;
  word: string;
  jyutping: string;
  pronunciation?: string[];
  definition?: string;
  examples?: {
    chinese: string;
    jyutping: string;
    english?: string;
  }[];
  related?: string[];
  tones?: {
    tone: string;
    value: string;
    description?: string;
  }[];
}

export interface SyllableGroup {
  initial: string;
  syllables: string[];
}

@Injectable()
export class DictionaryService {
  // 模拟数据 - 实际应该从数据库或文件中读取
  private mockDictionary: WordDetail[] = [
    {
      id: '1',
      word: '粤拼',
      jyutping: 'jyut6 ping3',
      definition: '粤拼，粤语拼音方案的一种，由香港语言学学会制定。',
      examples: [
        {
          chinese: '粤拼',
          jyutping: 'jyut6 ping3',
          english: 'Cantonese Romanization'
        },
        {
          chinese: '粤语',
          jyutping: 'jyut6 jyu5',
          english: 'Cantonese'
        }
      ],
      related: ['粤语', '拼音', '声调']
    },
    {
      id: '2',
      word: '粤语',
      jyutping: 'jyut6 jyu5',
      definition: '粤语，又称广东话、广府话、白话，是一种声调语言，属汉藏语系汉语族。',
      examples: [
        {
          chinese: '我会说粤语',
          jyutping: 'ngo5 wui5 sek3 jyut6 jyu5',
          english: 'I can speak Cantonese'
        }
      ],
      related: ['粤拼', '普通话', '客家话']
    },
    {
      id: '3',
      word: '你好',
      jyutping: 'nei5 hou2',
      definition: '问候语，相当于普通话的"你好"。',
      examples: [
        {
          chinese: '你好',
          jyutping: 'nei5 hou2',
          english: 'Hello'
        },
        {
          chinese: '你好吗？',
          jyutping: 'nei5 hou2 maa1?',
          english: 'How are you?'
        }
      ],
      related: ['早晨', '拜拜', '多谢']
    },
    {
      id: '4',
      word: '早晨',
      jyutping: 'zou2 san4',
      definition: '早上好，早安的粤语说法。',
      examples: [
        {
          chinese: '早晨！',
          jyutping: 'zou2 san4!',
          english: 'Good morning!'
        }
      ],
      related: ['你好', '晚安', '你好吗']
    },
    {
      id: '5',
      word: '多谢',
      jyutping: 'do1 ze6',
      definition: '谢谢的粤语说法。',
      examples: [
        {
          chinese: '多谢你',
          jyutping: 'do1 ze6 nei5',
          english: 'Thank you'
        }
      ],
      related: ['唔该', '拜拜', '你好']
    },
    {
      id: '6',
      word: '唔该',
      jyutping: 'm4 goi1',
      definition: '粤语常用语，可以表示谢谢或麻烦你。',
      examples: [
        {
          chinese: '唔该晒',
          jyutping: 'm4 goi1 saai3',
          english: 'Thank you very much'
        }
      ],
      related: ['多谢', '麻烦', '唔该晒']
    },
    {
      id: '7',
      word: '食饭',
      jyutping: 'sik6 faan6',
      definition: '吃饭，用餐。',
      examples: [
        {
          chinese: '我哋去食饭',
          jyutping: 'ngo5 dei6 heoi3 sik6 faan6',
          english: 'Let\'s go eat'
        }
      ],
      related: ['饮水', '午餐', '晚餐']
    },
    {
      id: '8',
      word: '饮水',
      jyutping: 'jam2 seoi2',
      definition: '喝水。',
      examples: [
        {
          chinese: '饮啲水',
          jyutping: 'jam2 di1 seoi2',
          english: 'Drink some water'
        }
      ],
      related: ['食饭', '咖啡', '茶']
    }
  ];

  private mockSyllableGroups: SyllableGroup[] = [
    {
      initial: 'b',
      syllables: ['baa1', 'baa2', 'baa3', 'baa6', 'bai1', 'bai2', 'bai3', 'ban1', 'ban2', 'ban3', 'ban4', 'ban6', 'bat1', 'bau1', 'bau2', 'bau3', 'bau4', 'bau6', 'bei1', 'bei2', 'bei3', 'bik1', 'bin1', 'bin2', 'bin3', 'bin6', 'bit1', 'biu1', 'biu2', 'biu3', 'biu4', 'bo1', 'bo2', 'bo3', 'bo6', 'bok1', 'bong1', 'bong2', 'bong3', 'bong4', 'bong6', 'bou1', 'bou2', 'bou3', 'bou6', 'buk1']
    },
    {
      initial: 'p',
      syllables: ['pa1', 'pa2', 'pa3', 'pa4', 'pa5', 'paai1', 'paai2', 'paai3', 'paai4', 'paan1', 'paan2', 'paan3', 'paan4', 'paan6', 'pat1', 'pau1', 'pau2', 'pau3', 'pau4', 'pau5', 'pei1', 'pei2', 'pei3', 'pik1', 'pin1', 'pin2', 'pin3', 'pit1', 'piu1', 'piu2', 'piu3', 'po1', 'po2', 'po3', 'po4', 'pok1', 'pong1', 'pong2', 'pong3', 'pong4', 'pou1', 'pou2', 'pou3', 'pou4', 'pou5', 'pou6', 'puk1']
    },
    {
      initial: 'm',
      syllables: ['ma1', 'ma2', 'ma3', 'ma4', 'ma5', 'maai1', 'maai2', 'maai3', 'maai4', 'maan1', 'maan2', 'maan3', 'maan4', 'maan5', 'maan6', 'mat1', 'mau1', 'mau2', 'mau4', 'mau5', 'mei1', 'mei2', 'mei3', 'mei4', 'mei5', 'mei6', 'mek6', 'min1', 'min2', 'min5', 'min6', 'mit1', 'miu1', 'miu2', 'miu3', 'miu4', 'miu5', 'mo1', 'mo2', 'mo4', 'mo5', 'mo6', 'mok1', 'mong1', 'mong2', 'mong3', 'mong4', 'mong5', 'mong6', 'mou1', 'mou2', 'mou4', 'mou5', 'mou6', 'muk1', 'mun1', 'mun2', 'mun4', 'mun5', 'mut1']
    },
    {
      initial: 'f',
      syllables: ['fa1', 'fa2', 'fa3', 'fa4', 'faai1', 'faai2', 'faai3', 'faan1', 'faan2', 'faan3', 'faan4', 'faan6', 'faat1', 'fau1', 'fau2', 'fau3', 'fei1', 'fei2', 'fei3', 'fei4', 'fei5', 'fei6', 'fik1', 'fik6', 'fan1', 'fan2', 'fan3', 'fan4', 'fan6', 'fan1', 'fan2', 'fat1', 'fau1', 'fau2', 'fau3', 'fau4', 'fau5', 'fau6', 'fo1', 'fo2', 'fo3', 'fo4', 'fok1', 'fong1', 'fong2', 'fong3', 'fong4', 'fong6', 'fou1', 'fou2', 'fou3', 'fou4', 'fou5', 'fou6', 'fuk1', 'fuk6', 'fun1', 'fun2', 'fun3', 'fun4', 'fun6', 'fut1']
    },
    {
      initial: 'd',
      syllables: ['daai1', 'daai2', 'daai3', 'daai6', 'daai3', 'daai6', 'daan1', 'daan2', 'daan3', 'daan6', 'daat1', 'dau1', 'dau2', 'dau3', 'dau4', 'dau6', 'dai1', 'dai2', 'dai3', 'dai5', 'dai6', 'dan1', 'dan2', 'dan3', 'dan6', 'dang1', 'dang2', 'dang3', 'dang6', 'dap1', 'dau1', 'dau2', 'dau3', 'dau4', 'dau5', 'dau6', 'dei1', 'dei2', 'dei6', 'dek6', 'dek1', 'din1', 'din2', 'din3', 'din6', 'dip1', 'diu1', 'diu2', 'diu3', 'diu4', 'diu5', 'diu6', 'dit1', 'do1', 'do2', 'do3', 'do6', 'doek3', 'doek3', 'doek6', 'doeng1', 'doeng2', 'doeng3', 'doeng6', 'dong1', 'dong2', 'dong3', 'dong6', 'dou1', 'dou2', 'dou3', 'dou4', 'dou5', 'dou6', 'duk1', 'duk6', 'dung1', 'dung2', 'dung3', 'dung6', 'dut1']
    },
    {
      initial: 't',
      syllables: ['taa1', 'taa2', 'taa3', 'taa4', 'taa5', 'taai1', 'taai2', 'taai3', 'taan1', 'taan2', 'taan3', 'taan4', 'taan5', 'taan6', 'taat1', 'tau1', 'tau2', 'tau3', 'tau4', 'tau5', 'tau6', 'tai1', 'tai2', 'tai3', 'tai4', 'tai5', 'tai6', 'tan1', 'tan2', 'tan3', 'tan4', 'tan5', 'tan6', 'tang1', 'tang2', 'tang3', 'tang4', 'tang5', 'tang6', 'tap1', 'tau1', 'tau2', 'tau3', 'tau4', 'tau5', 'tau6', 'teoi1', 'teoi2', 'teoi3', 'teoi4', 'teoi5', 'teoi6', 'toi1', 'toi2', 'toi3', 'toi4', 'toi5', 'toi6', 'tong1', 'tong2', 'tong3', 'tong4', 'tong5', 'tong6', 'tou1', 'tou2', 'tou3', 'tou4', 'tou5', 'tou6', 'tuk1', 'tung1', 'tung2', 'tung3', 'tung4', 'tung5', 'tung6', 'tut1']
    }
  ];

  // 获取联想建议
  async getSuggestions(query: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // 搜索汉字匹配
    for (const item of this.mockDictionary) {
      if (item.word.includes(query)) {
        suggestions.push({
          word: item.word,
          jyutping: item.jyutping,
          type: 'word'
        });
      }
    }

    // 搜索粤拼音节匹配
    for (const group of this.mockSyllableGroups) {
      for (const syllable of group.syllables) {
        const toneless = syllable.replace(/\d+$/, '');
        if (toneless.startsWith(lowerQuery) || syllable.startsWith(lowerQuery)) {
          suggestions.push({
            word: syllable,
            jyutping: syllable,
            type: 'syllable'
          });
        }
      }
    }

    // 去重并限制数量
    const uniqueSuggestions = suggestions.filter((value, index, self) =>
      index === self.findIndex((t) => (
        t.word === value.word && t.jyutping === value.jyutping
      ))
    );

    return uniqueSuggestions.slice(0, 10);
  }

  // 获取词条详情
  async getDetail(word: string): Promise<WordDetail | null> {
    return this.mockDictionary.find(item => item.word === word) || null;
  }

  // 按声母获取音节
  async getSyllablesByInitial(initial: string): Promise<SyllableGroup[]> {
    return this.mockSyllableGroups.filter(group => group.initial === initial);
  }

  // 按粤拼音节查找词语
  async getByJyutping(jyutping: string): Promise<WordDetail[]> {
    const tonelessJyutping = jyutping.replace(/\d+$/, '');
    return this.mockDictionary.filter(item => {
      const itemToneless = item.jyutping.replace(/\d+$/, '');
      return itemToneless === tonelessJyutping || item.jyutping === jyutping;
    });
  }

  // 获取所有声母
  getInitials(): string[] {
    return this.mockSyllableGroups.map(group => group.initial);
  }

  // 获取无声调音节列表
  getTonelessSyllables(syllables: string[]): string[] {
    const tonelessSet = new Set<string>();
    syllables.forEach(syllable => {
      const toneless = syllable.replace(/\d+$/, '');
      tonelessSet.add(toneless);
    });
    return Array.from(tonelessSet).sort();
  }
}
