---
name: beachsolo-coach
version: 10
description: |
  BeachSOLO 公考答题数据教练（数据驱动 · 深度挖掘 · 知识脉络沉淀）。输入用户从
  BeachSOLO 导出的数据包（beachsolo-attempt-*.json，结构固定、内容因人而异），
  核心分析由脚本 deep-analysis.mjs 确定性完成（6维度深度归因+全题四分类+带教
  优先级队列），agent 不重算、只解释与检索。产出：深度统计归因 → 全题四分类复盘
  （错题/蒙对题/犹豫题/稳对题）→ 考察点知识脉络（分级沉淀，反复出现才独立建文档）
  → 带教课件云PPT（文档内内容形式）→ 云文档带教档案（最终沉淀载体）→ 知识库挂载
  （首次创建·永久维护）→ 多维表格巩固任务（记忆曲线）→ 交付台账。
  artifact-first、分批交付、工具并行（有子agent时增强）、可复现。
  触发：附上 beachsolo-attempt-*.json 或提到"处理数据包/答题分析/错题带教/举一反三"。
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, ImageGen, ImageEdit, TextToAudio, VideoSearch, LarkSlides, LarkDoc, LarkWiki, LarkBase, FileUpload, PresentFiles, RichMediaCard
---

# BeachSOLO 数据驱动 · 深度挖掘 · 知识脉络沉淀引擎

> 用户每次附带一个数据包 `beachsolo-attempt-*.json`：结构固定（卷子全文 +
> 逐题作答 + 原始行为事件流 + 内嵌数据字典），内容因人而异。
> 本技能的价值 = 把数据驱动变成**一套标准化的教学交付流水线**，任何人拿到同一
> 数据包、用任何具备基本工具能力的 Agent，都能复现同一套流程与交付物。
> **核心不是把数据重新展示一遍，而是挖掘数据背后的成因、定位考察点、沉淀知识脉络。**

## 范式宣言（先读）

1. **artifact-first，不是 chat-first**：一套数据包的终点是**一个知识库节点（云文档）**，
   文档内含 PPT、资源、变式、笔记区、巩固计划，而不是聊天记录或多个独立交付物。
2. **分析交给脚本，不手写**：所有统计与归因由 `scripts/deep-analysis.mjs` 确定性计算
   （秒级、可复现），agent 只负责解释结论、检索资源、组织内容，**禁止重新手写分析**。
3. **深度挖掘，不是数据陈列**：直接引用脚本输出的 6 维度归因结论（用时/改答/蒙题/
   放弃/节奏/模块画像），每条结论都有数据依据，不能只把数字再列一遍。
4. **全题四分类，不是只复盘错题**：错题(深度带教)/蒙对题(当错题)/犹豫题(考点巩固)/
   稳对题(只拓展)。分类结果直接读脚本 `classification`。
5. **聚焦 teachQueue，不追求一次讲完**：按脚本 `teachQueue` 优先级（错题>蒙对>犹豫）
   深度带教；一次完整处理高优先级题，其余写入多维表格巩固任务，后续分批。
6. **考察点分级沉淀**：不是每个考察点都立即建独立文档。先在复盘文档内联；同一考察点
   在 ≥2 份卷子出现（或属于核心高频考点）才升级为独立文档，避免文档爆炸。
7. **交付层级**：图片是 PPT 要素 → PPT/图表是云文档内容形式 → 云文档是每次复盘载体
   → 知识库（复盘文档+考察点文档+资源索引）是最终交付。
8. **分批交付**：第一批（5分钟内）出云文档框架+深度归因+模块画像，再逐题填充，
   用户边看边等；**全程不停下来要求用户推动**，只在必要确认点交互。

## 硬禁令（违反 = 交付不合格）

1. **禁止对话式逐题讲解**作为最终交付——逐题内容必须写进云文档/PPT。
2. **禁止重新手写统计分析**——必须运行 deep-analysis.mjs，直接引用其结论。
3. **禁止跳过云文档**直接在聊天里交付（除非飞书能力完全不可用，才降级本地 HTML）。
4. **禁止只复盘错题**——蒙对题（guessed）必须当错题带教，犹豫题（hesitated）必须巩固。
5. **禁止用权威原文代替讲解视频**——主要学习资源是抖音/B站讲解视频，权威原文只作查证。
6. **禁止变式题用填空题/问答题**——必须是标准选择题（题干+4选项+答案+解析）。
7. **禁止每个考察点都建独立文档**——遵守分级规则（反复出现≥2次才独立）。
8. **禁止交付临时短链**——音频/图片必须下载归档 `media/` 并回读验证。
9. **禁止把连贯任务拆成需用户推动的步骤**——分批是自动交付，不是停下来等指令。

---

## 执行流水线

