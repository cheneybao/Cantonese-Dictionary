import { View, Text } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { Volume2 } from 'lucide-react-taro'
import './speaking-animation.scss'

interface SpeakingAnimationProps {
  isSpeaking: boolean
  text?: string
  className?: string
}

export function SpeakingAnimation({ isSpeaking, text, className = '' }: SpeakingAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isSpeaking) {
      setIsAnimating(true)
    } else {
      // 延迟停止动画，让动画自然结束
      setTimeout(() => setIsAnimating(false), 300)
    }
  }, [isSpeaking])

  return (
    <View className={`speaking-animation ${isAnimating ? 'animating' : ''} ${className}`}>
      <View className="animation-container">
        <Volume2 size={24} color="#1890ff" />
        <View className="sound-waves">
          <View className="wave wave-1"></View>
          <View className="wave wave-2"></View>
          <View className="wave wave-3"></View>
        </View>
      </View>
      {text && <Text className="speaking-text block text-sm text-gray-500">{text}</Text>}
    </View>
  )
}
