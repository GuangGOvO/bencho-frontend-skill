# Bencho Frontend Skill

基于 [bencho.dev](https://bencho.dev/) 的独立前端 Skill：把可观察的微交互思路变成可以在实际项目中执行的设计、实现与评审指导。主要语言为中文，适配 React，也能迁移到其他 Web 框架。

**当前版本：0.1.0。网页分析基线：2026-10-05，48 个组件、7 类交互。** 目录数量由实际客户端与公开运行包交叉核对，不能解读为所有组件均完成了源码、设备和后端测试。

## 包内内容

- [SKILL.md](skills/bencho-frontend/SKILL.md)：触发描述、实现约定、按需参考路由。
- [网页分析](skills/bencho-frontend/references/site-analysis.zh-CN.md)：实际布局、字体/颜色/圆角、技术观察和验证限制。
- [48 项索引](skills/bencho-frontend/references/catalog.md)、[模式选择](skills/bencho-frontend/references/patterns.md)、[动效与可访问性](skills/bencho-frontend/references/motion-and-accessibility.md)。
- [原创 React 示例](skills/bencho-frontend/assets/recipes/)：异步内联确认、原生图片比较、浮动标签；无需动效库。
- 可运行的本地预览、更新检测器、安装器、冲突保护、CI、带 SHA256 的版本包。

这不是官方 Bencho Skill。此仓库不打包原站商标、照片、字体和网站外壳；见 [来源说明](THIRD_PARTY_NOTICES.md) 与 [官方许可](https://bencho.dev/licence)。原创说明与示例按 [MIT](LICENSE) 发布。

## 安装与调用

下载 [最新 Release](https://github.com/GuangGOvO/bencho-frontend-skill/releases/latest) 的 Skill ZIP，解压得到 `bencho-frontend` 文件夹，放到用户 `.agents/skills/` 下。也可在可信的仓库副本中运行：

```powershell
git clone https://github.com/GuangGOvO/bencho-frontend-skill.git
cd bencho-frontend-skill
python scripts/install.py
```

默认安装位置为 `~/.agents/skills/bencho-frontend`。已有同名未管理 Skill 不会被覆盖。安装器要求 Python 3.13+；预览开发需要 Node.js 24+。本 Skill 本身是普通文件夹，没有这些运行时也能由 Agent 阅读。

在 Codex 中使用：

```text
使用 $bencho-frontend，为当前 React 项目的提交、选择和确认控件加入合适的微交互，沿用现有技术栈，并验证键盘、触屏和减少动效。
```

Skill 默认允许自动匹配。Codex 通常自动发现文件变化；未显示时重启。独立 Skill 的本地发现机制见 [OpenAI 官方文档](https://learn.chatgpt.com/docs/build-skills)。

## 持续更新

| 层次 | 机制 | 行为 |
| --- | --- | --- |
| 上游检测 | GitHub Actions 每日北京时间 10:17，另支持手动 Run workflow | 比较目录和 JS/CSS/许可页面摘要；有新指纹时创建 Issue，同指纹不重复 |
| 语义维护 | 配套 Codex 每周复核任务 | 复查真正发生变化的页面，整理说明/示例，验证后创建更新 PR；本地 Codex 任务可在其所属客户端运行时执行 |
| 发版 | 维护者合并后 push 与 VERSION 一致的 `vX.Y.Z` tag | Actions 验证并发布 Skill ZIP 与 SHA256 |
| 本地同步 | 在可信仓库拉取 main 后运行安装器更新 | 检查本地修改；存在修改时停止，保持用户内容 |

GitHub 定时运行是尽力调度，可能延迟；长期没有仓库活动时须检查 Actions 是否仍启用。检测器不使用 OpenAI API 密钥，不自动改写指导；本地 Codex 语义维护任务与 GitHub 定时工作流相互独立。

```powershell
git pull --ff-only
python scripts/install.py --update
```

无变化不产生 Issue；源站不可达或解析器失效会令工作流失败，保留原基线。完整流程和限制见 [维护指南](skills/bencho-frontend/references/maintenance.md)。

## 开发、核对与打包

```powershell
npm ci
npm run check
npm test
npm run build
python scripts/validate.py
python -m unittest discover -s tests -p '*_test.py'
python scripts/package.py
npm run dev -- --port 4173
```

预览为三个原创组件，图片是本地生成的几何 SVG，请求是有失败分支的演示回调。未接入真实删除、上传或支付服务。

```powershell
node scripts/upstream.mjs
# 重新看页面并确认新基线后：
node scripts/upstream.mjs --accept
```

候选和报告写入忽略的 `work/`，版本包写入忽略的 `dist/`。Skill ZIP 内含 `MANIFEST.json` 文件摘要及原创许可，不含依赖目录、抓取的运行包、Git 历史或账号信息。

## 验证记录

2026-10-05 本地通过 Skill Creator 格式校验、TypeScript 检查、Vite 构建、5 项目录/差异测试、2 项安装保护测试以及 ZIP 文件摘要校验。浏览器实际验证了两步确认、Escape 取消、忙碌状态、失败重试与成功反馈、range 的 Home/End 边界、浮动标签输入；375px 宽布局没有横向溢出，减少动效下相关 CSS transition 为 0s。窄屏验证是浏览器模拟，不代表真实手机验证。

远端验证见 [Actions](https://github.com/GuangGOvO/bencho-frontend-skill/actions)。源码导出面板、全量组件、真实手机、读屏软件与业务后端不在本次完整验证范围。
