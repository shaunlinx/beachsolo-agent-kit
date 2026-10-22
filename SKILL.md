---
name: beachsolo-coach
version: 7
description: |
  BeachSOLO 公考答题数据教练（数据驱动 · 标准化教学交付引擎）。输入用户从
  BeachSOLO 导出的数据包（beachsolo-attempt-*.json，结构固定、内容因人而异），
  自动化产出一套完整的教学交付物（标准化 9 件套）：统计归因 → 错因→媒介路由
  （概念图解生图/口诀音频/讲解视频链接/权威原文）→ 带教课件云PPT（主交付，
  视觉带教）→ 云文档带教档案（辅交付，长期维护）→ 变式实测与掌握判定 →
  巩固计划 → 交付台账。以交付物为中心、工具自动化、可复现；对话只出现在
  必要确认点。触发：附上 beachsolo-attempt-*.json 或提到"处理数据包/答题分析/
  错题带教/举一反三"。
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, ImageGen, ImageEdit, TextToAudio, VideoSearch, LarkSlides, LarkDoc, LarkWiki, FileUpload, PresentFiles, RichMediaCard
---

# BeachSOLO 数据驱动 · 标准化教学交付引擎

> 用户每次附带一个数据包 `beachsolo-attempt-*.json`：结构固定（卷子全文 +
> 逐题作答 + 原始行为事件流 + 内嵌数据字典），内容因人而异（答题与行为不同）。
> 本技能的价值 = 把这份数据驱动变成**一套标准化的教学交付流水线**，任何人拿到
> 同一数据包，用任何具备基本工具能力的 Agent，都能复现同一套流程与交付物。

## 范式宣言（v7 核心，先读）

1. **artifact-first，不是 chat-first**：交付物是结果，对话是手段。一套数据包的
   终点是一份**带教课件云 PPT（主交付）** + 一份**云文档带教档案（辅交付）**，
   两者都挂入知识库，而不是聊天记录。
2. **九件套交付物清单**（见 `DOCS/DELIVERY-MANIFEST.md`）：每份数据包必须产出
   ①带教课件云PPT ②云文档带教档案 ③统计归因结论 ④行为画像 ⑤逐题讲解+媒介
   ⑥小测与变式判定 ⑦巩固计划 ⑧知识库+画像更新 ⑨交付台账。任何一件缺失 = 交付不完整。
3. **工具是主力，Agent 是调度**：归因用统计脚本，讲解用生图/音频/视频检索，
   课件用 ppt skill 模板化生成，成稿用云文档；禁止用长对话文字"硬讲"代替媒介与文档。
4. **快 = 并行 + 少往返**：批量采集/生成并行调用；错因确认等交互只给轻量确认点
   （点头/纠正），不搞开放式问答；单数据包主流程控制在一次会话内完成。
5. **可复现**：产物目录、命名、模板全部标准化（见 `templates/` 与各 DOCS），
   PPT 工作流见 `DOCS/SLIDES-WORKFLOW.md`（6 个页型模板 + 7 步契约 + 验收清单），
   本次真实交付案例收录于 `examples/REFERENCE-DELIVERY.md`。

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

按错因类型路由媒介（路由表见 `MEDIA-PLAYBOOK.md`），**一次并行采集**全部所需媒介：

| 错因类型 | 首选媒介 | 采集方式 |
|---|---|---|
| concept 概念混淆 | 概念对比图解（生图） | image_gen/image_edit → `media/qNNN-concept.png` |
| memory 记忆/固定搭配 | 口诀音频 + 权威原文链接 | text_to_audio → 下载归档 `media/qNNN-mnemonic.mp3`；web_search 原文链接 |
| reasoning 推理遗漏 | 推理链图解（生图或 SVG） | image_gen → `media/qNNN-reasoning.png` |
| time 时政/时效 | 讲解视频 + 原文链接 | video_search（如抖音）返回分享 URL；web_search 权威原文 |
| careless 流程失误 | 自查清单（不占知识教学） | 直接写入文档，不生成媒介 |

