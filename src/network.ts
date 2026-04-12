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
const USE_LOCAL_API = (import.meta as any).env?.VITE_USE_LOCAL_API !== 'false'; // 默认使用本地 API

export namespace Network {
    const createUrl = (url: string): string => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        return `${PROJECT_DOMAIN}${url}`
    }

    // 本地 API 路由处理
    const isLocalApiRoute = (url: string): boolean => {
        return USE_LOCAL_API && url.startsWith('/api/dictionary')
    }

    // 处理本地词典 API 请求
    const handleLocalApiRequest = async (option: Taro.request.Option): Promise<Taro.request.SuccessCallbackResult> => {
        const url = option.url

        console.log('[Network] 使用本地 IndexedDB API:', url)

        try {
            // 确保本地数据已加载
            const isLoaded = await localDictionary.isDataLoaded()

            if (!isLoaded) {
                console.log('[Network] 本地数据未加载，开始从网络下载...')
                await localDictionary.loadFromNetwork()
            }

            let responseData: any

            // 根据路由处理请求
            if (url === '/api/dictionary/detail') {
                const detail = await localDictionary.getWordDetail(option.data.word)
                responseData = {
                    code: 200,
                    message: 'success',
                    data: detail
                }
            } else if (url === '/api/dictionary/suggestions') {
                const suggestions = await localDictionary.getSuggestions(option.data.query)
                responseData = {
                    code: 200,
                    message: 'success',
                    data: suggestions
                }
            } else if (url === '/api/dictionary/by-jyutping') {
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
            } else if (url === '/api/dictionary/import') {
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
        const url = createUrl(option.url)

        // 检查是否是本地 API 路由
        if (isLocalApiRoute(option.url)) {
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
