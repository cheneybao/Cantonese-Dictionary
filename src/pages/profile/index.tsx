import { View, Text } from '@tarojs/components'
import {
  User,
  Info,
  Heart,
  BookOpen,
  Volume2,
  Languages,
  ChevronRight,
  Moon
} from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import Taro from '@tarojs/taro'
import './index.css'

const ProfilePage = () => {
  const settings = [
    {
      icon: Languages,
      title: '简繁显示',
      subtitle: '选择简体或繁体显示',
      type: 'select',
      value: '简体'
    },
    {
      icon: Volume2,
      title: '语音识别语言',
      subtitle: '选择语音识别的语言偏好',
      type: 'select',
      value: '普通话'
    },
    {
      icon: Moon,
      title: '深色模式',
      subtitle: '切换深色或浅色主题',
      type: 'switch',
      value: false
    }
  ]

  const aboutItems = [
    {
      icon: Info,
      title: '关于',
      subtitle: '版本信息和数据来源'
    },
    {
      icon: BookOpen,
      title: '数据来源',
      subtitle: '查看词典数据许可'
    },
    {
      icon: Heart,
      title: '致谢',
      subtitle: '感谢开源项目贡献者'
    }
  ]

  const handleSettingClick = (item: any) => {
    Taro.showToast({
      title: `${item.title} 功能开发中`,
      icon: 'none'
    })
  }

  const handleAboutClick = (item: any) => {
    if (item.title === '关于') {
      Taro.showModal({
        title: '关于粤语词典',
        content: '粤语词典 v1.0.0\n\n一款离线优先的粤语学习工具，专注于粤拼学习和词汇查询。\n\n数据来源：\n- Rime Cantonese\n- CC-Canto\n\n开源许可：\n- MIT License',
        showCancel: false
      })
    } else if (item.title === '数据来源') {
      Taro.navigateTo({
        url: '/pages/about/sources'
      })
    } else {
      handleSettingClick(item)
    }
  }

  return (
    <View className="profile-page min-h-screen bg-gray-50 pb-16">
      {/* 用户信息卡片 */}
      <View className="bg-white p-6 shadow-sm">
        <View className="flex items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <User size={32} color="#1890ff" />
          </View>
          <View>
            <Text className="block text-lg font-semibold text-gray-900">
              粤语学习者
            </Text>
            <Text className="block text-sm text-gray-600">
              粤语词典用户
            </Text>
          </View>
        </View>
      </View>

      {/* 设置列表 */}
      <View className="mt-4 px-4">
        <Text className="block text-xs font-medium text-gray-500 mb-2 px-1">
          设置
        </Text>
        <Card className="bg-white rounded-xl shadow-sm">
          <CardContent className="p-0">
            {settings.map((item, index) => (
              <View key={index}>
                <View
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => handleSettingClick(item)}
                >
                  <View className="flex items-center gap-3 flex-1">
                    <item.icon size={20} color="#1890ff" />
                    <View className="flex-1">
                      <Text className="block text-sm font-medium text-gray-900">
                        {item.title}
                      </Text>
                      <Text className="block text-xs text-gray-500">
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                  {item.type === 'select' ? (
                    <View className="flex items-center gap-2">
                      <Text className="block text-sm text-gray-600">
                        {item.value}
                      </Text>
                      <ChevronRight size={16} color="#9ca3af" />
                    </View>
                  ) : (
                    <Switch checked={item.value === true} />
                  )}
                </View>
                {index < settings.length - 1 && <Separator />}
              </View>
            ))}
          </CardContent>
        </Card>
      </View>

      {/* 关于列表 */}
      <View className="mt-4 px-4">
        <Text className="block text-xs font-medium text-gray-500 mb-2 px-1">
          关于
        </Text>
        <Card className="bg-white rounded-xl shadow-sm">
          <CardContent className="p-0">
            {aboutItems.map((item, index) => (
              <View key={index}>
                <View
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => handleAboutClick(item)}
                >
                  <View className="flex items-center gap-3 flex-1">
                    <item.icon size={20} color="#1890ff" />
                    <View className="flex-1">
                      <Text className="block text-sm font-medium text-gray-900">
                        {item.title}
                      </Text>
                      <Text className="block text-xs text-gray-500">
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#9ca3af" />
                </View>
                {index < aboutItems.length - 1 && <Separator />}
              </View>
            ))}
          </CardContent>
        </Card>
      </View>

      {/* 底部信息 */}
      <View className="mt-8 text-center px-4">
        <Text className="block text-xs text-gray-400">
          粤语词典 v1.0.0
        </Text>
        <Text className="block text-xs text-gray-400 mt-1">
          Made with ❤️ for Cantonese learners
        </Text>
      </View>
    </View>
  )
}

export default ProfilePage
