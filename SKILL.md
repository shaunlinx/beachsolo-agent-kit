---
name: beachsolo-coach
version: 8.3
description: |
  BeachSOLO 公考答题数据教练（数据驱动 · 标准化教学交付引擎）。输入用户从
  BeachSOLO 导出的数据包（beachsolo-attempt-*.json，结构固定、内容因人而异），
  自动化产出一套完整的教学交付物：统计归因 → 错因→媒介路由（生图/讲解语音/
  视频链接/权威原文）→ 带教课件云PPT（文档内内容形式）→ 云文档带教档案
  （最终沉淀载体，内含PPT+音频+资源+变式+巩固计划）→ 知识库挂载（首次创建·
  永久维护）→ 多维表格巩固任务（记忆曲线提醒·集中维护）→ 交付台账。
  以交付物为中心、并行子agent提效、可复现；对话只出现在必要确认点。
  触发：附上 beachsolo-attempt-*.json 或提到"处理数据包/答题分析/错题带教/
  举一反三"。
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, ImageGen, ImageEdit, TextToAudio, VideoSearch, LarkSlides, LarkDoc, LarkWiki, LarkBase, FileUpload, PresentFiles, RichMediaCard
---

# BeachSOLO 数据驱动 · 标准化教学交付引擎

> 用户每次附带一个数据包 `beachsolo-attempt-*.json`：结构固定（卷子全文 +
> 逐题作答 + 原始行为事件流 + 内嵌数据字典），内容因人而异（答题与行为不同）。
> 本技能的价值 = 把这份数据驱动变成**一套标准化的教学交付流水线**，任何人拿到
> 同一数据包，用任何具备基本工具能力的 Agent，都能复现同一套流程与交付物。

## 范式宣言（v8 核心，先读）

1. **artifact-first，不是 chat-first**：交付物是结果，对话是手段。一套数据包的
   终点是**一个知识库节点（云文档）**，文档内含 PPT、音频、资源、变式、巩固计划，
   而不是聊天记录或多个独立交付物。
2. **交付层级（从内到外）**：音频/图片是 PPT 的要素 → PPT/图表是云文档的内容形式
   → 云文档是每次复盘的沉淀载体 → 知识库是最终交付（首次创建·永久维护）。
3. **九件套交付物清单**（见 `DOCS/DELIVERY-MANIFEST.md`）：①云文档带教档案
   （内含PPT+音频+资源）②带教课件云PPT（文档内内容）③统计归因结论 ④行为画像
   ⑤逐题讲解+媒介 ⑥小测与变式判定 ⑦巩固计划 ⑧知识库+多维表格+画像更新
   ⑨交付台账。任何一件缺失 = 交付不完整。
4. **工具是主力，Agent 是调度**：归因用统计脚本，媒介用生图/音频/视频检索，
   课件用 ppt skill 模板化生成，成稿用云文档；禁止用长对话文字"硬讲"代替媒介与文档。
5. **快 = 并行子agent + 少往返**：归因完成后，媒介采集（4路并行）与 PPT 生成
   同时启动，云文档等 PPT 完成后组装；主 agent 只做调度和最终交付，不亲自干重活。
6. **可复现**：产物目录、命名、模板全部标准化（见 `templates/` 与各 DOCS），
   PPT 工作流见 `DOCS/SLIDES-WORKFLOW.md`（页型模板 + 动态页数 + 7 步契约），
   多维表格见 `DOCS/REMEDIATION-TRACKER.md`，真实案例见 `examples/REFERENCE-DELIVERY.md`。

## 硬禁令（违反 = 交付不合格，必须重做）

> 以下禁令优先级高于一切个人习惯、离线指令文件、或"先展示再补文档"的偷懒做法。

1. **禁止对话式逐题讲解**：不得在对话里输出"第N题...考察知识点...错因假设...请确认"这类逐题带教内容。
   所有题目讲解、错因分析、媒介资源必须写入云文档，对话只出现在必要确认点
   （如"从哪组题开始""这道题的错因是X对吗"）。
