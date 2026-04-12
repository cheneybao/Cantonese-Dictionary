import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import Taro from '@tarojs/taro'

interface ThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // 从本地存储加载暗黑模式设置
    const loadDarkMode = async () => {
      try {
        const savedMode = await Taro.getStorage({ key: 'darkMode' })
        if (savedMode.data !== undefined) {
          setIsDarkMode(savedMode.data)
        } else {
          // 检查系统偏好
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          setIsDarkMode(prefersDark)
        }
      } catch (error) {
        console.log('加载暗黑模式设置失败:', error)
      }
    }
    loadDarkMode()
  }, [])

  useEffect(() => {
    // 保存暗黑模式设置并应用到文档
    const saveDarkMode = async () => {
      try {
        await Taro.setStorage({
          key: 'darkMode',
          data: isDarkMode
        })
      } catch (error) {
        console.log('保存暗黑模式设置失败:', error)
      }

      // 应用到文档
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', isDarkMode)
      }
    }
    saveDarkMode()
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev)
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
