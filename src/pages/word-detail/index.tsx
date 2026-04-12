import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Volume2, Star, Share2, BookOpen, Heart, VolumeX, TriangleAlert } from 'lucide-react-taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SpeakingAnimation } from '@/components/ui/speaking-animation'
import { Network } from '@/network'
import {
  speakCantonese,
  speakCantoneseSlow,
  isSpeechSupported,
  isCantoneseVoiceAvailable,
  detectVoiceSupport
} from '@/utils/speech'
import './index.css'

type WordDetail = {
  id: string
  word: string
  jyutping: string
  pronunciation?: string[]
  definition?: string
  examples?: {
    chinese: string
    jyutping: string
    english?: string
  }[]
  related?: string[]
  tones?: {
    tone: string
    value: string
    description?: string
  }[]
}

const WordDetailPage = () => {
  const router = useRouter()
  const [detail, setDetail] = useState<WordDetail | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSlowMode, setIsSlowMode] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [cantoneseAvailable, setCantoneseAvailable] = useState(false)
  const [voiceDetection, setVoiceDetection] = useState<ReturnType<typeof detectVoiceSupport> | null>(null)

  useEffect(() => {
    const { word: wordParam, jyutping } = router.params
    if (wordParam) {
      loadWordDetail(decodeURIComponent(wordParam))
    } else if (jyutping) {
      loadWordsByJyutping(decodeURIComponent(jyutping))
    }

    checkFavorite(wordParam || jyutping)

    // 检查语音支持
    const supported = isSpeechSupported()
    setSpeechSupported(supported)

    if (supported) {
      setCantoneseAvailable(isCantoneseVoiceAvailable())
      setVoiceDetection(detectVoiceSupport())
    }
  }, [router.params])

  const loadWordDetail = async (keyword: string) => {
    try {
      setLoading(true)
      console.log('正在加载词条详情:', keyword)

      const res = await Network.request({
        url: '/api/dictionary/detail',
        method: 'POST',
        data: { word: keyword }
      })

      console.log('后端响应:', res)

      if (res.data && res.data.code === 200 && res.data.data) {
        console.log('成功获取词条:', res.data.data)
        setDetail(res.data.data)

        // 保存到历史记录
        saveToHistory(res.data.data)
      } else {
        console.log('未找到词条，响应数据:', res.data)
        // 未找到词条，显示空状态
        setDetail(null)
      }
    } catch (error) {
      console.error('加载词条详情失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }

  const loadWordsByJyutping = async (jyutping: string) => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/dictionary/by-jyutping',
        method: 'POST',
        data: { jyutping }
      })

      if (res.data && res.data.code === 200) {
        // 显示同音字列表的第一个
        if (res.data.data && res.data.data.length > 0) {
          setDetail(res.data.data[0])
        }
      }
    } catch (error) {
      console.error('加载同音字失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveToHistory = async (item: WordDetail) => {
    try {
      let historyList: WordDetail[] = []

      // 尝试获取现有历史记录
      try {
        const history = await Taro.getStorage({ key: 'search_history' })
        historyList = history.data || []
      } catch (getError) {
        // 首次使用，storage 中没有这个 key，忽略错误
        console.log('首次使用历史记录，创建新的列表')
        historyList = []
      }

      // 检查是否已存在，存在则移到最前面
      const existingIndex = historyList.findIndex(h => h.word === item.word)
      if (existingIndex > -1) {
        historyList.splice(existingIndex, 1)
      }

      // 添加到开头
      historyList.unshift({
        ...item,
        timestamp: Date.now()
      } as any)

      // 只保留最近100条
      const trimmedList = historyList.slice(0, 100)

      await Taro.setStorage({
        key: 'search_history',
        data: trimmedList
      })
    } catch (error) {
      console.log('保存历史记录失败:', error)
    }
  }

  const checkFavorite = async (keyword?: string) => {
    if (!keyword) return

    try {
      const favorites = await Taro.getStorage({ key: 'favorites' })
      const favoritesList: any[] = favorites.data || []
      const isFav = favoritesList.some((f: any) => f.word === decodeURIComponent(keyword))
      setIsFavorite(isFav)
    } catch (error) {
      setIsFavorite(false)
    }
  }

  const toggleFavorite = async () => {
    if (!detail) return

    try {
      const favorites = await Taro.getStorage({ key: 'favorites' })
      const favoritesList: any[] = favorites.data || []

      if (isFavorite) {
        // 取消收藏
        const newList = favoritesList.filter((f: any) => f.word !== detail.word)
        await Taro.setStorage({
          key: 'favorites',
          data: newList
        })
        setIsFavorite(false)
        Taro.showToast({
          title: '已取消收藏',
          icon: 'none'
        })
      } else {
        // 添加收藏
        favoritesList.unshift({
          ...detail,
          timestamp: Date.now()
        })
        await Taro.setStorage({
          key: 'favorites',
          data: favoritesList
        })
        setIsFavorite(true)
        Taro.showToast({
          title: '已收藏',
          icon: 'none'
        })
      }
    } catch (error) {
      console.log('收藏操作失败:', error)
    }
  }

  const playAudio = async () => {
    if (!detail) return

    if (!speechSupported) {
      Taro.showToast({
        title: '您的浏览器不支持语音功能',
        icon: 'none',
        duration: 2000
      })
      return
    }

    setIsSpeaking(true)

    try {
      const success = isSlowMode
        ? await speakCantoneseSlow(detail.word, {
            rate: 0.7,
            pitch: 1,
            volume: 1
          })
        : await speakCantonese(detail.word, {
            rate: 0.9,
            pitch: 1,
            volume: 1
          })

      if (!success) {
        Taro.showToast({
          title: '播放失败',
          icon: 'none',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('发音失败:', error)
      Taro.showToast({
        title: '播放失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      setIsSpeaking(false)
    }
  }

  const toggleSlowMode = () => {
    setIsSlowMode(!isSlowMode)
    Taro.showToast({
      title: isSlowMode ? '已关闭慢速模式' : '已开启慢速模式',
      icon: 'none',
      duration: 1500
    })
  }

  const shareWord = () => {
    // 使用 Taro 的分享 API
    Taro.showToast({
      title: '分享功能开发中',
      icon: 'none'
    })
  }

  const goToRelatedWord = (relatedWord: string) => {
    Taro.navigateTo({
      url: `/pages/word-detail/index?word=${encodeURIComponent(relatedWord)}`
    })
  }

  if (loading) {
    return (
      <View className="word-detail-page min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="block text-gray-500">加载中...</Text>
      </View>
    )
  }

  if (!detail) {
    return (
      <View className="word-detail-page min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <BookOpen size={64} color="#d1d5db" />
        <Text className="block text-lg font-medium text-gray-600 mt-4 mb-2">
          未找到词条
        </Text>
        <Text className="block text-sm text-gray-400 text-center">
          请尝试其他关键词{'\n'}或检查拼写是否正确
        </Text>
      </View>
    )
  }

  return (
    <View className="word-detail-page min-h-screen bg-gray-50 pb-20">
      <ScrollView scrollY>
        {/* 语音包检测提示 */}
        {speechSupported && voiceDetection && !cantoneseAvailable && (
          <Alert className="mx-4 mt-4 bg-yellow-50 border-yellow-200">
            <TriangleAlert size={16} color="#f59e0b" />
            <AlertDescription className="text-sm text-yellow-800 ml-2">
              <Text className="block font-medium mb-1">{voiceDetection.recommendation}</Text>
            </AlertDescription>
          </Alert>
        )}

        {/* 发音动画 */}
        {isSpeaking && (
          <View className="px-4 mt-4">
            <SpeakingAnimation
              isSpeaking={isSpeaking}
              text={isSlowMode ? '慢速播放中...' : '播放中...'}
            />
          </View>
        )}

        {/* 词条头部 */}
        <View className="bg-white p-6 shadow-sm">
          <View className="flex items-center justify-between mb-4">
            <View className="flex items-center gap-3 flex-1">
              <Text className="block text-3xl font-bold text-gray-900">
                {detail.word}
              </Text>
              <Badge className="font-mono text-blue-600 text-lg px-3 py-1">
                {detail.jyutping}
              </Badge>
            </View>
            <View className="flex items-center gap-2">
              {speechSupported ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={playAudio}
                    disabled={isSpeaking}
                    className={isSlowMode ? 'bg-yellow-50' : ''}
                  >
                    {isSpeaking ? (
                      <VolumeX size={24} color="#f59e0b" />
                    ) : (
                      <Volume2 size={24} color={isSlowMode ? "#f59e0b" : "#1890ff"} />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSlowMode}
                    className={isSlowMode ? 'bg-yellow-50' : ''}
                  >
                    <Text className="block text-xs" style={{ color: isSlowMode ? '#f59e0b' : '#9ca3af' }}>
                      {isSlowMode ? '慢速' : '正常'}
                    </Text>
                  </Button>
                </>
              ) : (
                <View className="opacity-40">
                  <Volume2 size={24} color="#9ca3af" />
                </View>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFavorite}
              >
                <Star
                  size={24}
                  color={isFavorite ? '#f59e0b' : '#9ca3af'}
                  filled={isFavorite}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={shareWord}
              >
                <Share2 size={24} color="#1890ff" />
              </Button>
            </View>
          </View>

          {/* 无释义提示 */}
          {!detail.definition && (!detail.examples || detail.examples.length === 0) && (
            <Alert className="mt-4 bg-blue-50 border-blue-200">
              <BookOpen size={16} color="#3b82f6" />
              <AlertDescription className="text-sm text-blue-700 ml-2">
                <Text className="block">
                  该词条仅有发音数据，未收录释义和例句。{'\n'}
                  语音数据来源：Rime Cantonese（jyut6ping3）词典
                </Text>
              </AlertDescription>
            </Alert>
          )}

          {/* 多音字提示 */}
          {detail.tones && detail.tones.length > 1 && (
            <Alert className="mt-4 bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-700">
                <Text className="block font-medium mb-2">多音字：</Text>
                {detail.tones.map((tone, index) => (
                  <View key={index} className="mt-1">
                    <Text className="block text-sm">
                      <Text className="font-medium">{tone.value}</Text>
                      {tone.description && ` - ${tone.description}`}
                    </Text>
                  </View>
                ))}
              </AlertDescription>
            </Alert>
          )}
        </View>

        {/* 释义 */}
        {detail.definition && (
          <View className="mt-4 px-4">
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  释义
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Text className="block text-sm text-gray-700 leading-relaxed">
                  {detail.definition}
                </Text>
              </CardContent>
            </Card>
          </View>
        )}

        {/* 例句 */}
        {detail.examples && detail.examples.length > 0 && (
          <View className="mt-4 px-4">
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  例句
                </CardTitle>
              </CardHeader>
              <CardContent>
                <View className="space-y-3">
                  {detail.examples.map((example, index) => (
                    <View key={index} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                      <Text className="block text-base text-gray-900 mb-1">
                        {example.chinese}
                      </Text>
                      {example.jyutping && (
                        <Text className="block text-sm font-mono text-blue-600 mb-1">
                          {example.jyutping}
                        </Text>
                      )}
                      {example.english && (
                        <Text className="block text-xs text-gray-500 italic">
                          {example.english}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* 相关词语 */}
        {detail.related && detail.related.length > 0 && (
          <View className="mt-4 px-4">
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  相关词语
                </CardTitle>
              </CardHeader>
              <CardContent>
                <View className="flex flex-wrap gap-2">
                  {detail.related.map((relatedWord, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer bg-gray-100 hover:bg-blue-100"
                      onClick={() => goToRelatedWord(relatedWord)}
                    >
                      {relatedWord}
                    </Badge>
                  ))}
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* 底部提示 */}
        <View className="mt-8 mb-6 px-4">
          <View className="bg-gray-50 rounded-lg p-4">
            <Text className="block text-sm text-gray-600 font-semibold mb-2">
              数据来源
            </Text>
            <View className="flex items-center gap-2 mb-1">
              <Heart size={14} color="#ef4444" />
              <Text className="block text-xs text-gray-500">
                语音数据：Rime Cantonese（jyut6ping3）词典 - 92,717 条词条
              </Text>
            </View>
            {detail.definition && (
              <View className="flex items-center gap-2">
                <Heart size={14} color="#ef4444" />
                <Text className="block text-xs text-gray-500">
                  释义数据：CC-Canto 词典
                </Text>
              </View>
            )}
            {!detail.definition && (
              <View className="flex items-center gap-2">
                <Heart size={14} color="#9ca3af" />
                <Text className="block text-xs text-gray-400 italic">
                  释义数据：未收录
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default WordDetailPage
