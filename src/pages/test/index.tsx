import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestPage() {
  const [status, setStatus] = useState({
    env: false,
    jsonFile: false,
    indexedDB: false
  })
  const [loading, setLoading] = useState(false)

  const checkEnvironment = () => {
    const useLocalAPI = import.meta.env.VITE_USE_LOCAL_API
    const result = {
      value: useLocalAPI === undefined ? 'undefined (using default: true)' : useLocalAPI,
      isCorrect: useLocalAPI === undefined || useLocalAPI === 'true'
    }
    return result
  }

  const checkJSONFile = async () => {
    try {
      const response = await fetch('/data/dictionary.json', {
        method: 'HEAD'
      })
      return {
        status: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        isCorrect: response.ok
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        isCorrect: false
      }
    }
  }

  const checkIndexedDB = async () => {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('CantoneseDictionaryDB', 1)

        request.onerror = () => {
          resolve({
            error: request.error?.message || 'Failed to open database',
            isCorrect: false
          })
        }

        request.onsuccess = () => {
          const db = request.result
          const objectStoreNames = Array.from(db.objectStoreNames)
          resolve({
            version: db.version,
            objectStores: objectStoreNames,
            isCorrect: objectStoreNames.length > 0
          })
          db.close()
        }

        request.onupgradeneeded = () => {
          // Database created/updated but no data yet
          const db = request.result
          const objectStoreNames = Array.from(db.objectStoreNames)
          resolve({
            version: db.version,
            objectStores,
            message: 'Database exists but may be empty',
            isCorrect: true
          })
          db.close()
        }

        // Timeout after 5 seconds
        setTimeout(() => {
          resolve({
            error: 'Timeout',
            isCorrect: false
          })
        }, 5000)
      } catch (error) {
        resolve({
          error: error instanceof Error ? error.message : 'Unknown error',
          isCorrect: false
        })
      }
    })
  }

  const runTests = async () => {
    setLoading(true)

    // Check 1: Environment Variables
    const envResult = checkEnvironment()
    console.log('[Test] Environment:', envResult)
    setStatus(prev => ({ ...prev, env: envResult.isCorrect }))

    // Check 2: JSON File
    const jsonResult = await checkJSONFile()
    console.log('[Test] JSON File:', jsonResult)
    setStatus(prev => ({ ...prev, jsonFile: jsonResult.isCorrect }))

    // Check 3: IndexedDB
    const indexedDBResult = await checkIndexedDB()
    console.log('[Test] IndexedDB:', indexedDBResult)
    setStatus(prev => ({ ...prev, indexedDB: indexedDBResult.isCorrect }))

    setLoading(false)
  }

  useEffect(() => {
    // Run tests on page load
    runTests()
  }, [])

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <View className="max-w-2xl mx-auto">
        <Text className="text-2xl font-bold text-center mb-6 block">
          Vercel 部署验证测试
        </Text>

        {/* Environment Check */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Text className="block">
                {status.env ? '✅' : '❌'} 环境变量
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="block text-sm text-gray-600 mb-2">
              VITE_USE_LOCAL_API: {checkEnvironment().value}
            </Text>
            <Text className={`block text-sm ${status.env ? 'text-green-600' : 'text-red-600'}`}>
              {status.env ? '✓ 正确：默认使用本地 API' : '✗ 错误：环境变量配置不正确'}
            </Text>
          </CardContent>
        </Card>

        {/* JSON File Check */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Text className="block">
                {status.jsonFile ? '✅' : '❌'} 静态文件访问
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="block text-sm text-gray-600 mb-2">
              路径: /data/dictionary.json
            </Text>
            {status.jsonFile ? (
              <Text className="block text-sm text-green-600">
                ✓ 文件可以访问
              </Text>
            ) : (
              <>
                <Text className="block text-sm text-red-600 mb-2">
                  ✗ 文件无法访问
                </Text>
                <Text className="block text-xs text-gray-500">
                  请检查浏览器 Network 标签，查看请求详情
                </Text>
              </>
            )}
          </CardContent>
        </Card>

        {/* IndexedDB Check */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Text className="block">
                {status.indexedDB ? '✅' : '❌'} IndexedDB
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status.indexedDB ? (
              <Text className="block text-sm text-green-600">
                ✓ 数据库可以访问
              </Text>
            ) : (
              <>
                <Text className="block text-sm text-red-600 mb-2">
                  ✗ 数据库无法访问
                </Text>
                <Text className="block text-xs text-gray-500">
                  请检查浏览器 IndexedDB 权限设置
                </Text>
              </>
            )}
          </CardContent>
        </Card>

        {/* Overall Status */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>
              <Text className="block">总体状态</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status.env && status.jsonFile && status.indexedDB ? (
              <Text className="block text-sm text-green-600 font-semibold">
                ✅ 所有检查通过！应用应该可以正常工作。
              </Text>
            ) : (
              <>
                <Text className="block text-sm text-red-600 font-semibold mb-2">
                  ⚠️ 发现问题，请查看上方详情
                </Text>
                <Button
                  onClick={runTests}
                  disabled={loading}
                  className="mt-2"
                >
                  {loading ? '检查中...' : '重新检查'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Text className="block">调试提示</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="block text-sm text-gray-600 mb-2">
              1. 打开浏览器开发者工具（F12）
            </Text>
            <Text className="block text-sm text-gray-600 mb-2">
              2. 查看 Console 标签，检查错误信息
            </Text>
            <Text className="block text-sm text-gray-600 mb-2">
              3. 查看 Network 标签，检查请求状态
            </Text>
            <Text className="block text-sm text-gray-600 mb-2">
              4. 查看 Application → Storage → IndexedDB，检查数据库
            </Text>
            <Text className="block text-sm text-gray-600">
              5. 如果仍有问题，尝试硬刷新：Ctrl + Shift + R
            </Text>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
