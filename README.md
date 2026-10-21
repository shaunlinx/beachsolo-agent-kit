# beachsolo-agent-kit

BeachSOLO 公考刷题应用的 **Agent 交付工具包**。

用户从 BeachSOLO 导出答题数据包（`beachsolo-attempt-*.json`），把这个仓库作为
Agent 技能安装，即可让 Agent 自动完成首诊分析、专项攻克计划、答题策略建议等工作。

---

## 快速安装

### Claude Code（推荐）

在 Claude Code 对话框输入：

```
安装技能：github:shaunlinx/beachsolo-agent-kit
```

或直接克隆到 `~/.claude/skills/`：

```bash
git clone https://github.com/shaunlinx/beachsolo-agent-kit.git ~/.claude/skills/beachsolo-agent-kit
```

### 其他 Agent 平台

将本仓库的 `SKILL.md` 内容作为系统提示词或技能文件提供给 Agent，
并告知数据包文件路径。

---

## 仓库结构

```
beachsolo-agent-kit/
├── SKILL.md                      # Agent 技能定义（v4 可视化带教闭环，唯一入口）
├── VISUAL-PLAYBOOK.md            # 带教交互可视化规范（V-01~V-10 模板，执行前必读）
├── resources.md                  # 专项练习资源库与处方触发规则（处方卡规范）
├── data-contract.json            # 数据包 JSON Schema（schemaVersion=1）
├── scripts/
│   ├── validate-package.mjs      # 校验数据包完整性（字段、类型、版本）
│   ├── report-scaffold.mjs       # 生成标准目录结构骨架（含知识库目录）
│   ├── generate-report.mjs       # 生成 ECharts 可视化诊断报告（独立 HTML，零依赖）
│   ├── build-knowledge-index.mjs # 错题沉淀为可检索知识库 + 重建索引（幂等）
│   └── build-remediation-plan.mjs # 待复查知识点 → 3 日巩固计划（写入 plans/）
├── variants/
│   ├── README.md                 # 变式题库检索说明
│   ├── index.json                # 知识点 → 题目文件索引
│   └── political-theory.json     # 政治类变式题（首批 3 题已入库）
├── examples/
│   └── sample-package.json       # 脱敏样例数据包（字段结构完整，数据为虚构）
└── README.md
```

## 核心能力：可视化带教闭环（v4）

每次处理数据包，Agent 按 SKILL.md 带用户走完一轮**可视化带教闭环**，
每个环节用图表/卡片呈现（规范见 VISUAL-PLAYBOOK.md），不输出纯文字长段落：

1. **事实层可视化首诊**：3 个关键事实卡 + 模块正确率图 + 异常清单 + 报告存档；
2. **行为模式带教**：用事件时间线先带"节奏/取舍/誊写"，再进知识点；
3. **一题一教**：知识点卡 → 错因路径图（用户先自述，教练补证据）→ 推理链对比讲解
   → 即时小测（主动回忆）→ 变式实测；
4. **补救闭环**：变式未过 → 二次讲解（换角度）+ 二次变式 → 通过=掌握，再不过=待复查；
5. **掌握判定**：状态徽章 + 进度条；待复查 → 3 日巩固计划 + 间隔复测约定；
6. **资源处方**：处方卡（资源 + 触发证据 + 使用建议 + 跟进状态）；
7. **交付台账**：每次会话的全部产出集中追加到 `beachsolo/DELIVERY-LOG.md`。

配套机制：`build-knowledge-index.mjs` 沉淀错题知识库；`variants/` 提供按知识点索引的
变式题库（Agent 优先取题，原创题回写）；`build-remediation-plan.mjs` 生成巩固计划；
`profile.json` 记录掌握/待复查知识点、行为模式画像、处方跟进与已处理会话（幂等）。

---

## 用户动线

1. 在 BeachSOLO 完成一次答题，进入「答题结果总览」页面；
2. 点击「交付给 Agent」，下载 `beachsolo-attempt-*.json` 数据包；
3. 将数据包文件发给已安装本技能的 Agent，附一句：

   > 请处理这个数据包，按技能工作流执行。

4. Agent 幂等检查后先摆客观事实，然后与你逐题带教：识别知识点 → 确认错因 →
   查证讲解 → 确认理解 → 举一反三实测 → 判定掌握并推荐练习资源，
   全部交付物记入 `beachsolo/DELIVERY-LOG.md`；
5. 下次拿到新数据包，直接再发一次，Agent 增量处理，不重复分析旧会话，
   并自动把上次「待复查」知识点纳入本次带教优先项。

---

## 数据包结构速览

数据包顶层字段（详见 `data-contract.json`）：

| 字段 | 说明 |
|------|------|
| `schemaVersion` | 当前为 `1` |
| `attemptId` | 本次答题唯一 ID（幂等键） |
| `paper` | 试卷元信息（标题、考试类型、年份、地区） |
| `snapshot` | 统计快照（逐题状态、用时、行为摘要、数据字典） |
| `questionsFull` | 每题完整内容（题干、选项、答案、解析） |
| `answersRaw` | 每题原始作答记录（首答、终答、草稿、改答次数） |
| `starterAnswers` | 开场阅卷期选择记录 |
| `behaviorEventsRaw` | 逐条原始行为事件流 |

---

## 版本与兼容

- 数据包 `schemaVersion` 与 `data-contract.json` 的 `$id` 版本对齐。
- 本仓库升级时，`SKILL.md` 的 `instructionsVersion` 会同步递增。
- Agent 在处理数据包前应先比对版本号（见 SKILL.md 步骤 0 第 3 条）。

---

## 脚本使用

### 校验数据包

```bash
node scripts/validate-package.mjs path/to/beachsolo-attempt-xxx.json
```

输出：`PASS`（通过）或逐条列出缺失/类型错误字段。

### 生成目录骨架

```bash
node scripts/report-scaffold.mjs [目标目录，默认 ./beachsolo]
```

创建 `beachsolo/` 标准目录结构（已存在则跳过，不覆盖已有文件）。

### 生成可视化诊断报告

```bash
node scripts/generate-report.mjs path/to/beachsolo-attempt-xxx.json [输出.html]
```

默认输出 `beachsolo/reports/diagnosis-<id8>-<日期>.html`，浏览器打开即可，无需本地依赖。

### 错题沉淀与知识库索引

```bash
node scripts/build-knowledge-index.mjs path/to/beachsolo-attempt-xxx.json [beachsolo目录]
```

提取本次错题写入 `beachsolo/knowledge/<模块>/`，重建 `INDEX.md`；同一数据包重复执行不会重复写入。

---

## 数据来源说明

- 数据包由 BeachSOLO（公考刷题应用）服务端打包，仅含**用户本人的答题记录**；
- 本仓库不含任何真实用户数据；`examples/sample-package.json` 为完全虚构数据；
- 数据包中的图片路径（`*ImageUrls`）为 BeachSOLO 内部存储路径，外部无法直接访问。