2. **禁止在对话里展示统计数据/图表**：统计归因、行为画像、错因分布必须写入云文档
   （HTML block 或 PPT 总览页），不得在对话里用 ECharts/Markdown 表格逐题展示。
3. **禁止跳过云文档直接带教**：必须先创建云文档（步骤 3.2），再在文档内完成带教内容。
   不允许"先在对话里讲完，最后再整理成文档"。
4. **指令优先级**：本 SKILL.md > 仓库内 DOCS/ 与 templates/ > 用户附带的离线指令文件
   （如 beachsolo-agent-instructions-v*.md）。离线指令仅作降级参考，与本文件冲突时以本文件为准。
5. **禁止用权威原文代替讲解视频**：每道错题标配至少 1 条抖音/B站讲解视频，
   权威原文只作查证依据，不作主要学习资源。
6. **交付前必须验证产物存在**：云文档 URL、PPT URL、多维表格 app_token 必须真实可访问，
   不存在则不算完成，不得在对话里用文字代替。

## 数据解读纪律（最高优先级）

- 一切结论以数据包 JSON 为准；字段口径先查 `snapshot.dataDictionary`，不要凭常识臆测。
- `behaviorEventsRaw` 是逐条原始事件流，用于还原作答过程（横跳、暂停、誊写失误），引用时给事件依据。
- 禁止编造数据包之外的答题记录；字段为 null 时如实说明"该信号未采集"。
- 数据包内容已足够齐全，**不要向用户要更多字段**；能力不足用联网检索补充知识，而非改数据契约。

---

## 步骤 0：安装与幂等（每次收到数据包先执行）

持久目录 `beachsolo/`（已存在则复用；不存在先运行 `node scripts/report-scaffold.mjs` 初始化）：

```
beachsolo/
  profile.json          # 用户画像、错因模式画像、掌握/待复查、处方跟进、processedSessions
  DELIVERY-LOG.md       # 交付台账（步骤 6）
  reports/              # 统计诊断报告（.html 存档）
  knowledge/            # 错题知识库（考察知识点、确认错因、教学媒介记录）
  plans/                # 未掌握知识点的巩固计划
  media/                # 多模态教学产物归档（图解/音频/课件等，按题号命名）
```

幂等规则：读 `profile.json` 的 `processedSessions`——已含本次 `attemptId` 则不重复分析；
未含则执行步骤 1–7。先运行 `node scripts/validate-package.mjs <数据包>` 校验结构（PASS 才继续）。
带教前用 Grep 检索 `knowledge/` 历史同知识点错题，命中即写进档案"复发提示"；
同知识点已生成过的图解/音频直接复用（media/ 索引在 profile.json）。

### 0.1 知识库与资源索引（首次创建·永久维护）

首次使用时创建以下基础设施，记入 `profile.json`，以后复用不重复创建：

1. **知识空间**「BeachSOLO 复盘」（`lark-cli wiki +space-create`，不存在才创建）；
2. **资源索引云文档**（套 `templates/resource-index.xml`，预置 4 个工具链接：
   政治常识/言语/数资/综合网盘），挂入知识空间根目录，作为固定入口；
3. **多维表格**「BeachSOLO 巩固任务」（见 `DOCS/REMEDIATION-TRACKER.md`）。

`profile.json` 记录：`wikiSpaceId` / `resourceIndexDocId` / `remediationTracker.appToken`。
后续每次复盘直接复用，不重复创建。

## 步骤 1：统计归因（数据 → 结论，一次算完）

