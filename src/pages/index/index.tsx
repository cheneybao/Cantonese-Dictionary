import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { Search, Mic, Circle, Volume2, BookOpen } from 'lucide-react-taro'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import './index.css'

type Suggestion = {
  word: string
  jyutping: string
  type: 'word' | 'syllable'
}

type SearchResult = {
  id: string
  word: string
  jyutping: string
  definition?: string
  examples?: string[]
}

const IndexPage = () => {
  const [searchText, setSearchText] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentWords, setRecentWords] = useState<SearchResult[]>([])

  // 从本地存储加载最近查词
  useEffect(() => {
    loadRecentWords()
  }, [])

  const loadRecentWords = async () => {
    try {
      const history = await Taro.getStorage({ key: 'search_history' })
      if (history.data) {
        setRecentWords(history.data.slice(0, 5))
      }
    } catch (error) {
      console.log('No search history found')
    }
  }

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.trim()) {
        searchSuggestions(searchText)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchText])

  const searchSuggestions = async (query: string) => {
    try {
      const res = await Network.request({
        url: '/api/dictionary/suggestions',
        method: 'POST',
        data: { query }
      })

      if (res.data && res.data.code === 200) {
        setSuggestions(res.data.data || [])
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('搜索联想失败:', error)
    }
  }

  const handleSearch = async (keyword?: string) => {
    const query = keyword || searchText.trim()
    if (!query) return

    setShowSuggestions(false)

    // 跳转到详情页
    Taro.navigateTo({
      url: `/pages/word-detail/index?word=${encodeURIComponent(query)}`
    })
  }

  const handleSuggestionClick = (item: Suggestion) => {
    setSearchText(item.word)
    handleSearch(item.word)
  }

  const startVoiceInput = () => {
    if (isRecording) {
      stopVoiceInput()
      return
    }

    setIsRecording(true)

    // 调用系统语音识别
    Taro.getRecorderManager().start({
      format: 'mp3'
    })

    // 模拟录音结束（实际应该使用语音识别API）
    setTimeout(() => {
      stopVoiceInput()
    }, 3000)
  }

  const stopVoiceInput = () => {
    setIsRecording(false)

    // 这里应该调用语音识别API
    // 抖音小程序可以使用 tt.getVoiceRecognizerManager()
    Taro.showToast({
      title: '语音识别功能开发中',
      icon: 'none'
    })
  }

  const handleClearSearch = () => {
    setSearchText('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const goToDetail = (word: string) => {
    Taro.navigateTo({
      url: `/pages/word-detail/index?word=${encodeURIComponent(word)}`
    })
  }

  return (
    <View className="index-page min-h-screen bg-gray-50 pb-16">
      {/* 搜索区域 */}
      <View className="bg-white p-4 shadow-sm">
        <View className="flex items-center gap-3">
          <View className="flex-1 flex items-center bg-gray-100 rounded-xl px-3 py-2">
            <Search size={20} color="#666666" />
            <Input
              className="flex-1 bg-transparent ml-2"
              placeholder="输入汉字、词语或粤拼"
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
              onConfirm={() => handleSearch()}
              focus
            />
            {searchText && (
              <Circle
                size={20}
                color="#999999"
                onClick={handleClearSearch}
              />
            )}
          </View>
          <Button
            className="bg-blue-500 text-white rounded-xl px-4 py-2 flex-shrink-0"
            onClick={startVoiceInput}
          >
            <Mic
              size={24}
              color={isRecording ? '#ef4444' : '#ffffff'}
            />
          </Button>
        </View>

        {/* 联想列表 */}
        {showSuggestions && suggestions.length > 0 && (
          <View className="mt-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            <ScrollView scrollY className="max-h-60">
              {suggestions.map((item, index) => (
                <View
                  key={index}
                  className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0"
                  onClick={() => handleSuggestionClick(item)}
                >
                  <View className="flex items-center gap-3">
                    <Text className="block text-lg font-medium text-gray-900">
                      {item.word}
                    </Text>
                    <Badge
                      variant="secondary"
                      className="font-mono text-blue-600"
                    >
                      {item.jyutping}
                    </Badge>
                  </View>
                  {item.type === 'syllable' && (
                    <Badge variant="outline" className="text-xs">
                      粤拼
                    </Badge>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* 最近查词 */}
      {recentWords.length > 0 && (
        <View className="mt-4 px-4">
          <View className="flex items-center justify-between mb-3">
            <Text className="block text-sm font-semibold text-gray-900">
              最近查词
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => Taro.navigateTo({ url: '/pages/history/index' })}
            >
              <Text className="block text-sm text-blue-500">查看全部</Text>
            </Button>
          </View>

          <View className="space-y-3">
            {recentWords.map((item, index) => (
              <Card
                key={index}
                className="bg-white rounded-xl shadow-sm cursor-pointer"
                onClick={() => goToDetail(item.word)}
              >
                <CardContent className="p-4">
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-3">
                      <Text className="block text-lg font-medium text-gray-900">
                        {item.word}
                      </Text>
                      <Badge className="font-mono text-blue-600">
                        {item.jyutping}
                      </Badge>
                    </View>
                    <Volume2 size={20} color="#1890ff" />
                  </View>
                  {item.definition && (
                    <Text className="block text-sm text-gray-600 mt-2">
                      {item.definition}
                    </Text>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* 空状态提示 */}
      {!searchText && recentWords.length === 0 && (
        <View className="flex flex-col items-center justify-center py-20 px-4">
          <BookOpen size={64} color="#d1d5db" />
          <Text className="block text-lg font-medium text-gray-600 mt-4 mb-2">
            开始学习粤语
          </Text>
          <Text className="block text-sm text-gray-400 text-center">
            输入汉字、词语或粤拼音节{'\n'}即可查询读音和释义
          </Text>
        </View>
      )}
    </View>
  )
}

export default IndexPage
