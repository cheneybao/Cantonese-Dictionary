import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { BookOpen } from 'lucide-react-taro'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import './index.css'

type SyllableGroup = {
  initial: string
  syllables: string[]
}

const SyllablesPage = () => {
  const [activeTab, setActiveTab] = useState('b')
  const [syllableGroups, setSyllableGroups] = useState<SyllableGroup[]>([])

  // 声母列表（粤拼声母）
  const initials = [
    'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
    'g', 'k', 'h', 'gw', 'kw', 'w', 'z', 'c', 's',
    'j', 'ng'
  ]

  // 模拟数据 - 实际应该从后端获取
  const mockSyllableGroups: SyllableGroup[] = [
    {
      initial: 'b',
      syllables: ['baa1', 'baa2', 'baa3', 'baa6', 'bai1', 'bai2', 'ban1', 'ban2', 'ban3', 'ban4', 'ban6']
    },
    {
      initial: 'p',
      syllables: ['pa1', 'pa2', 'pa3', 'pa4', 'paai1', 'paai2', 'paai3', 'paai4', 'paan1', 'paan2']
    },
    {
      initial: 'm',
      syllables: ['ma1', 'ma2', 'ma3', 'ma4', 'ma5', 'maai1', 'maai2', 'maan1', 'maan4', 'maan6']
    },
    // ... 其他声母
  ]

  // 获取无声调音节列表
  const getTonelessSyllables = (syllables: string[]): string[] => {
    const tonelessSet = new Set<string>()
    syllables.forEach(syllable => {
      // 移除声调数字，得到无声调音节
      const toneless = syllable.replace(/\d+$/, '')
      tonelessSet.add(toneless)
    })
    return Array.from(tonelessSet).sort()
  }

  // 按声母获取音节数据
  const loadSyllablesByInitial = async (initial: string) => {
    try {
      const res = await Network.request({
        url: '/api/dictionary/syllables',
        method: 'POST',
        data: { initial }
      })

      if (res.data && res.data.code === 200) {
        setSyllableGroups(res.data.data || mockSyllableGroups)
      } else {
        // 使用模拟数据
        setSyllableGroups(mockSyllableGroups)
      }
    } catch (error) {
      console.error('加载音节失败:', error)
      setSyllableGroups(mockSyllableGroups)
    }
  }

  // 切换声母时加载数据
  useEffect(() => {
    loadSyllablesByInitial(activeTab)
  }, [activeTab])

  const handleSyllableClick = (syllable: string) => {
    // 跳转到同音字列表或直接显示
    // 这里简化为跳转到词条列表
    Taro.navigateTo({
      url: `/pages/word-detail/index?jyutping=${encodeURIComponent(syllable)}`
    })
  }

  return (
    <View className="syllables-page min-h-screen bg-gray-50 pb-16">
      <View className="bg-white p-4 shadow-sm">
        <Text className="block text-base font-medium text-gray-900 mb-2">
          粤拼检字
        </Text>
        <Text className="block text-sm text-gray-600">
          选择声母，浏览音节，查找同音字
        </Text>
      </View>

      {/* 声母选择器 */}
      <View className="bg-white mt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollView scrollX className="border-b border-gray-200">
            <TabsList className="inline-flex p-2">
              {initials.map(initial => (
                <TabsTrigger
                  key={initial}
                  value={initial}
                  className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                >
                  {initial.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollView>

          {/* 音节列表 */}
          {initials.map(initial => (
            <TabsContent key={initial} value={initial}>
              <View className="p-4">
                {syllableGroups
                  .filter(group => group.initial === initial)
                  .map(group => {
                    const tonelessSyllables = getTonelessSyllables(group.syllables)
                    return (
                      <View key={initial}>
                        <Text className="block text-sm font-semibold text-gray-700 mb-3">
                          {initial.toUpperCase()} 韵母 ({tonelessSyllables.length})
                        </Text>
                        <View className="grid grid-cols-3 gap-3">
                          {tonelessSyllables.map((syllable, index) => (
                            <Card
                              key={index}
                              className="bg-white rounded-xl shadow-sm cursor-pointer hover:bg-blue-50"
                              onClick={() => handleSyllableClick(syllable)}
                            >
                              <CardContent className="p-3 text-center">
                                <Text className="block text-base font-mono font-medium text-blue-600">
                                  {syllable}
                                </Text>
                              </CardContent>
                            </Card>
                          ))}
                        </View>
                      </View>
                    )
                  })}
              </View>
            </TabsContent>
          ))}
        </Tabs>
      </View>

      {/* 提示信息 */}
      <View className="flex flex-col items-center justify-center py-20 px-4">
        <BookOpen size={64} color="#d1d5db" />
        <Text className="block text-lg font-medium text-gray-600 mt-4 mb-2">
          按声母查字
        </Text>
        <Text className="block text-sm text-gray-400 text-center">
          选择声母，浏览音节{'\n'}点击音节查看同音字
        </Text>
      </View>
    </View>
  )
}

export default SyllablesPage