**采集契约（硬规则，详见 `DOCS/TOOL-CONTRACTS.md`）**：
- 生成类产物（图/音频）**必须下载到本地 `media/` 归档**后再交付/嵌入；
  临时短链（如 aka.doubaocdn.com）随时失效，**禁止直接交付**；
- 视频/文章类用可访问 URL 记录（分享链接或官方原文），来源必须可核验；
- 讲解视频链接 + 权威原文链接一并写入云文档对应题目段落。
- **带教课件 PPT 是主交付，不在本步骤生成**——见步骤 3。

## 步骤 3：双交付——带教课件云 PPT（主）+ 云文档档案（辅）

### 3.1 带教课件云 PPT（主交付，必须先做）

按 `DOCS/SLIDES-WORKFLOW.md`（v7 工作流契约）执行，核心流程：

1. **设计系统固定**：A-3 问题牵引·专业版（暖白底+勃垦第红+炭黑+赭石，思源宋体）；
2. **页型路由**：封面(`slide-01-cover`) → 总览(`slide-02-overview`) →
   错题讲解（concept→`slide-03-compare` / memory→`slide-04-memory` /
   reasoning→`slide-05-reasoning`，每题 1 页，≤6 题） → 小结(`slide-06-summary`)；
3. **模板填充**：从 `templates/slides/` 复制模板，替换 `{{占位符}}`（填充规则见
   SLIDES-WORKFLOW §3），所有数字来自数据包；
4. **逐页写入 + lint**：`lark-cli slides +create` 建空白 → 逐页 `+add-slide`
   （必须开启 lint，报错修复后同页重试）→ 页序固定；
5. **回读 + 截图验收**：`+xml-get` 校验页序与 lint → `+screenshot` 逐页检查
   无溢出/错位/空白；
6. **挂知识库**：`lark-cli wiki +move --obj-type slides --obj-token <id>
   --target-space-id <space_id>` 挂入"BeachSOLO 复盘"空间；
7. **交付**：present_files 交付知识库节点 URL。

**硬规则**：禁 emoji、禁 `<b>` 标签（用 `<span bold>`）、每页必须有 `<note>` 讲稿、
文本框高度留够、必须截图验收、必须挂知识库——详见 SLIDES-WORKFLOW §4。

### 3.2 云文档带教档案（辅交付，PPT 之后做）

按 `DOCS/CLOUD-DOC-SPEC.md`（v2 格式铁律）与 `templates/cloud-doc.xml` 生成
**带教档案云文档**，创建后同样挂入"BeachSOLO 复盘"知识空间：

1. **格式铁律**：标题=判断句、正文≤3 行/节；外部资源用 `<bookmark>` 卡片内嵌预览；
   巩固计划与小测/变式用 `<checkbox>` 待办；4-5 张 HTML block 图集承载图示化；
2. **创建**：套 `templates/cloud-doc.xml`（变量替换）→ lark-doc +create → 回读验证；
3. **挂知识库**：`lark-cli wiki +move --obj-type docx --obj-token <document_id>
   --target-space-id <space_id>`（docs-to-wiki 模式）；
4. 文档结构（模板已定）：摘要 → 一图看懂 → 怎么答的 → 错在哪 → 逐题带教
   （含资源卡片/小测/变式）→ 掌握与巩固计划 → 练习资源 → 更新日志。

**PPT 与文档的分工**：PPT = 视觉带教（当场可讲可看，6 页闭环）；
文档 = 长期档案（资源卡片、待办、更新日志、跨卷复发追踪）。两者同挂一个知识空间，
一份卷子 = 两个节点（PPT 节点 + 文档节点）。

## 步骤 4：变式实测与掌握判定（轻量交互，不搞对话式教学）

- 小测与变式题直接**内置在云文档**（每题 1 道小测 + 2-3 道变式，变式优先
  `variants/` 题库与联网真题，注明来源）；
