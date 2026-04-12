import { Controller, Post, Body, Get } from '@nestjs/common';
import { DictionaryService } from './dictionary.service';

@Controller('dictionary')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  /**
   * 获取联想建议
   * POST /api/dictionary/suggestions
   */
  @Post('suggestions')
  async getSuggestions(@Body() body: { query: string }) {
    const { query } = body;

    if (!query || query.trim().length === 0) {
      return {
        code: 200,
        message: 'success',
        data: []
      };
    }

    const suggestions = await this.dictionaryService.getSuggestions(query.trim());

    return {
      code: 200,
      message: 'success',
      data: suggestions
    };
  }

  /**
   * 获取词条详情
   * POST /api/dictionary/detail
   */
  @Post('detail')
  async getDetail(@Body() body: { word: string }) {
    const { word } = body;

    if (!word || word.trim().length === 0) {
      return {
        code: 400,
        message: 'word is required',
        data: null
      };
    }

    const detail = await this.dictionaryService.getDetail(word.trim());

    return {
      code: 200,
      message: 'success',
      data: detail
    };
  }

  /**
   * 按声母获取音节
   * POST /api/dictionary/syllables
   */
  @Post('syllables')
  async getSyllables(@Body() body: { initial: string }) {
    const { initial } = body;

    if (!initial || initial.trim().length === 0) {
      return {
        code: 400,
        message: 'initial is required',
        data: null
      };
    }

    const syllableGroups = await this.dictionaryService.getSyllablesByInitial(initial.trim());

    return {
      code: 200,
      message: 'success',
      data: syllableGroups
    };
  }

  /**
   * 按粤拼音节查找词语
   * POST /api/dictionary/by-jyutping
   */
  @Post('by-jyutping')
  async getByJyutping(@Body() body: { jyutping: string }) {
    const { jyutping } = body;

    if (!jyutping || jyutping.trim().length === 0) {
      return {
        code: 400,
        message: 'jyutping is required',
        data: []
      };
    }

    const words = await this.dictionaryService.getByJyutping(jyutping.trim());

    return {
      code: 200,
      message: 'success',
      data: words
    };
  }

  /**
   * 获取所有声母列表
   * GET /api/dictionary/initials
   */
  @Get('initials')
  async getInitials() {
    const initials = this.dictionaryService.getInitials();

    return {
      code: 200,
      message: 'success',
      data: initials
    };
  }

  /**
   * 导入词典数据
   * POST /api/dictionary/import
   */
  @Post('import')
  async importData() {
    try {
      // 数据已在服务初始化时导入
      return {
        code: 200,
        message: 'import success',
        data: {
          syllables: this.dictionaryService.getAllSyllables().length
        }
      };
    } catch (error) {
      return {
        code: 500,
        message: 'import failed',
        data: null
      };
    }
  }

  /**
   * 获取所有音节
   * GET /api/dictionary/syllables-all
   */
  @Get('syllables-all')
  async getAllSyllables() {
    try {
      const syllables = this.dictionaryService.getAllSyllables();
      return {
        code: 200,
        message: 'success',
        data: syllables
      };
    } catch (error) {
      return {
        code: 500,
        message: 'failed to get syllables',
        data: []
      };
    }
  }
}
