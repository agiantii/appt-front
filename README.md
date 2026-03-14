

# APPT Front - AI 驱动的幻灯片协作编辑平台

基于 React + TypeScript 构建的现代化幻灯片编辑器，支持实时协作、AI 辅助创作和版本管理。

## ✨ 核心功能

### 🎨 专业幻灯片编辑器
- **CodeMirror 6 驱动**：流畅的 Markdown 编辑体验
- **实时预览**：Dev/Build 双模式即时预览
- **语法高亮**：支持 Markdown、HTML、CSS、JavaScript
- **智能大纲**：自动生成幻灯片目录结构
- **拖拽排序**：可视化调整幻灯片顺序

### 🤖 AI 智能辅助
- **AI 内容生成**：根据主题自动生成幻灯片内容
- **智能建议**：提供排版和设计建议
- **AI 生图**：集成 Gemini AI 图像生成能力
- **代码片段推荐**：智能推荐可复用代码块

### 👥 实时协作
- **多人在线编辑**：基于 Yjs + Hocuspocus 的 OT 算法
- **实时光标追踪**：查看协作者的编辑位置
- **在线状态显示**：实时展示协作者列表
- **评论系统**：针对特定内容添加评论和讨论

### 🔐 权限与安全管理
- **角色权限控制**：Owner / Editor / Commenter / Viewer
- **JWT 认证**：安全的用户身份验证
- **文档可见性**：公开/私有文档灵活控制
- **协作成员管理**：邀请和管理团队成员

### 📚 版本控制
- **版本历史**：自动保存每次修改记录
- **版本对比**：查看不同版本间的差异
- **一键回滚**：快速恢复到历史版本
- **提交消息**：为重要版本添加说明

### 🗂️ 知识库管理
- **SlideSpace 空间**：按项目或主题组织幻灯片
- **文档结构拖拽**：支持拖拽调整文档顺序
- **层级结构**：支持父子文档树形结构
- **标签分类**：灵活的文档分类系统
- **全局搜索**：快速定位目标文档

## 🛠️ 技术栈

### 前端框架
- **React 19.2.4**：最新 React 版本
- **TypeScript 5.8**：类型安全的开发体验
- **Vite 6.2**：极速开发和构建工具

### 核心库
- **React Router v7**：客户端路由管理
- **CodeMirror 6**：强大的代码编辑器
- **Yjs 13.6**：高性能 CRDT 协作库
- **@hocuspocus/provider**：WebSocket 协作提供者

### UI 与工具
- **Lucide React**：现代图标库
- **Axios**：HTTP 请求封装
- **diff**：版本差异对比

## 📦 项目结构

```
appt-front/
├── api/                    # API 接口封装层
│   ├── ai.ts              # AI 功能接口
│   ├── comment.ts         # 评论接口
│   ├── slide.ts           # 幻灯片接口
│   ├── space.ts           # 空间管理接口
│   ├── snippet.ts         # 代码片段接口
│   ├── version.ts         # 版本管理接口
│   ├── upload.ts          # 文件上传接口
│   └── user.ts            # 用户认证接口
├── components/             # 可复用组件
│   ├── Auth/              # 认证相关组件
│   │   └── AuthModal.tsx  # 登录注册模态框
│   ├── Common/            # 通用组件
│   │   ├── Modal.tsx      # 模态框组件
│   │   └── Toast.tsx      # 提示消息组件
│   ├── Editor/            # 编辑器相关组件
│   │   ├── ResizablePanels.tsx
│   │   └── CollaboratorModal.tsx
│   ├── Layout/            # 布局组件
│   │   └── DashboardLayout.tsx
│   └── SpaceTree/         # 空间树组件
│       └── FileTree.tsx
├── constant/               # 常量定义
│   └── permissions.ts     # 权限配置
├── pages/                  # 页面级组件
│   ├── Dashboard/         # 仪表板页面
│   │   ├── Start.tsx      # 起始页（工作台）
│   │   └── Explore.tsx    # 探索发现页
│   ├── Editor/            # 编辑器页面
│   │   ├── EditorPage.tsx # 主编辑器
│   │   ├── useSlideParser.ts
│   │   └── components/    # 编辑器子组件
│   │       ├── EditorHeader.tsx
│   │       ├── EditorSidebar.tsx
│   │       └── EditorPreview.tsx
│   ├── Presentation/      # 演示页面
│   │   └── PresentationPage.tsx
│   ├── Settings/          # 设置页面
│   │   └── SettingsPage.tsx
│   └── Space/             # 空间管理页面
│       ├── SpaceDetail.tsx
│       └── SpaceSettings.tsx
├── utils/                  # 工具函数
├── types.ts                # TypeScript 类型定义
├── App.tsx                 # 应用入口组件
├── index.tsx               # 渲染入口
└── vite.config.ts          # Vite 配置文件
```