- 用户打开文档作答后回报"对/错"即可（轻量确认点，不给开放式提问）；
- 全对 → 已掌握（masteredPoints）；有错 → 换媒介二次讲解（步骤 4.1）。

### 4.1 补救闭环（未掌握必须当场补救）
1. 换一个用户未用过的媒介二次讲解（图 → 音频 / PPT → 原文+视频），不重复同媒介；
2. 二次变式 1-2 道；通过 → 补记"二次补救后掌握"；仍错 → pendingPoints +
   生成 3 日巩固计划（`node scripts/build-remediation-plan.mjs`）+ 约定复测；
3. 判定结果回写云文档对应题目段落 + profile.json。

## 步骤 5：台账与画像（每次必做）

- 追加 `beachsolo/DELIVERY-LOG.md`（只追加不改写历史），格式见附 D；
- 更新 `profile.json`（processedSessions / masteredPoints / pendingPoints /
  behaviorPatterns / prescriptions / mediaIndex）；
- 更新云文档"更新日志"章节。

## 步骤 6：资源处方（按需，绑定证据）

按 `resources.md` 触发规则推荐（最多 2 专项 + 至多 1 网盘），写入云文档处方章节：
资源 + 触发证据 + 使用建议 + 跟进状态。上次推荐未反馈 → 追问进展而非重复推荐。

## 步骤 7：交付

- **主交付**：带教课件云 PPT 的知识库节点 URL（present_files 交付链接）；
- **辅交付**：云文档带教档案的知识库节点 URL（同一次 present_files 或紧随其后）；
- 富媒体产物（图/音频）按各平台交付规则投喂（RichMediaCard / present_files）；
- 告知用户：PPT 可当场带教、文档可长期维护，下次数据包直接发来即增量追加，待复查自动置顶。

---

## 附 A：工具契约速查

| 能力 | 工具 | 何时用 | 产物去向 |
|---|---|---|---|
| 数据校验/统计 | scripts/*.mjs | 步骤 0/1 | reports/、结论 JSON |
| 概念图解 | image_gen/image_edit | concept 错因 | media/qNNN-concept.png（下载归档） |
| 口诀音频 | text_to_audio | memory 错因 | media/qNNN-mnemonic.mp3（下载归档） |
| 讲解视频 | video_search | time/记忆型 | 分享 URL（写进文档） |
| 权威原文 | web_search/fetch | 全部题 | URL（写进文档参考来源） |
| **带教课件 PPT** | **lark-cli slides（ppt skill）** | **步骤 3.1 主交付** | **飞书幻灯片 URL + 知识库节点** |
| 云文档 | lark-doc | 步骤 3.2 辅交付 | 飞书文档 URL + 知识库节点 |
| 知识库挂载 | lark-cli wiki | 步骤 3.1/3.2 | 知识库节点（PPT+文档各一个） |
| 可视化 | doubao-visualization | HTML block 图集 | 嵌入云文档 |

产物命名统一 `q<题号>-<用途>.<ext>`；全部生成类产物必须归档 media/ 后使用。
PPT 工作流完整契约见 `DOCS/SLIDES-WORKFLOW.md`（7 步 + 6 模板 + 验收清单）。

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

1. **PPT 不可用**（lark-cli slides 报错/无权限）→ 主交付降级为云文档（v6.1 形态），
   在文档开头说明"PPT 生成失败，以文档代替"；详见 SLIDES-WORKFLOW §5；
2. 云文档能力不可用 → 生成本地 HTML 档案（自包含，含同样 9 件套内容），交付 HTML 文件；
3. 生图不可用 → 对比表 / SVG 图解（VISUAL-PLAYBOOK V-08 风格）；
4. 音频不可用 → 原文摘录 + 锚点卡；仅文字时 → 口诀分行 + 间隔复述约定；
5. 检索不可用 → 数据包解析 + 知识库历史条目；
6. 任何降级都要在档案末尾说明"本次用 X 替代 Y，如需完整版可再生成"。

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