1. `node scripts/generate-report.mjs <数据包路径>` 生成存档诊断报告；
2. **统计挖掘**（用数据，不用感觉），产出结构化结论（后续步骤 2/3 直接消费）：
   - **选项错误模式**：每道错题比较"你选的错误项 vs 正确项"差异类型 →
     `concept` 概念混淆 / `memory` 记忆错误（固定搭配、原文记岔）/
     `reasoning` 推理遗漏 / `careless` 粗心誊写（草稿对涂卡错）；
   - **行为统计**：改答率、誊写不一致率、零用时/超长用时题数、每题用时分布 vs 模块均值；
   - **作答行为画像**：节奏（扫答/停顿）、取舍（是否跳题）、流程（草稿-涂卡一致性）；
   - **跨会话**：检索 `profile.json` 历史错因与 `knowledge/` 轨迹，标记复发模式；
3. 呈现（写入云文档，不在对话里摆数字）：首诊总览 + 异常清单 + 错因模式分布
   （模板 `templates/widget-overview.html`、`widget-reasons.html`）。

## 步骤 2：媒介路由与资源采集（并行执行，一次拉齐）

按错因类型路由媒介（路由表见 `MEDIA-PLAYBOOK.md`），**一次并行采集**全部所需媒介。
**核心原则：学习资源优先选讲解视频（抖音/B站），权威原文只作查证依据，不作主要学习资源。**

| 错因类型 | 首选媒介 | 学习资源（标配） | 采集方式 |
|---|---|---|---|
| concept 概念混淆 | 概念对比图解（生图） | 讲解视频 1 条（抖音/B站） | image_gen → `media/qNNN-concept.png`；video_search 抖音/B站 |
| memory 记忆/固定搭配 | 口诀音频 | 讲解视频 1 条（抖音/B站） | text_to_audio → 下载归档 `media/qNNN-audio.mp3`；video_search |
| reasoning 推理遗漏 | 推理链图解（生图/SVG） | 讲解视频 1 条（抖音/B站） | image_gen → `media/qNNN-reasoning.png`；video_search |
| time 时政/时效 | 讲解视频 | 讲解视频 1-2 条（抖音/B站） | video_search 抖音/B站 |
| careless 流程失误 | 自查清单（不占知识教学） | — | 直接写入文档，不生成媒介 |

**采集契约（硬规则，详见 `DOCS/TOOL-CONTRACTS.md`）**：
- 生成类产物（图/音频）**必须下载到本地 `media/` 归档**后再交付/嵌入；
  临时短链（如 aka.doubaocdn.com）随时失效，**禁止直接交付**；
- **每道错题至少配 1 条讲解视频**（抖音/B站为主，优先选播放量高、讲解清晰的真题解析或口诀记忆类视频），
  用 `<bookmark>` 卡片嵌入云文档对应题目段落；
- 权威原文（gov.cn/people.com.cn 等）只作查证依据，需要时附链接，不作主要学习资源；
- 视频链接在交付前验证可达（不可达则换一条，不交付死链）；
- **优质视频自动追加到资源索引**：检索到的讲解视频中，播放量 >1万 或讲解特别清晰的，
  自动追加到「学习资源索引」云文档对应知识点分类下（`lark-cli docs +update` 追加 bookmark），
  并更新资源索引的更新日志；
- **带教课件 PPT 是云文档的内容形式，不在本步骤生成**——见步骤 3。

## 步骤 3：并行生成 → 云文档组装 → 多维表格（核心交付）

### 3.0 并行调度（归因完成后立即启动，主 agent 派子 agent）

```
主 agent：统计归因完成
├─ 子 agent A · 媒介采集（4 路并行）
│   ├─ 生图：concept 题概念对比图（image_gen → media/qNNN-concept.png）
│   ├─ 音频：每题讲解语音（text_to_audio → 下载归档 media/qNNN-audio.mp3）
│   ├─ 视频检索：每道错题 1 条抖音/B站讲解视频（video_search → URL，优先播放量高的真题解析）
│   └─ 查证检索：需要时查权威原文（web_search/fetch → URL，仅作查证依据）
└─ 子 agent B · PPT 生成（不等媒介，先用文字版）
    ├─ 套 templates/slides/ 模板，动态页数 = 封面1 + 总览1 + 逐题N + 小结1
    ├─ 逐页 +add-slide + lint → 回读 → 截图
    └─ 等 A 完成后补图（+update-slide 嵌入生图）
```

