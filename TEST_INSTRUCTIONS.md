# 粤语词典 - 详情页测试指南

## 问题现象

用户报告：在搜索框中输入"你好"并按回车后，没有显示词条详情。

## 已完成的修复

### 1. 添加详细调试日志
在 `src/services/local-dictionary.ts` 和 `src/network.ts` 中添加了详细的日志输出。

### 2. 创建测试页面
- `/test-detail.html` - 检查IndexedDB数据
- `/test-full-flow.html` - 完整的测试流程模拟

## 需要用户配合的测试步骤

### 步骤1：检查IndexedDB数据

1. 在预览页面访问：`http://localhost:5000/test-detail.html`
2. 查看页面显示的内容
3. 截图并发给我

**预期结果**：
- 数据库总词条数：92717
- 前10条数据应该包含一些词条

**如果显示 "0" 或 "数据库未打开"**：
- 说明数据没有正确导入
- 需要重新加载数据

### 步骤2：测试完整流程

1. 访问：`http://localhost:5000/test-full-flow.html`
2. 点击 "测试'你好'" 按钮
3. 查看日志输出
4. 截图并发给我

**预期日志**：
```
[时间] ========== 开始测试流程 ==========
[时间] 测试词条: 你好
[时间] 数据库打开成功
[时间] 数据库包含 92717 条词条
[时间] [getWordDetail] 查询词条: 你好
[时间] [getWordDetail] 找到词条: 你好 - nei5 hou2
[时间] [Network.request] 返回: {...}
[时间] ========== 测试成功 ==========
[时间] 词条: 你好
[时间] 粤拼: nei5 hou2
[时间] 释义: 你好，我係小明
```

### 步骤3：在主应用中测试

1. 访问主应用：`http://localhost:5000`
2. 在搜索框中输入"你好"
3. **不要**点击联想列表
4. 直接按回车键或点击搜索按钮
5. 打开浏览器控制台（按F12）
6. 切换到 "Console" 标签
7. 查看日志输出
8. 截图发给我

**预期日志**：
```
[Network] ========== 处理 detail 请求 ==========
[Network] option.data: { word: "你好" }
[Network] 查询词: 你好
[LocalDictionary] ========== getWordDetail 开始 ==========
[LocalDictionary] 获取词条详情: 你好
[LocalDictionary] 数据库已就绪，开始查询...
[LocalDictionary] 繁体转换: 你好 -> 你好 false
[LocalDictionary] 直接查询成功: 你好 nei5 hou2
[LocalDictionary] 准备构建词条详情...
[LocalDictionary] buildWordDetail 开始，词条: 你好
[LocalDictionary] buildWordDetail 完成，detail: {...}
[LocalDictionary] ========== getWordDetail 结束 (success) ==========
```

## 可能的结果和对应解决方案

### 结果1：IndexedDB中没有数据

**现象**：
- `/test-detail.html` 显示 "总词条数: 0"
- `/test-full-flow.html` 显示 "数据库为空，尝试加载数据..."

**解决方案**：
1. 清除浏览器缓存
2. 关闭所有标签页
3. 重新打开页面
4. 数据应该会自动重新加载

### 结果2：数据查询失败

**现象**：
- 数据库有数据，但查询返回 null
- 日志显示 "未找到词条"

**解决方案**：
需要修改数据查询逻辑，可能是索引配置问题。

### 结果3：一切正常

**现象**：
- 所有测试都通过
- 主应用也能正常显示详情

**结论**：
问题已解决，可能是之前的缓存问题。

## 快速诊断命令

### 在浏览器控制台执行

```javascript
// 检查IndexedDB状态
indexedDB.open('CantoneseDictionaryDB', 1).onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction(['dictionary'], 'readonly');
  const store = tx.objectStore('dictionary');
  store.count().onsuccess = (e) => console.log('词条数:', e.target.result);
}
```

### 手动测试API

在浏览器控制台执行：

```javascript
fetch('/data/dictionary.json')
  .then(res => res.json())
  .then(data => console.log('数据版本:', data.v, '词条数:', data.stats.words))
```

## 下一步

请按照上述步骤进行测试，并将以下信息发给我：

1. `/test-detail.html` 页面截图
2. `/test-full-flow.html` 的日志截图
3. 主应用中的控制台日志截图
4. 详情页实际显示的内容截图

这样我才能准确定位问题所在。