## 🚀 快速开始

### 前置要求

- **Node.js**: >= 18.x
- **包管理器**: npm / pnpm / yarn
- **Gemini API Key**: （可选）用于 AI 功能

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd appt-front
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或使用 pnpm
   pnpm install
   ```

3. **配置环境变量**
   
   创建 `.env.local` 文件并配置：
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_API_BASE_URL=http://localhost:3000
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```
   
   访问 `http://localhost:5173` 查看应用

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📖 使用指南

### 创建幻灯片

1. 点击 "Create Slide" 按钮
2. 选择知识库（SlideSpace）
3. 输入幻灯片标题
4. 开始编辑内容

### 编辑幻灯片

- **Markdown 语法**：使用标准 Markdown 编写内容
- **分隔符**：使用 `---` 分隔不同幻灯片页面
- **代码高亮**：支持多种编程语言语法高亮
- **实时预览**：右侧面板实时显示效果

### 协作功能

1. **邀请成员**：在设置中添加协作者邮箱
2. **设置权限**：选择合适的角色权限
3. **实时编辑**：多人同时编辑同一文档
4. **评论互动**：对特定内容添加评论

### AI 功能使用

1. 打开 AI 面板（侧边栏）
2. 输入你的需求（如："创建一个关于 React Hooks 的幻灯片"）
3. AI 将自动生成内容
4. 审核并插入到编辑器

### 版本管理

- **手动保存**：Ctrl+S 保存当前内容
- **创建版本**：Ctrl+Shift+S 保存并创建新版本
- **查看历史**：在 Git 面板中查看所有版本
- **版本回滚**：点击回滚按钮恢复历史版本

## 🔌 API 集成

### 后端服务配置

在 `.env.local` 中配置后端 API 地址：

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 主要 API 模块

| 模块 | 功能描述 |
|------|----------|
| `slideApi` | 幻灯片 CRUD、内容保存、权限管理 |
| `spaceApi` | 知识库空间创建、查询、成员管理 |
| `versionApi` | 版本历史查询、版本创建、回滚 |
| `commentApi` | 评论增删改查、评论树展示 |
| `snippetApi` | 代码片段管理、插入编辑器 |
| `uploadApi` | 图片上传、资源管理 |
| `userApi` | 用户认证、信息获取 |
| `aiApi` | AI 内容生成、智能建议 |

## 🧪 开发指南

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 配置
- 组件采用函数式编程风格
- 使用 Hook 管理状态和副作用

### 添加新页面

1. 在 `pages/` 目录下创建新页面组件
2. 在 `App.tsx` 中添加路由配置
3. 在导航组件中添加链接

### 组件开发最佳实践

```typescript
// 使用 TypeScript 定义 Props 接口
interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

// 使用 React.FC 定义组件
const MyComponent: React.FC<MyComponentProps> = ({ title, onClick }) => {
  return <div onClick={onClick}>{title}</div>;
};
```

### 状态管理

- 局部状态：使用 `useState`、`useReducer`
- 跨组件通信：使用 Props 传递
- 全局状态：考虑使用 Context API

### 调试技巧

- 使用 React Developer Tools
- 开启 Source Map 调试
- 利用浏览器 Network 面板查看 API 请求

## ❓ 常见问题

### 环境配置问题

**Q: 找不到 Node 模块？**
```bash
# 清理缓存重新安装
rm -rf node_modules package-lock.json
npm install
```

### API 连接问题

**Q: 无法连接后端 API？**
- 检查 `.env.local` 中的 `VITE_API_BASE_URL` 配置
- 确认后端服务已启动
- 检查浏览器控制台是否有 CORS 错误

### 协作功能异常

**Q: 无法看到其他协作者？**
- 检查 WebSocket 连接状态
- 确认所有用户都有编辑权限
- 刷新页面重新建立连接

### 性能优化建议

- 大文件编辑时关闭实时预览
- 定期清理版本历史
- 使用代码片段减少重复输入

## 📄 许可证

MIT License

## 🔗 相关链接

- [AI Studio 项目页面](https://ai.studio/apps/3b667a16-78a6-4ef2-84c4-3aaa19f0f667)
- [React 官方文档](https://react.dev/)
- [CodeMirror 文档](https://codemirror.net/)
- [Yjs 协作库](https://docs.yjs.dev/)

---

<div align="center">
  <strong>🚀 开始你的幻灯片创作之旅！</strong>
</div>