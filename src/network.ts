import Taro from '@tarojs/taro'
import { localDictionary } from '@/services/local-dictionary'

/**
 * 网络请求模块
 * 封装 Taro.request、Taro.uploadFile、Taro.downloadFile，自动添加项目域名前缀
 * 如果请求的 url 以 http:// 或 https:// 开头，则不会添加域名前缀
 *
 * 纯前端模式：词典 API 请求使用 IndexedDB 本地数据
 * 环境变量 VITE_USE_LOCAL_API=true 时启用纯前端模式（默认启用）
 *
 * IMPORTANT: 项目已经全局注入 PROJECT_DOMAIN
 * IMPORTANT: 除非你需要添加全局参数，如给所有请求加上 header，否则不能修改此文件
 */

// 环境配置
// VITE_USE_LOCAL_API=false 时使用远程后端，否则使用 IndexedDB 本地数据
// 默认使用本地 API（生产环境无需后端）
const USE_LOCAL_API = String((import.meta as any).env?.VITE_USE_LOCAL_API || 'true') !== 'false';
console.log('[Network] USE_LOCAL_API:', USE_LOCAL_API, 'VITE_USE_LOCAL_API:', (import.meta as any).env?.VITE_USE_LOCAL_API);

// 确保 PROJECT_DOMAIN 有默认值
const PROJECT_DOMAIN_VALUE = typeof PROJECT_DOMAIN !== 'undefined' ? PROJECT_DOMAIN : '';
console.log('[Network] PROJECT_DOMAIN:', PROJECT_DOMAIN_VALUE);

export namespace Network {
    const createUrl = (url: string): string => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        return `${PROJECT_DOMAIN_VALUE}${url}`
    }

    // 本地 API 路由处理
    const isLocalApiRoute = (url: string): boolean => {
        console.log('[Network] isLocalApiRoute 检查 URL:', url, 'USE_LOCAL_API:', USE_LOCAL_API);

        // 检查是否是相对路径的词典 API
        if (USE_LOCAL_API && url.startsWith('/api/dictionary')) {
            console.log('[Network] 匹配相对路径 API');
            return true
        }
        // 检查是否是完整 URL 的词典 API（用于处理已经被转换后的 URL）
        if (USE_LOCAL_API) {
            try {
                const urlObj = new URL(url)
                const isMatch = urlObj.pathname.startsWith('/api/dictionary')
                console.log('[Network] 完整 URL pathname:', urlObj.pathname, '匹配:', isMatch);
                return isMatch
            } catch {
                console.log('[Network] URL 解析失败');
                return false
            }
        }
        console.log('[Network] 不匹配本地 API');
        return false
    }

    // 处理本地词典 API 请求
    const handleLocalApiRequest = async (option: Taro.request.Option): Promise<Taro.request.SuccessCallbackResult> => {
        const url = option.url

        console.log('[Network] 使用本地 IndexedDB API:', url)

        // 从完整 URL 中提取路径
        let pathname = url
        try {
            const urlObj = new URL(url)
            pathname = urlObj.pathname
        } catch {
            // 如果不是完整 URL，直接使用
        }

        console.log('[Network] 提取路径:', pathname)

        try {
            // 检查是否需要加载数据
            const isLoaded = await localDictionary.isDataLoaded()

            if (!isLoaded) {
                console.log('[Network] 本地数据未加载，开始从网络下载...')
                await localDictionary.loadFromNetwork()
            } else {
                // 数据已加载，检查是否需要更新
                console.log('[Network] 检查数据更新...')
                await localDictionary.loadFromNetwork()
            }

            let responseData: any

            // 根据路由处理请求
            if (pathname === '/api/dictionary/detail') {
                console.log('[Network] ========== 处理 detail 请求 ==========');
                console.log('[Network] option.data:', option.data);
                console.log('[Network] 查询词:', option.data?.word);

                const detail = await localDictionary.getWordDetail(option.data.word)

                console.log('[Network] getWordDetail 返回:', detail);

                responseData = {
                    code: 200,
                    message: 'success',
                    data: detail
                }

                console.log('[Network] detail 响应数据:', JSON.stringify(responseData));
                console.log('[Network] ========== detail 处理完成 ==========');
            } else if (pathname === '/api/dictionary/suggestions') {
                console.log('[Network] 处理 suggestions 请求，option.data:', option.data);
                console.log('[Network] query 参数:', option.data?.query);

                const suggestions = await localDictionary.getSuggestions(option.data.query)
                responseData = {
                    code: 200,
                    message: 'success',
                    data: suggestions
                }

                console.log('[Network] suggestions 响应数据:', JSON.stringify(responseData).substring(0, 200));
            } else if (pathname === '/api/dictionary/by-jyutping') {
                const words = await localDictionary.searchWords(option.data.jyutping, 20)
                responseData = {
                    code: 200,
                    message: 'success',
                    data: words.map(w => ({
                        id: w.w,
                        word: w.w,
                        jyutping: w.j,
                        pronunciation: w.j.split(' '),
                        definition: w.d || '来自 Rime Cantonese 词典'
                    }))
                }
            } else if (pathname === '/api/dictionary/import') {
                const stats = await localDictionary.getStats()
                responseData = {
                    code: 200,
                    message: 'success',
                    data: {
                        syllables: stats.words
                    }
                }
            } else {
                throw new Error(`未知的本地路由: ${url}`)
            }

            console.log('[Network] 本地 API 响应:', responseData)

            // 返回与 Taro.request 兼容的格式
            return {
                data: responseData,
                statusCode: 200,
                header: {},
                cookies: [],
                errMsg: 'request:ok'
            }
        } catch (error) {
            console.error('[Network] 本地 API 请求失败:', error)

            return {
                data: {
                    code: 500,
                    message: error instanceof Error ? error.message : '请求失败',
                    data: null
                },
                statusCode: 500,
                header: {},
                cookies: [],
                errMsg: 'request:fail'
            }
        }
    }

    export const request: typeof Taro.request = (option: any) => {
        console.log('[Network] request 被调用，option:', { url: option.url, method: option.method, data: option.data });

        const url = createUrl(option.url)

        // 检查是否是本地 API 路由
        if (isLocalApiRoute(option.url)) {
            console.log('[Network] 识别为本地 API 路由');
            return handleLocalApiRequest({
                ...option,
                url
            }) as any
        }

        // 否则使用远程 API
        return Taro.request({
            ...option,
            url
        })
    }

    export const uploadFile: typeof Taro.uploadFile = option => {
        return Taro.uploadFile({
            ...option,
            url: createUrl(option.url)
        })
    }

    export const downloadFile: typeof Taro.downloadFile = option => {
        return Taro.downloadFile({
            ...option,
            url: createUrl(option.url)
        })
    }
}
