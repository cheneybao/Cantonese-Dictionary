import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { Star, Volume2, Trash2 } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Taro from '@tarojs/taro'
import './index.css'

type FavoriteItem = {
  id: string
  word: string
  jyutping: string
  definition?: string
  timestamp: number
}

const FavoritesPage = () => {
  const [favoritesList, setFavoritesList] = useState<FavoriteItem[]>([])

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      const favorites = await Taro.getStorage({ key: 'favorites' })
      if (favorites.data) {
        setFavoritesList(favorites.data)
      }
    } catch (error) {
      console.log('No favorites found')
      setFavoritesList([])
    }
  }

  const goToDetail = (word: string) => {
    Taro.navigateTo({
      url: `/pages/word-detail/index?word=${encodeURIComponent(word)}`
    })
  }

  const removeFavorite = (id: string) => {
    Taro.showModal({
      title: '确认取消收藏',
      content: '确定要取消收藏这个词吗？',
      success: (res) => {
        if (res.confirm) {
          const newList = favoritesList.filter(item => item.id !== id)
          setFavoritesList(newList)
          Taro.setStorage({
            key: 'favorites',
            data: newList
          })
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

  return (
    <View className="favorites-page min-h-screen bg-gray-50 pb-16">
      {/* 顶部标题 */}
      <View className="bg-white p-4 shadow-sm flex items-center gap-2">
        <Star size={20} color="#f59e0b" />
        <Text className="block text-base font-semibold text-gray-900">
          我的收藏
        </Text>
      </View>

      {/* 收藏列表 */}
      {favoritesList.length > 0 ? (
        <ScrollView scrollY className="h-full">
          <View className="p-4 space-y-3">
            {favoritesList.map((item, _index) => (
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
                        onClick={() => removeFavorite(item.id)}
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
                    收藏于 {new Date(item.timestamp).toLocaleDateString()}
                  </Text>
                </CardContent>
              </Card>
            ))}
          </View>
        </ScrollView>
      ) : (
        /* 空状态 */
        <View className="flex flex-col items-center justify-center py-20 px-4">
          <Star size={64} color="#d1d5db" />
          <Text className="block text-lg font-medium text-gray-600 mt-4 mb-2">
            暂无收藏
          </Text>
          <Text className="block text-sm text-gray-400 text-center">
            点击词条详情页的星标{'\n'}即可添加到收藏夹
          </Text>
        </View>
      )}
    </View>
  )
}

export default FavoritesPage
