# 个人网站规划（可持续迭代版）

适用范围：当前静态单页原型 [index.html](file:///e:/My%20page/index.html) 的后续演进，目标是支持你持续上传/更新：作品集（PDF/JPG）、个人信息、个人文章，以及小项目卡片（列表 → 简介 → 详情 → 外链）。

## 1. 目标与原则

### 1.1 核心目标
- 访问者侧：快速了解你是谁、做过什么、能联系到你；并能顺畅浏览作品/项目/文章。
- 维护者侧（你自己）：不需要频繁手改页面结构，能够用“填表/上传文件”的方式更新内容。

### 1.2 设计与工程原则
- 内容先结构化：先把信息抽成“数据模型”，页面只负责渲染。
- 路由清晰：列表页承载筛选与入口，详情页承载叙事与外链。
- 资产独立：PDF/JPG 等大文件单独管理，支持替换与版本演进。
- 安全优先：任何密钥不放前端；需要 AI/表单等能力时走服务端代理或平台能力。

## 2. 当前现状（基于初稿）

当前页面结构：单页（Hero / Work / About / Contact）+ 右下角聊天浮窗。
- 导航锚点：`#work / #about / #contact`
- Work：3 条“可点击样式”的项目条目，但无详情页与跳转链路
- 缺少：作品集模块、文章模块、项目详情页、内容管理与上传
- 风险点：聊天模块尝试在前端读取 `process.env.API_KEY`，未来需要避免前端泄露密钥

## 3. 信息架构（IA）

建议将网站拆成 5 个一级入口（不改变整体审美，只提升可扩展性）：
- Home：一句话定位 + 精选作品/精选项目 + 最近文章
- Projects：小项目卡片列表（可筛选）→ 项目简介/详情 → 外链（Demo/GitHub/论文等）
- Portfolio：作品集库（PDF/JPG）→ 条目详情（下载/预览/图集）
- Articles：文章列表 → 文章详情（标签/目录/相关推荐）
- About：个人简介、经历、技能、联系入口（简历 PDF 可选）

保留 Contact 区域作为 Home 或 About 的下半部分也可，但建议在导航里依然保留“Contact”锚点，方便快速联系。

## 4. 内容模型（Content Model）

### 4.1 Profile（个人信息）
- id
- name / title / oneLiner
- bio（长简介，可分段）
- avatar（可选）
- location（可选）
- contact：email、socialLinks（平台、用户名、URL）
- resumePdf（可选）
- skills（数组）
- experience（可选：数组）

### 4.2 Project（小项目）
用于：Projects 列表、卡片跳转、项目详情页。
- id（稳定、用于 URL）
- title（标题）
- year（年份）
- tags（数组）
- category（例如：Tool / Research / Visualization）
- summary（卡片短描述）
- coverImage（卡片图）
- intro（简介，详情页上半部分）
- contentSections（数组：背景/问题/方案/技术/结果/反思）
- links（数组：label、url、type：demo/github/paper/download/other）
- status（可选：ongoing/done）
- featured（可选：用于首页精选）

### 4.3 PortfolioItem（作品集条目：PDF/JPG）
用于：Portfolio 列表与详情。
- id（稳定、用于 URL）
- title
- year
- tags（数组）
- role（可选：你的角色）
- summary
- coverImage
- pdf（文件路径或 URL）
- galleryImages（数组：JPG/PNG）
- externalLinks（数组：label、url）

### 4.4 Post（文章）
用于：Articles 列表与详情。
- slug（稳定、用于 URL）
- title
- date（发布日期）
- tags（数组）
- summary
- coverImage（可选）
- content（正文：建议 Markdown 或 HTML）
- status（draft/published）
- featured（可选）

## 5. 页面与路由设计

### 5.1 最小可行路由（保持静态部署可行）
目标：不引入复杂后端，也能形成“可维护内容”的结构。

- `index.html`：Home（保留现有视觉主结构）
- `projects.html`：项目列表
- `project.html?id=<projectId>`：项目详情（含外链按钮）
- `portfolio.html`：作品集列表
- `portfolio-item.html?id=<portfolioId>`：作品集详情（PDF 下载/预览、图集）
- `articles.html`：文章列表
- `post.html?slug=<slug>`：文章详情

### 5.2 交互链路（你想要的卡片跳转）
- Projects 卡片 → 项目简介/详情页 → 详情页内按钮跳转外链
- Portfolio 卡片 → 作品集详情页 → PDF 下载/预览 + 图片图集
- Articles 列表 → 文章详情页 → 文章内外链（可选）

## 6. 数据与资源组织（建议目录结构）

在当前目录基础上，建议新增以下结构（按需逐步增加）：
- `data/`
  - `profile.json`
  - `projects.json`
  - `portfolio.json`
  - `posts.json`
- `assets/`
  - `img/`（封面、图集）
  - `pdf/`（作品集 PDF）

页面通过读取 `data/*.json` 渲染列表和详情，实现“更新内容=更新数据与资产”，减少手改 HTML。

## 7. 内容更新方式（3 条路线）

### 路线 A：静态数据驱动（最低成本，推荐作为起步）
- 你维护：`data/*.json` + 上传 `assets/pdf`、`assets/img`
- 优点：简单、可控、部署容易
- 适合：先把信息架构与链路跑通

### 路线 B：Headless CMS（维护体验最佳）
- 你在后台：填表、上传 PDF/JPG、发布文章
- 前台：读取 CMS 的 API 渲染
- 优点：发布流程清晰（草稿/发布/排序/标签），不需要手改 JSON
- 适合：内容频繁更新、希望“像写博客一样”

### 路线 C：自建后台（自由度最高）
- 需要：鉴权、富文本/Markdown 编辑器、文件上传、存储、备份、审计
- 优点：完全按你习惯定制
- 适合：你想把网站做成长期可扩展的产品

## 8. 关键功能清单（按阶段落地）

### 阶段 1：结构跑通（MVP）
- 导航升级：加入 Projects / Portfolio / Articles（或至少 Projects）
- Work 区域改造为：数据驱动渲染 + 点击跳转到项目详情页
- 建立最小路由：列表页 + 详情页
- 作品集支持：PDF 下载（先做下载，预览可后置）

验收标准：
- 仅通过修改 JSON/替换 PDF/JPG，即可更新列表与详情内容
- Projects 卡片跳转链路完整

### 阶段 2：内容体验与效率
- 标签筛选、排序（年份/标签/精选）
- 文章支持：草稿/发布（即使是本地字段控制也可）
- 图片优化：缩略图、懒加载、WebP（按需）
- SEO 基础：title/description/OG（按需）

### 阶段 3：增长与高级能力（可选）
- 站内搜索（文章/项目/作品集）
- 中英文版本
- 访问统计与转化（哪些项目更受关注）
- 表单/订阅（联系你、邮件订阅文章）

## 9. 安全与合规注意事项

### 9.1 AI/第三方 Key
- 不在前端代码中放任何真实 API Key。
- 若要保留“AI Twin”能力，推荐：
  - 使用服务端代理（你的服务保管 Key），前端只请求你的接口；或
  - 使用提供安全密钥管理的托管平台能力。

### 9.2 文件与隐私
- 作品集 PDF/JPG 需要评估是否包含隐私信息（联系方式、地址、未公开项目等）。
- 如果未来需要“仅部分人可见”，需要引入鉴权与访问控制（静态站默认不可控）。

## 10. 下一步落地（建议按顺序）
- 明确内容范围：你准备首批上线的 Projects、Portfolio、Articles 各 3–6 条
- 确定每个条目的字段：title/year/tags/summary/links 的最小集合
- 先完成 Projects 的“列表 → 详情 → 外链”，再扩展到 Portfolio 与 Articles

