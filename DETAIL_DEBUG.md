# 详情页问题排查

## 问题现象

用户报告：搜索"你好"后没有显示词条详情。

## 初步排查结果

### 1. API 测试

```bash
curl -X POST http://localhost:5000/api/dictionary/detail \
  -H "Content-Type: application/json" \
  -d '{"word":"你好"}'
```

结果：
```json
{"code":200,"message":"success","data":null}
```

**问题**：返回 `data: null`，说明没有找到词条。

### 2. 数据验证

CSV 文件中确实包含"你好"：
```csv
你好,nei5 hou2,你好,你好，我係小明
```

### 3. IndexedDB 状态

**待验证**：需要检查 IndexedDB 中是否真的包含了数据。

### 4. Network 层拦截

curl 请求没有触发 Network.request 的日志，说明：
- curl 请求直接发送到了后端
- Network.request 只在浏览器环境中拦截
- 需要在浏览器中测试才能看到真实情况

## 可能的原因

### 原因1：IndexedDB 数据未加载
- 数据库初始化成功，但没有导入数据
- 版本检查逻辑导致跳过了数据导入

### 原因2：数据查询逻辑错误
- getWordDetail 方法有问题
- 索引查询失败

### 原因3：数据路径问题
- 开发环境中数据文件路径不正确
- 数据文件没有正确复制到构建输出目录

## 下一步行动

### 1. 在浏览器中测试
1. 打开预览页面：http://localhost:5000
2. 在搜索框中输入"你好"
3. 按回车或点击搜索按钮
4. 打开浏览器控制台（F12）
5. 查看是否有以下日志：
   ```
   [Network] ========== 处理 detail 请求 ==========
   [LocalDictionary] ========== getWordDetail 开始 ==========
   ```

### 2. 检查 IndexedDB 数据
访问测试页面：/test-detail.html
- 检查数据库总词条数
- 检查是否包含"你好"

### 3. 查看导入日志
检查控制台是否有数据导入日志：
```
[LocalDictionary] 导入词: 㓟皮 pai1 pei4
[LocalDictionary] 导入词: 㓟菠蘿皮 pai1 bo1 lo4 pei4
...
[LocalDictionary] 成功导入 92717 条词条
```

## 调试代码

已添加的调试日志：

### getWordDetail 方法
- 开始查询
- 数据库状态检查
- 繁体转换结果
- 查询结果
- 构建详情过程
- 最终结果

### Network 层
- 请求拦截
- 路由匹配
- 参数传递
- 响应数据

## 预期行为

### 正常流程
1. 用户输入"你好"并按回车
2. 前端调用 Network.request({ url: '/api/dictionary/detail', data: { word: '你好' } })
3. Network.request 拦截请求，调用 localDictionary.getWordDetail('你好')
4. getWordDetail 从 IndexedDB 查询"你好"
5. 返回词条详情
6. 前端显示详情页

### 异常流程
1. 如果 IndexedDB 没有数据，返回 null
2. 前端显示"未找到词条"

## 待确认

请用户在浏览器中测试并提供：
1. 控制台日志截图
2. /test-detail.html 页面显示的数据
3. 详情页实际显示的内容