### 步骤 0 · 初始化与校验（约 30 秒）

```bash
# 1. 初始化标准目录（含 media/，已存在则跳过）
node scripts/report-scaffold.mjs beachsolo
# 2. 校验数据包结构
node scripts/validate-package.mjs "<数据包路径>"
```

- 读取数据包，确认 `attemptId`、卷子名称、题目数；
- 若校验 FAIL，先向用户报告缺失字段，不继续。

### 步骤 1 · 运行深度分析引擎（约 5 秒，核心）

```bash
node scripts/deep-analysis.mjs "<数据包路径>" beachsolo/reports
```

- 产出 `beachsolo/reports/analysis-<id8>.json`，**后续所有步骤直接读这个文件**：
  - `dimensions.*.conclusion`：6 条归因结论（直接引用，不重写数据）
  - `classification`：四类题的完整列表（含每题 signals 行为信号）
  - `moduleProfile`：每个模块的正确率/蒙题率/放弃率/level/advice
  - `teachQueue`：按优先级排序的带教题目队列
- 同时生成基础可视化报告（可作为附件/降级交付）：
  ```bash
  node scripts/generate-report.mjs "<数据包路径>" beachsolo/reports/diagnosis-<id8>.html
  ```

### 步骤 2 · 第一批交付：云文档框架 + 深度归因 + 模块画像（约 3-5 分钟）

> 目标：让用户 5 分钟内看到第一批有价值的内容，边看边等后续。

1. 用 `templates/cloud-doc.xml` 创建云文档（先填充以下章节）：
   - **深度归因**：直接引用 `dimensions` 5 条结论（用时/改答/蒙题/放弃/节奏），
     用 html5-block 可视化（widget-overview/reasons）。
   - **模块能力画像**：渲染 `moduleProfile` 表格（正确率/均时/蒙题率/放弃率/诊断）。
   - **全题四分类**：列出四类题数、题号、复盘策略。
2. 立即把云文档链接交付给用户（present_files / RichMediaCard），说明"逐题带教内容生成中"。
3. 开始创建带教 PPT（步骤 3），逐题填充（步骤 4）。

### 步骤 3 · 带教课件云 PPT（与步骤 4 并行）

> 遵循 `DOCS/SLIDES-WORKFLOW.md`；PPT 是云文档的内容形式，不独立挂库。

- **页数动态 = N + 3**：封面1 + 总览1 + 逐题N（N=本次深度带教题数，来自 teachQueue）
  + 小结1，**禁止写死页数**。
- 总览页：6 维度归因关键数字 + 模块画像。
- 逐题页：考察点定位 + 作答对照 + 错因（引用 signals）+ 核心判断 + 视频入口。
- 变式题页：标准选择题（题干+4选项），答案与解析。
- 每页 `lint` 通过、有 `<note>` 讲稿；完成后截图，PPT URL + 关键页截图回填云文档。

### 步骤 4 · 逐题带教（按 teachQueue，深度优先）

> 对 teachQueue 中每道题深度处理；按优先级排序，错题/蒙对题优先。
> 有 `create_agent` 能力时可派子 agent 并行处理多题（见"并行策略"）；否则用工具并行。

每道题产出（写入云文档 + PPT）：

1. **考察点定位**：结合题目 section/subsection/题干，识别该题考察的具体知识点
   （粒度适中，如"成语辨析·一蹴而就/一挥而就"，不是整模块名）。
2. **错因双角度确认**：
   - 知识角度：引用 `classification.*.signals`（如"改答1次""用时超均值2倍"）；
   - 技巧角度：判断是概念混淆/记忆偏差/推理遗漏/审题失误/时间不足。
3. **讲解（知识+技巧）**：讲清正确答案为何对、干扰项错在哪、这类题的判断方法。
4. **检索优质学习资源（核心价值）**：
   - **抖音**：`video_search`（只支持抖音），搜考察点+真题/口诀/讲解；
   - **B站**：`general_search` 用 `site:bilibili.com 考察点 行测/公考`；
   - 每题至少 1 条讲解视频，以 `<bookmark>` 卡片就近嵌入该题（不是堆在文末）。
5. **变式题**：标准选择题（题干+4选项+答案+解析），优先从题库/真题获取，难度匹配。
6. **笔记区**：保留"我的笔记"空白区（callout，不预填），用户记录后同步到考察点文档。

> 稳对题（stable）：不逐题展开，只在模块层面做考点拓展（相近词/易混点/相关真题），
> 并在对应考察点文档追加对题记录。

### 步骤 5 · 考察点知识脉络（分级沉淀）

> 遵循 `DOCS/KNOWLEDGE-GRAPH.md`。**不是每个考察点都建独立文档**。

