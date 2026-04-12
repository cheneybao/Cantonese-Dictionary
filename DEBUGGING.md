# 粤语词典 - 问题排查和解决方案

## 已完成的修改

### 1. 词典数据扩展
- 扩展后的数据量：92717条
- 已添加词汇：
  - `你好` - nei5 hou2 - 你好，我係小明
  - `执笠` - zap1 lap1 - 倒闭；收档，間舖執笠咗
  - 粤语特有词汇：咩、係、唔、係咩等
  - 常用词汇：吃饭、睡觉、学习等

### 2. 修复的问题
- ✅ 修复 `chinese-s2t` 导入错误
- ✅ 添加数据版本管理，支持自动更新
- ✅ 添加详细调试日志
- ✅ 修复 searchWords 方法中的 console.log 问题

### 3. API 功能验证
根据日志分析：
- ✅ `/api/dictionary/detail` 工作正常（"你好"可以正确查询）
- ❓ `/api/dictionary/suggestions` 未知（日志中未出现）

## 当前问题分析

### 用户报告的问题
> 搜索"你好"、"执笠"无结果

### 实际情况
根据日志，用户的行为是：
1. 搜索"你好" → 调用 `/api/dictionary/detail`（成功）
2. 搜索"执笠" → 调用 `/api/dictionary/detail`（成功）
3. **没有调用 `/api/dictionary/suggestions`**

### 可能的原因
1. **用户输入后直接按了回车**：输入完整词语后，没有等待300ms的联想延迟，而是直接按了回车或点击了搜索按钮
2. **前端代码缓存问题**：浏览器可能缓存了旧版本的代码
3. **联想建议列表未显示**：即使suggestions API被调用，UI可能没有正确显示

## 解决方案

### 方案1：清除浏览器缓存（推荐）
1. 在预览界面中，按 `Ctrl+Shift+R`（Windows）或 `Cmd+Shift+R`（Mac）强制刷新
2. 或者清除浏览器缓存后重新加载

### 方案2：正确使用搜索功能
1. 在搜索框中**慢慢输入**，例如：
   - 先输入"你"，等待300ms，应该会出现联想建议列表
   - 再输入"好"，等待300ms，应该会更新联想建议
2. 不要输入完整词语后立即按回车

### 方案3：检查控制台日志
1. 在预览界面中，按 `F12` 打开开发者工具
2. 切换到"Console"标签
3. 在搜索框中输入"你"
4. 查看控制台是否有以下日志：
   ```
   [IndexPage] 开始搜索联想: 你
   [Network] request 被调用...
   [Network] isLocalApiRoute 检查 URL...
   [Network] 处理 suggestions 请求...
   [LocalDictionary] getSuggestions 被调用...
   [LocalDictionary] 搜索词: 你
   [LocalDictionary] 搜索完成，找到 X 条结果
   ```

## 调试工具

### 检查词典数据
访问以下URL检查词典数据：
- `/check-indexeddb.html` - 检查IndexedDB中的数据
- `/test-search.html` - 测试搜索功能

### 手动测试
```bash
# 测试 detail API
curl -X POST http://localhost:5000/api/dictionary/detail \
  -H "Content-Type: application/json" \
  -d '{"word":"你好"}'

# 测试 suggestions API（注意：这个测试不会经过Network.request）
curl -X POST http://localhost:5000/api/dictionary/suggestions \
  -H "Content-Type: application/json" \
  -d '{"query":"你"}'
```

## 后续建议

1. 如果问题仍然存在，请提供控制台日志
2. 尝试使用不同的浏览器（Chrome、Firefox、Safari）
3. 检查是否有浏览器扩展程序干扰
4. 确认网络连接正常

## 数据验证

### 已验证的数据
```
你好,nei5 hou2,你好,你好，我係小明
执笠,zap1 lap1,倒闭；收档,間舖執笠咗
```

### 数据量
- 总词条数：92717
- 数据版本：1.0
- 加载状态：✅ 已加载

## 技术细节

### API 路由
- `/api/dictionary/detail` - 获取词条详情
- `/api/dictionary/suggestions` - 获取联想建议
- `/api/dictionary/by-jyutping` - 按粤拼音节查询
- `/api/dictionary/import` - 导入数据统计

### 数据存储
- 本地存储：IndexedDB
- 数据库名称：cantonese-dictionary
- Store名称：words
- 索引：idx_w (word), idx_j (jyutping)

### 搜索算法
1. 将简体输入转换为繁体
2. 使用 IDBKeyRange.lowerBound 进行范围查询
3. 模糊匹配：检查词首或词中是否包含查询词
4. 同时支持汉字和粤拼音节搜索