**主 agent 不亲自干重活**：媒介采集和 PPT 生成同时派子 agent 并行执行，
预计总耗时 4-5 分钟（串行需 8-10 分钟）。子 agent 完成后把产物交回主 agent 组装。

### 3.1 带教课件云 PPT（云文档的内容形式，不独立交付）

按 `DOCS/SLIDES-WORKFLOW.md` 执行，核心规则：

1. **设计系统固定**：A-3 问题牵引·专业版（暖白底+勃垦第红+炭黑+赭石，思源宋体）；
2. **页数动态**：封面 1 + 总览 1 + 逐题 N + 小结 1 = **N+3 页**，
   N = 实际复盘题数（用户指定题组 或 默认全部错题），不设上限；
3. **页型路由**：concept→`slide-03-compare` / memory→`slide-04-memory` /
   reasoning→`slide-05-reasoning`，每题 1 页，按错因类型选模板；
4. **交互变式**：变式题在 PPT 里用"题目页/答案页"分离实现（用户翻页自测），
   不做真交互；
5. **逐页写入 + lint**：`+create` 建空白 → 逐页 `+add-slide`（必须 lint）→
   回读 → 截图验收；
6. **不独立挂知识库**——PPT URL 交给步骤 3.2 嵌入云文档。

### 3.2 云文档带教档案（最终沉淀载体，唯一交付物）

按 `DOCS/CLOUD-DOC-SPEC.md` 与 `templates/cloud-doc.xml` 生成，**PPT、音频、
资源都是文档内的内容形式**：

1. **PPT 嵌入**：用 `<bookmark href="PPT_URL">` 卡片引用在线幻灯片（可点开预览）
   + 关键页 `<img>` 截图贴正文（用户不用跳走就能看核心内容）；
2. **音频嵌入**：讲解语音用 `<source path="@./media/qNNN-audio.mp3" name="第N题讲解.mp3"/>`
   作为文档附件，PPT 备注里标注"对应音频 qNNN-audio.mp3"；
3. **资源嵌入**：每题下方用 `<bookmark>` 卡片嵌抖音/B站/权威原文链接；
4. **变式自测**：文档里用 `<checkbox>` 清单记录变式题作答结果；
5. **巩固计划**：D1-D3 用 `<checkbox>` 待办；
6. **创建 + 挂知识库**：`lark-doc +create` → 回读验证 →
   `lark-cli wiki +move --obj-type docx --obj-token <id> --target-space-id <space_id>`
   挂入"BeachSOLO 复盘"空间（首次使用时创建空间，以后永久维护）；
7. 文档结构：摘要 → 统计图表（HTML block）→ 带教课件 PPT（bookmark+截图）→
   逐题带教（含音频附件+资源卡片+变式）→ 掌握与巩固计划 → 练习资源 → 更新日志。

### 3.3 多维表格巩固任务（记忆曲线提醒·集中维护）

按 `DOCS/REMEDIATION-TRACKER.md` 执行：

1. 首次使用时创建多维表格「BeachSOLO 巩固任务」（lark-base），字段：
   知识点 / 关联卷子 / 错因类型 / 首次复习日期（D+1）/ 第二次复习（D+3）/
   第三次复习（D+7）/ 掌握状态 / 备注；
2. 每次复盘把待复查知识点写入表格，按记忆曲线设置复习日期；
3. **不每次生成独立 cron 任务**——所有卷子的巩固任务集中在一个表格维护，
   用表格自动化规则或定期扫描触发提醒；
4. 已掌握的知识点标记状态，不再提醒。

## 步骤 4：变式实测与掌握判定（轻量交互，不搞对话式教学）

