# 粤语词典小程序设计指南

## 品牌定位

**应用定位**：离线优先的粤语学习工具，专注于粤拼学习和词汇查询
**设计风格**：简洁、专业、易读
**目标用户**：以普通话为母语的粤语初学者

## 配色方案

### 主色板
- **主色（学习蓝）**：`bg-blue-500` `text-blue-500` `border-blue-500`
  - 用途：主要按钮、激活状态、重要信息
- **辅助色（友好绿）**：`bg-green-500` `text-green-500`
  - 用途：成功提示、收藏图标、确认操作
- **强调色（活力橙）**：`bg-orange-500` `text-orange-500`
  - 用途：语音输入图标、警示信息

### 中性色
- **背景色**：`bg-gray-50` / `bg-white`
- **主要文字**：`text-gray-900`
- **次要文字**：`text-gray-600`
- **禁用文字**：`text-gray-400`
- **分割线**：`border-gray-200`

### 语义色
- **成功**：`bg-green-50` `text-green-600`
- **警告**：`bg-yellow-50` `text-yellow-600`
- **错误**：`bg-red-50` `text-red-600`
- **信息**：`bg-blue-50` `text-blue-600`

## 字体规范

| 层级 | 用途 | Tailwind 类名 |
|------|------|---------------|
| H1 | 页面标题 | `text-2xl font-bold text-gray-900` |
| H2 | 区块标题 | `text-lg font-semibold text-gray-900` |
| H3 | 子标题 | `text-base font-medium text-gray-900` |
| Body | 正文 | `text-sm text-gray-600` |
| Caption | 辅助文字 | `text-xs text-gray-400` |
| Jyutping | 粤拼 | `text-base font-mono text-blue-600` |

## 间距系统

| 场景 | Tailwind 类名 |
|------|---------------|
| 页面边距 | `px-4 py-3` |
| 卡片内边距 | `p-4` |
| 组件间距 | `gap-3` |
| 区块间距 | `gap-4` |
| 紧凑间距 | `gap-2` |
| 大间距 | `gap-6` |

## 组件使用原则

### 通用 UI 组件优先使用 `@/components/ui/*`

**必须优先使用的组件**：
- **Button**：所有按钮（主要操作、次要操作、图标按钮）
- **Input**：搜索框、输入框
- **Card**：词条卡片、信息卡片
- **Badge**：状态标签、声调标记
- **Tabs**：页面切换、内容分类
- **Dialog**：确认弹窗、提示弹窗
- **Toast**：操作反馈、错误提示
- **Avatar**：用户头像（如需要）
- **Skeleton**：加载状态

**页面组件选型规范**：

| 页面/区块 | 优先使用的组件 | 原生组件（仅用于容器） |
|----------|---------------|-------------------|
| 搜索框 | Input, Button, Icon | View |
| 联想列表 | Card, Badge | View, ScrollView |
| 检字表 | Tabs, Badge | View, ScrollView |
| 词条详情 | Card, Button, Badge | View |
| 历史记录 | Card, Button | View, ScrollView |
| 收藏列表 | Card, Button | View, ScrollView |
| 设置项 | Switch, Button | View |

### 容器样式原则

- **页面容器**：`min-h-screen bg-gray-50`
- **卡片容器**：`bg-white rounded-xl shadow-sm border border-gray-100`
- **卡片内边距**：`p-4`
- **卡片圆角**：`rounded-xl`
- **卡片阴影**：`shadow-sm`

## 导航结构

### TabBar 配置
**底部导航栏**（5个页面）：
1. **首页**（查词） - 搜索图标
2. **检字**（粤拼检字） - 字典图标
3. **历史**（查询历史） - 时钟图标
4. **收藏**（收藏夹） - 星标图标
5. **我的**（设置） - 用户图标

### TabBar 样式配置
- **未选中颜色**：`#999999`
- **选中颜色**：`#1890ff`（主色）
- **背景色**：`#ffffff`
- **边框**：黑色细边框

### 页面路由
- 首页：`pages/index/index`
- 检字：`pages/syllables/index`
- 历史：`pages/history/index`
- 收藏：`pages/favorites/index`
- 我的：`pages/profile/index`
- 词条详情：`pages/word-detail/index`（从多个页面跳转）

## 状态展示原则

### 加载态
- 使用 `@/components/ui/skeleton` 组件
- 卡片加载：`<Skeleton className="h-20 w-full" />`
- 列表加载：重复 Skeleton 卡片

### 空状态
- 使用 Icon + Text 组合
- 图标：使用 lucide-react-taro 图标（如 `Search`, `BookOpen`, `Star`）
- 文字：`text-center text-sm text-gray-400`
- 容器：`flex flex-col items-center justify-center py-12`

### 错误状态
- 使用 Alert 组件或 Icon + Text
- 图标：`AlertCircle` 或 `XCircle`（红/橙色）
- 文字：说明错误原因和解决方案
- 可操作：提供重试按钮

## 小程序约束

### 包体积限制
- 主包大小 ≤ 2MB
- 总包大小 ≤ 20MB
- 本地数据文件建议拆分到分包

### 图片策略
- TabBar 图标：PNG 本地文件（`src/assets/tabbar/`）
- 其他图片：尽量使用图标库，减少图片资源
- 必要图片：使用 TOS 对象存储，URL 引用

### 性能优化
- 列表渲染使用 `ScrollView` 或 `VirtualList`
- 图片使用懒加载
- 数据本地缓存（Taro.setStorage）
- 防抖处理搜索输入

## 特殊组件规范

### 搜索框
- 必须使用 Input 组件，View 包裹
- 右侧提供语音输入按钮（Icon：`Mic`）
- 输入时显示联想列表
- 清空按钮（输入非空时显示）

### 粤拼展示
- 使用等宽字体：`font-mono`
- 颜色：`text-blue-600`
- 大小：`text-base`

### 声调标记
- 使用 Badge 组件
- 小尺寸：`text-xs`
- 颜色：根据声调区分（可选）

### 语音输入按钮
- 使用 Icon：`Mic`
- 位置：搜索框右侧
- 状态区分：正常/录制中（颜色变化）
- 提示：长按开始录制，松开结束

## 无障碍支持

- 所有交互元素设置 `aria-label`
- 图片添加 `alt` 属性
- 支持系统字体缩放
- 搜索、语音、播放按钮有明确标签
