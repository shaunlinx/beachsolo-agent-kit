# 工具契约（TOOL CONTRACTS）

> Agent 工具能力 → 本技能产物之间的映射与硬规则。读本文件前先读 SKILL.md 附 A。

## 1. 生成类产物必须归档（血的教训）

**问题**：v5 实测中 `text_to_audio_plus` 返回 `aka.doubaocdn.com/s/xxx` 短链，
数小时后 curl 验证为 **404**。任何平台的临时短链都不是可靠交付物。

**规则**：
1. 所有生成类产物（图片 / 音频 / PPT / 视频）**拿到 URL 后立即下载归档**：
   - 音频：`curl -L -o media/q<题号>-mnemonic.mp3 "<url>"`
   - 图片：`curl -L -o media/q<题号>-concept.png "<url>"`
   - 不能下载的 → 视为不可靠，**禁止交付**，改用降级链；
2. 归档后回读验证（文件存在 + 非空 + 大小合理），并把本地路径记入
   `profile.json.mediaIndex` 与交付台账；
3. 云文档嵌入时：本地文件先经文件上传能力转可靠 URL 再嵌入，或用文档平台
   的媒体插入能力（lark-doc +media-insert）；**不得直接粘贴临时短链**；
4. 对话内投喂富媒体（图/音频/视频）按平台交付规则走 RichMediaCard/present_files。

## 2. 检索类产物的引用规则

- 视频（如抖音讲解）：`video_search` 返回分享 URL → 原样写入云文档对应题目段落；
- 权威原文：`web_search`/`web_fetch` 命中政府网、人民网、求是网等官方源 →
  记入云文档"参考来源"编号链接（禁止正文裸 URL）；
- 引用必须可核验：标题 + 来源机构 + 获取日期。

## 3. 各工具调用时机与产物去向

| 工具 | 触发 | 动作 | 产物去向 |
|---|---|---|---|
| scripts/validate-package.mjs | 步骤 0 | 结构校验 | PASS/失败报告 |
| scripts/generate-report.mjs | 步骤 1 | 统计诊断 | reports/diagnosis-*.html |
| image_gen / image_edit | concept 错因 | 概念对比图解 | media/qNNN-concept.png |
| text_to_audio | memory 错因 | 口诀音频 | media/qNNN-mnemonic.mp3（下载） |
| ppt | reasoning 错因 | 2-3 页带教课件 | media/qNNN-deck.pptx |
| video_search | 时政/记忆型 | 讲解视频 | 分享 URL（写文档） |
| web_search / web_fetch | 全部 | 权威原文/变式题源 | URL（写文档） |
| lark-doc | 步骤 3 | 创建/更新带教档案 | 飞书文档 URL |
| doubao-visualization | 步骤 3 | HTML block 图集 | 嵌入文档（templates/widget-*.html） |

## 4. 并行与速度

- 步骤 2 的媒介采集（检索视频/原文 + 生成图解/音频/PPT）**一次并行发起**，
  不串行等待；
- 同题多媒介（如记忆型：音频 + 原文链接）同批生成；
- 全流程优先最小必要动作：能用一个图说明的不生成两个；能复用 media/ 的不重复生成。

## 5. 降级链（工具缺失时）

1. 云文档不可用 → 本地 HTML 档案（含同样 8 件套）；
2. 生图不可用 → 对比表 / SVG 图解；
3. 音频不可用 → 原文摘录 + 锚点卡；
4. PPT 不可用 → 推理链图 + 分步列表；
5. 视频检索不可用 → 权威原文 + 解读文章链接；
6. 降级必须在档案末尾注明"本次用 X 替代 Y"。
