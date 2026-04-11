import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { Clock, Trash2, Volume2 } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Taro from '@tarojs/taro'
import './index.css'

type HistoryItem = {
  id: string
  word: string
  jyutping: string
  definition?: string
  timestamp: number
}

const HistoryPage = () => {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([])

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const history = await Taro.getStorage({ key: 'search_history' })
      if (history.data) {
        setHistoryList(history.data)
      }
    } catch (error) {
      console.log('No search history found')
      setHistoryList([])
    }
  }

  const goToDetail = (word: string) => {
    Taro.navigateTo({
      url: `/pages/word-detail/index?word=${encodeURIComponent(word)}`
    })
  }

  const deleteItem = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          const newList = historyList.filter(item => item.id !== id)
          setHistoryList(newList)
          Taro.setStorage({
            key: 'search_history',
            data: newList
          })
        }
      }
    })
  }

  const clearAll = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          setHistoryList([])
          Taro.removeStorage({ key: 'search_history' })
        }
      }
    })
  }

  const playAudio = (_word: string) => {
    Taro.showToast({
      title: '播放读音',
      icon: 'none'
    })
    // 实际应该调用 TTS API
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return `${Math.floor(diff / 86400000)}天前`
  }

  return (
    <View className="history-page min-h-screen bg-gray-50 pb-16">
      {/* 顶部操作栏 */}
      <View className="bg-white p-4 shadow-sm flex items-center justify-between">
        <View className="flex items-center gap-2">
          <Clock size={20} color="#1890ff" />
          <Text className="block text-base font-semibold text-gray-900">
            查询历史
          </Text>
        </View>
        {historyList.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
          >
            <Text className="block text-sm text-red-500">清空</Text>
          </Button>
        )}
      </View>

      {/* 历史记录列表 */}
      {historyList.length > 0 ? (
        <ScrollView scrollY className="h-full">
          <View className="p-4 space-y-3">
            {historyList.map((item, _index) => (
              <Card
                key={item.id}
                className="bg-white rounded-xl shadow-sm"
              >
                <CardContent className="p-4">
                  <View className="flex items-center justify-between mb-2">
                    <View className="flex items-center gap-3 flex-1">
                      <Text
                        className="block text-lg font-medium text-gray-900 cursor-pointer"
                        onClick={() => goToDetail(item.word)}
                      >
                        {item.word}
                      </Text>
                      <Badge className="font-mono text-blue-600">
                        {item.jyutping}
                      </Badge>
                    </View>
                    <View className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playAudio(item.word)}
                      >
                        <Volume2 size={18} color="#1890ff" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 size={18} color="#ef4444" />
                      </Button>
                    </View>
                  </View>
                  {item.definition && (
                    <Text className="block text-sm text-gray-600 line-clamp-2">
                      {item.definition}
                    </Text>
                  )}
                  <Text className="block text-xs text-gray-400 mt-2">
                    {formatTime(item.timestamp)}
                  </Text>
                </CardContent>
              </Card>
            ))}
          </View>
        </ScrollView>
      ) : (
        /* 空状态 */
        <View className="flex flex-col items-center justify-center py-20 px-4">
          <Clock size={64} color="#d1d5db" />
          <Text className="block text-lg font-medium text-gray-600 mt-4 mb-2">
            暂无历史记录
          </Text>
          <Text className="block text-sm text-gray-400 text-center">
            查询过的词语会显示在这里{'\n'}方便你随时回顾
          </Text>
        </View>
      )}
    </View>
  )
}

export default HistoryPage