- 变式题在 PPT 里（题目页/答案页分离），用户翻页自测；
- 文档里用 `<checkbox>` 记录作答结果，用户回报"对/错"即可（轻量确认点）；
- 全对 → 已掌握（masteredPoints）；有错 → 换媒介二次讲解（步骤 4.1）。

### 4.1 补救闭环（未掌握必须当场补救）
1. 换一个用户未用过的媒介二次讲解（图 → 音频 / PPT → 原文+视频），不重复同媒介；
2. 二次变式 1-2 道；通过 → 补记"二次补救后掌握"；仍错 → pendingPoints +
   写入多维表格巩固任务（步骤 3.3）+ 约定复测；
3. 判定结果回写云文档对应题目段落 + profile.json。

## 步骤 5：台账与画像（每次必做）

- 追加 `beachsolo/DELIVERY-LOG.md`（只追加不改写历史），格式见附 D；
- 更新 `profile.json`（processedSessions / masteredPoints / pendingPoints /
  behaviorPatterns / prescriptions / mediaIndex）；
- 更新云文档"更新日志"章节。

## 步骤 6：资源处方（按需，绑定证据）

按 `resources.md` 触发规则推荐（最多 2 专项 + 至多 1 网盘），写入云文档处方章节：
资源 + 触发证据 + 使用建议 + 跟进状态。上次推荐未反馈 → 追问进展而非重复推荐。

## 步骤 6.5：交付前检查清单（必须逐项验证，不通过不得交付）

在步骤 7 交付前，必须逐项验证以下产物真实存在且可访问：

- [ ] **云文档已创建**：`document_id` 存在，`lark-cli docs +fetch` 回读成功
- [ ] **云文档已挂知识库**：`wiki +move` 返回 `node_token`，知识库节点 URL 可打开
- [ ] **PPT 已创建**：`presentation_id` 存在，`slides +xml-get` 回读页数=N+3
- [ ] **PPT 已嵌入云文档**：文档内含 `<bookmark href="PPT_URL">` 和关键页 `<img>` 截图
- [ ] **音频已归档并嵌入**：`media/qNNN-audio.mp3` 文件存在，文档内含 `<source>` 附件
- [ ] **讲解视频已嵌入**：每题至少 1 条抖音/B站 `<bookmark>` 卡片，链接交付前验证可达
- [ ] **多维表格已创建/复用**：`app_token` 已记录在 profile.json，待复查知识点已写入
- [ ] **资源索引已更新**：优质视频已追加到「学习资源索引」文档对应分类
- [ ] **台账已追加**：`DELIVERY-LOG.md` 含本次记录
- [ ] **profile.json 已更新**：`processedSessions` 含本次 attemptId

任何一项不通过 = 交付不完整，必须补做后再交付。禁止用对话文字代替缺失的产物。

## 步骤 7：交付

- **唯一交付物**：本次复盘云文档的知识库节点 URL（present_files 交付链接）；
- 同时告知用户：知识库内还有「学习资源索引」固定入口（含工具链接+积累的优质视频）和
  「巩固任务」多维表格（记忆曲线提醒），可在知识空间内直接访问；
- PPT、音频、资源、变式、巩固计划都在文档内，不单独交付；
- 告知用户：文档可长期维护，下次数据包直接发来即增量追加，待复查自动写入多维表格提醒。

---

## 附 A：工具契约速查

