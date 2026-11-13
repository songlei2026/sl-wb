# sl-wb

一个极简的本地动态流应用：发布短动态、按时间倒序浏览、点赞。数据全部保存在浏览器 **Local Storage**，不上传任何服务器。

技术栈：**Node.js + Vue 3 + Pinia + Vite**，测试驱动开发（**Vitest + @vue/test-utils**）。

## 功能

- **昵称设置**：首次进入时设置昵称（可跳过为「访客」），顶栏可随时修改；新动态以当前昵称署名。
- **发布动态**：最多 280 字，实时字数环提示，内容为空时发布按钮禁用，支持 `Ctrl / ⌘ + Enter` 快捷发布。
- **查看动态**：按发布时间倒序展示，显示首字母头像（按 id 生成稳定色相）、昵称、相对时间与正文；无内容时展示空状态引导。
- **点赞**：每条动态可点赞 / 取消点赞，计数与状态持久化。
- **本地持久化**：动态、点赞、昵称全部写入 Local Storage，刷新或重开浏览器后依然保留。
- **清空数据**：底部「清空本地数据」可重置（带二次确认）。

## 快速开始

```bash
npm install
npm run dev      # 本地开发 http://localhost:5173
npm test         # 运行全部单元 / 组件 / 集成测试
npm run build    # 产出 dist/
npm run preview  # 预览构建产物
```

要求 Node.js >= 20.19。

## 测试（TDD）

测试先于实现编写，覆盖四层：

| 层次 | 文件 | 关注点 |
| --- | --- | --- |
| 工具层 | `tests/lib/storage.spec.js` | 读写容错、损坏 JSON 回退、写入异常返回 false |
| 工具层 | `tests/lib/format.spec.js` | 相对时间分档、首字母头像、稳定色相、id 生成 |
| 状态层 | `tests/stores/posts.spec.js` | 缓存恢复与校验、发布校验与截断、点赞、清空、倒序 |
| 状态层 | `tests/stores/profile.spec.js` | 昵称持久化、限长、空值拒绝、访客回退 |
| 组件层 | `tests/components/*.spec.js` | Composer、PostItem、PostList、NicknameDialog 的渲染与事件 |
| 集成层 | `tests/App.spec.js` | 首访弹窗、发布、点赞、历史恢复、清空数据 |

> 测试环境说明：Node 22+ 暴露了实验性的全局 `localStorage`（在未指定 `--localstorage-file` 时为 `undefined`），会遮蔽 jsdom 的实现。`tests/setup.js` 注入了一个符合 Storage 规范的内存实现，保证测试稳定且可被 `vi.spyOn(Storage.prototype)` 拦截。

## 目录结构

```
sl-wb/
├── index.html                     # Vite 入口
├── vite.config.js                 # 插件与 Vitest（jsdom）配置
├── src/
│   ├── main.js                    # 创建应用、注册 Pinia
│   ├── App.vue                    # 组合页面、串起各 store 与事件
│   ├── components/
│   │   ├── AppHeader.vue          # 顶栏：品牌 + 昵称胶囊
│   │   ├── Composer.vue           # 发布区：文本域、字数环、发布按钮
│   │   ├── PostList.vue           # 动态列表 / 空状态
│   │   ├── PostItem.vue           # 单条动态：头像、时间、正文、点赞
│   │   ├── NicknameDialog.vue     # 昵称设置弹窗
│   │   └── ToastStack.vue         # 轻提示
│   ├── stores/
│   │   ├── posts.js               # 动态状态与持久化
│   │   ├── profile.js             # 昵称状态与持久化
│   │   └── toast.js               # 提示消息队列
│   ├── lib/
│   │   ├── storage.js             # Local Storage 安全封装（版本化 key）
│   │   └── format.js              # 时间、头像、id 等纯函数
│   └── styles/main.css            # 深色玻璃质感主题与动效
└── tests/                         # Vitest 测试（先写测试，再实现）
```

## 数据说明

| Key | 内容 |
| --- | --- |
| `slwb.posts.v1` | 动态数组（id、作者、内容、时间戳、点赞数、是否已点赞） |
| `slwb.profile.v1` | 当前昵称 |

读取时会校验结构，损坏或不合法的数据会被丢弃；写入失败（隐私模式 / 配额不足）不会阻塞交互，只做降级提示。数据格式与 1.x 版本兼容，升级后历史动态仍然可读。