- **首次出现的考察点**：在复盘文档内联该考察点内容（定义/易混点/拓展），不单独建文档。
- **升级条件（满足任一）**：① 同一考察点在 ≥2 份卷子出现；② 属于核心高频考点
  （如判断推理的高频题型、资料分析的核心公式）。
- 升级时用 `templates/knowledge-point.xml` 创建独立文档（定义/易混点/相近词/权威来源/
  相关真题/笔记区），并用 `templates/knowledge-point-index.xml` 更新索引。
- 已存在的考察点文档：追加本次真题记录、更新掌握状态、补充用户笔记。

### 步骤 6 · 巩固任务 + 资源索引（集中维护）

- **多维表格**（遵循 `DOCS/REMEDIATION-TRACKER.md`）：
  - 首次用 `+base-create`（必须带 `--table-name --fields`，禁止默认表）；后续复用，
    app_token 记入 profile。
  - 本次未掌握知识点（含 teachQueue 未及深度处理的题）写入表格，按 D+1/D+3/D+7
    记忆曲线设置复习日期（用 calculator 计算日期）。
  - 优先用 Base `+workflow` 的 ReminderTrigger/TimerTrigger 实现到期提醒；
    不可用时在 profile 记录待复查，不每次生成独立 cron。
- **资源索引**：本次检索到的优质视频追加到「学习资源索引」文档（预置 4 个工具链接）。

### 步骤 7 · 挂载知识库 + 台账 + 交付

1. **知识库**（首次创建，永久维护）：
   - 首次：`wiki +space-create` 创建"BeachSOLO 复盘"空间，space_id 记 profile；
   - 用 `wiki +move` 把复盘云文档、考察点文档、资源索引挂入（docs-to-wiki）。
2. **交付台账**：`beachsolo/DELIVERY-LOG.md` 追加本次记录（只追加不改写）。
3. **画像更新**：profile.json 更新 processedSessions、weakSections、掌握/待复查点。
4. 按 `DOCS/DELIVERY-MANIFEST.md` 逐项验收，全部通过后交付云文档知识库链接。

---

## 并行策略（速度优先）

1. **工具并行（通用，首选）**：在同一轮同时发起多个独立工具调用——
   例如同时检索多个考察点的抖音视频、同时生成多个 widget。
2. **子 agent 并行（增强，有则用）**：若运行环境提供 `create_agent`（如豆包 MainAgent），
   可把"逐题带教"按题分组派子 agent 并行（每子 agent 处理若干题的检索+讲解+变式），
   主 agent 负责汇总与云文档组装。**没有该能力时不依赖，退回工具并行。**
3. **脚本优先**：能批量处理的（分析、报告、索引）全部走脚本，不逐题手工。

## 媒介路由（详见 MEDIA-PLAYBOOK.md）

| 错因 | 首选媒介 | 标配资源 |
|---|---|---|
| concept 概念混淆 | 概念图解（生图/对比表） | 抖音/B站讲解视频 |
| memory 记忆/固定搭配 | 锚点卡（**音频默认不生成**，用户要求才做，作文档附件） | 讲解视频 |
| reasoning 推理遗漏 | 推理链图解 | 讲解视频 |
| time 时政时效 | 讲解视频 | 1-2 条视频 |
| careless 流程失误 | 自查清单（不占知识教学） | — |

## 平台能力边界（已按官方文档核实，勿越界）

- **lark-doc**：支持 checkbox/source附件/img/cite/callout/html5-block/bookmark；
  callout 内不能放 img；bookmark 是扩展标签。
- **lark-base**：`+base-create` 必须带 `--table-name --fields`；禁用默认表、禁用 app mode；
  workflow 支持 Timer/ChangeRecord/Reminder 三种触发。
- **lark-wiki**：挂已有文档用 `+move`；统一 `--as user`。
- **lark-slides**：960×540，逐页 add-slide+lint；**不支持嵌音频**；禁 `<b>`（用 `<span bold>`）。
- **video_search 只搜抖音**；B站用 general_search 加 `site:bilibili.com`。
- **音频**：短链必失效，必须下载归档 `media/` 并以 source 附件嵌入文档。

## 降级链（飞书不可用时）

1. 云文档不可用 → 生成本地完整 HTML 档案（generate-report + 内联视频链接）并交付文件；
2. 多维表格不可用 → 巩固任务写入 `beachsolo/plans/` markdown 清单；
3. 知识库不可用 → 产物全部归档 beachsolo/ 目录，保持目录结构可追溯。

## 附：数据契约

- 数据包结构与字段以 `data-contract.json` 为准；五态：
  correct/wrong/unanswered/changedToRight/changedToWrong。
- 每题字段：questionNo/questionId/section/subsection/status/finalAnswer/firstAnswer/
  changeCount/elapsedSeconds/marked/uncertain/draftMatchesFinal。
