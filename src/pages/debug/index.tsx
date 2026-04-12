import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Network } from '@/network'

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // 捕获控制台日志
  useEffect(() => {
    const originalConsoleLog = console.log
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn

    const addLog = (type: string, ...args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      setLogs(prev => [`[${type}] ${message}`, ...prev].slice(0, 100))
    }

    console.log = (...args) => {
      originalConsoleLog(...args)
      addLog('LOG', ...args)
    }

    console.error = (...args) => {
      originalConsoleError(...args)
      addLog('ERROR', ...args)
    }

    console.warn = (...args) => {
      originalConsoleWarn(...args)
      addLog('WARN', ...args)
    }

    return () => {
      console.log = originalConsoleLog
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
    }
  }, [])

  const testDictionaryAPI = async () => {
    try {
      setLoading(true)
      setLogs(prev => ['\n========== 开始测试词典 API ==========', ...prev])

      const res = await Network.request({
        url: '/api/dictionary/detail',
        method: 'POST',
        data: { word: '你好' }
      })

      setLogs(prev => ['API 响应:', JSON.stringify(res, null, 2), ...prev])
      setApiResponse(res)
    } catch (error) {
      setLogs(prev => ['API 请求失败:', error instanceof Error ? error.message : String(error), ...prev])
    } finally {
      setLoading(false)
    }
  }

  const testIndexedDB = async () => {
    try {
      setLogs(prev => ['\n========== 检查 IndexedDB ==========', ...prev])

      const request = indexedDB.open('CantoneseDictionaryDB', 1)

      request.onsuccess = () => {
        const db = request.result
        setLogs(prev => [
          `数据库版本: ${db.version}`,
          `对象存储: ${Array.from(db.objectStoreNames).join(', ')}`,
          ...prev
        ])

        // 检查数据数量
        const transaction = db.transaction(['words'], 'readonly')
        const store = transaction.objectStore('words')
        const countRequest = store.count()

        countRequest.onsuccess = () => {
          setLogs(prev => [`词条总数: ${countRequest.result}`, ...prev])
        }

        // 查询"你好"
        const getRequest = store.get('你好')
        getRequest.onsuccess = () => {
          const result = getRequest.result
          if (result) {
            setLogs(prev => [
              `找到词条"你好":`,
              JSON.stringify(result, null, 2),
              ...prev
            ])
          } else {
            setLogs(prev => ['未找到词条"你好"', ...prev])
          }
        }

        db.close()
      }

      request.onerror = () => {
        setLogs(prev => [`打开数据库失败: ${request.error?.message}`, ...prev])
      }
    } catch (error) {
      setLogs(prev => [`IndexedDB 检查失败: ${error instanceof Error ? error.message : String(error)}`, ...prev])
    }
  }

  const clearLogs = () => {
    setLogs([])
    setApiResponse(null)
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="max-w-2xl mx-auto">
        <Text className="text-2xl font-bold text-center mb-6 block">
          调试页面
        </Text>

        {/* 控制按钮 */}
        <View className="flex gap-2 mb-4">
          <Button onClick={testDictionaryAPI} disabled={loading}>
            {loading ? '测试中...' : '测试词典 API'}
          </Button>
          <Button onClick={testIndexedDB} disabled={loading}>
            检查 IndexedDB
          </Button>
          <Button onClick={clearLogs} variant="outline">
            清除日志
          </Button>
        </View>

        {/* API 响应 */}
        {apiResponse && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>
                <Text className="block">API 响应</Text>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="block text-xs font-mono bg-gray-100 p-2 rounded">
                {JSON.stringify(apiResponse, null, 2)}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* 日志 */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Text className="block">控制台日志</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollView className="bg-black text-green-400 p-2 rounded h-96">
              {logs.length === 0 ? (
                <Text className="block text-gray-500">
                  暂无日志，点击上方按钮开始测试
                </Text>
              ) : (
                logs.map((log, index) => (
                  <Text
                    key={index}
                    className={`block text-xs font-mono mb-1 ${
                      log.includes('[ERROR]') ? 'text-red-400' :
                      log.includes('[WARN]') ? 'text-yellow-400' :
                      'text-green-400'
                    }`}
                  >
                    {log}
                  </Text>
                ))
              )}
            </ScrollView>
          </CardContent>
        </Card>

        {/* 说明 */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>
              <Text className="block">使用说明</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="block text-sm text-gray-600 mb-2">
              1. 点击&ldquo;测试词典 API&rdquo;测试查询&ldquo;你好&rdquo;的词条详情
            </Text>
            <Text className="block text-sm text-gray-600 mb-2">
              2. 点击&ldquo;检查 IndexedDB&rdquo;查看数据库状态
            </Text>
            <Text className="block text-sm text-gray-600 mb-2">
              3. 查看日志输出，确认是否有错误
            </Text>
            <Text className="block text-sm text-gray-600">
              4. 将日志截图发送给开发者
            </Text>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