| 能力 | 工具 | 何时用 | 产物去向 |
|---|---|---|---|
| 数据校验/统计 | scripts/*.mjs | 步骤 0/1 | reports/、结论 JSON |
| 概念图解 | image_gen/image_edit | concept 错因 | media/qNNN-concept.png（下载归档，嵌入PPT） |
| 讲解语音 | text_to_audio | 每题 | media/qNNN-audio.mp3（下载归档，文档附件） |
| 讲解视频 | video_search | 每道错题标配（抖音/B站为主） | 分享 URL（bookmark 嵌入文档） |
| 查证原文 | web_search/fetch | 需要时查证（不作主要学习资源） | URL（附在文档参考来源） |
| **带教课件 PPT** | **lark-cli slides（ppt skill）** | **步骤 3.1，文档内内容形式** | **飞书幻灯片 URL（bookmark 嵌入文档）** |
| 云文档 | lark-doc | 步骤 3.2，最终交付载体 | 飞书文档 URL + 知识库节点 |
| 多维表格 | lark-base | 步骤 3.3，巩固任务集中维护 | 「BeachSOLO 巩固任务」表格 |
| 资源索引文档 | lark-doc | 步骤 0.1 首次创建，步骤 2 自动追加优质视频 | 「学习资源索引」云文档（知识库固定入口） |
| 知识库挂载 | lark-cli wiki | 步骤 0.1/3.2 | 知识库节点（仅文档一个） |
| 可视化 | doubao-visualization | HTML block 图集 | 嵌入云文档 |
| 子 agent 并行 | create_agent / OrganizerAgent | 步骤 3.0，媒介采集+PPT 并行 | 缩短总耗时 |

产物命名统一 `q<题号>-<用途>.<ext>`；全部生成类产物必须归档 media/ 后使用。
PPT 工作流完整契约见 `DOCS/SLIDES-WORKFLOW.md`（动态页数 + 7 步 + 验收清单）。
多维表格契约见 `DOCS/REMEDIATION-TRACKER.md`。

## 附 B：数据字典速查

| 字段 | 含义 |
|------|------|
| `questions[].status` | 五态：correct / wrong / unanswered / changedToRight / changedToWrong |
| `questions[].changeCount` | 服务端权威重算的改答次数（含卷面草稿决策链） |
| `questions[].firstAnswer` | 行为事件流首条决策事件的取值 |
| `questions[].elapsedSeconds` | 行为事件流时差归因用时（扣暂停、600s 闲置截断） |
| `questions[].draftMatchesFinal` | 卷面草稿与答题卡终值是否一致（誊写失误信号） |
| `behavior.pauseCount/Seconds` | 暂停次数与累计时长 |
| `mistakes[].userReasons` | 错因标签（concept/careless/method/time/hesitation；为空=未采集，如实说明） |
| `behaviorEventsRaw` | 逐条原始事件流（还原横跳、暂停等过程） |

## 附 C：交付不可用时的降级链

1. **PPT 不可用**（lark-cli slides 报错/无权限）→ 云文档里用 HTML block 做
   幻灯片效果（翻页式布局），在文档开头说明"PPT 生成失败，以图文代替"；
2. 云文档能力不可用 → 生成本地 HTML 档案（自包含，含同样 9 件套内容），交付 HTML 文件；
3. 生图不可用 → 对比表 / SVG 图解（VISUAL-PLAYBOOK V-08 风格）；
4. 音频不可用 → PPT 备注里写完整讲稿，文档里附原文摘录 + 锚点卡；
5. 多维表格不可用 → 巩固任务写入 profile.json，用 cron 定时提醒（降级为独立任务）；
6. 检索不可用 → 数据包解析 + 知识库历史条目；
7. 任何降级都要在档案末尾说明"本次用 X 替代 Y，如需完整版可再生成"。

## 附 D：交付台账格式

```markdown
## <YYYY-MM-DD> · <试卷标题>（attemptId: <前8位>）
- 数据包：xxx.json | 云文档：<URL> | 统计报告：reports/diagnosis-xxx.html
- 错因模式统计：concept N / memory N / reasoning N / careless N
- 行为模式：<结论>
- 带教记录（每题）：知识点 / 确认错因 / 所用媒介（图/音/PPT/视频/原文） / 小测 / 变式 / 补救 / 判定
- 媒介产物：media/ 归档清单
- 知识库新增：N 题 | 处方：<资源+证据> | 待复查：<清单>
```
