# beachsolo-agent-kit

BeachSOLO 公考刷题应用的 **Agent 教学交付工具包**（v8 · 数据驱动 → 标准化教学交付引擎）。

用户从 BeachSOLO 导出答题数据包（`beachsolo-attempt-*.json`），把本仓库作为
Agent 技能安装，Agent 即自动产出一套完整的教学交付物（**标准化九件套**）：
统计归因 → 错因→媒介路由（生图/讲解语音/视频链接/权威原文）→
**带教课件云 PPT（文档内内容形式）** → **云文档带教档案（最终沉淀载体，
内含PPT+音频+资源+变式+巩固计划）** → 知识库挂载（首次创建·永久维护）→
**多维表格巩固任务（记忆曲线提醒·集中维护）** → 交付台账。
**以交付物为中心，并行子agent提效，可复现，对话只出现在必要确认点。**

**v8 核心变化**：
- 唯一交付载体 = 云文档（知识库节点），PPT/音频/资源都是文档内内容形式
- PPT 页数动态 = N+3（N=实际复盘题数，不设上限）
- 并行工作流：媒介采集（4路）+ PPT 生成同时派子agent，云文档等PPT完成后组装
- 多维表格集中维护巩固任务（D+1/D+3/D+7 记忆曲线），不每次生成独立cron
- PPT 以 bookmark 卡片 + 关键页截图嵌入云文档，不独立挂库/不独立交付

---

## 快速安装

### Claude Code（推荐）

```
安装技能：github:shaunlinx/beachsolo-agent-kit
```

或克隆到 `~/.claude/skills/`：

```bash
git clone https://github.com/shaunlinx/beachsolo-agent-kit.git ~/.claude/skills/beachsolo-agent-kit
```

### 其他 Agent 平台

将本仓库 `SKILL.md` 作为技能文件/系统提示词提供给 Agent，并确认 Agent 具备
文件读写、联网检索、生图/音频/云文档等工具（缺失时按 SKILL.md 附 C 降级链处理）。

---

## 仓库结构（v6）

```
beachsolo-agent-kit/
├── SKILL.md                      # 主技能（v6 artifact-first 教学交付引擎，唯一入口）
├── DOCS/
│   ├── DELIVERY-MANIFEST.md      # 八件套交付物清单与验收标准
│   ├── CLOUD-DOC-SPEC.md         # 云文档带教档案规范（结构/模板/验证）
│   └── TOOL-CONTRACTS.md         # 工具契约（生成物归档硬规则/并行/降级）
├── templates/
│   ├── cloud-doc.xml             # 云文档 XML 模板（变量占位）
│   ├── widget-overview.html      # HTML block 图集 ×4（确定性绘制，零依赖）
│   ├── widget-timeline.html
│   ├── widget-reasons.html
│   └── widget-progress.html
├── VISUAL-PLAYBOOK.md            # 可视化规范（图表/路径图）
├── MEDIA-PLAYBOOK.md             # 多模态教学规范（错因→媒介路由）
├── resources.md                  # 专项练习资源库与处方触发规则
├── data-contract.json            # 数据包 JSON Schema（schemaVersion=1）
├── scripts/
│   ├── validate-package.mjs      # 校验数据包完整性（字段、类型、版本）
│   ├── report-scaffold.mjs       # 生成标准目录结构骨架
│   ├── generate-report.mjs       # 生成 ECharts 可视化诊断报告（独立 HTML）
│   ├── build-knowledge-index.mjs # 错题沉淀为可检索知识库 + 重建索引（幂等）
│   └── build-remediation-plan.mjs # 待复查知识点 → 3 日巩固计划
├── variants/                     # 变式题库（按知识点索引）
├── examples/
│   ├── sample-package.json       # 脱敏样例数据包（字段结构完整，数据虚构）
│   └── REFERENCE-DELIVERY.md     # ★ 规范案例：真实交付全流程与云文档 URL
└── README.md
```

## 核心流程（v6 · artifact-first）

1. **步骤 0 幂等**：校验数据包（validate-package）→ 查 profile 去重 → 检索历史知识库；
2. **步骤 1 统计归因**：generate-report → 选项错误模式（concept/memory/reasoning/careless）
   + 行为统计（改答率/誊写不一致/用时分布）→ 错因模式画像；
3. **步骤 2 媒介路由与采集（并行）**：按错因路由（concept→生图 / memory→音频+原文 /
   reasoning→PPT / time→视频检索），生成物立即归档 `media/`；
4. **步骤 3 云文档成稿 + 知识库挂载**：套 `templates/cloud-doc.xml` + 5 个 HTML block 图集
   （总览/时间线/错因/进度/概念对照）→ 创建飞书云文档（lark-doc）→ 回读验证 →
   `wiki +move` 挂入"BeachSOLO 复盘"知识空间（一份卷子 = 一个节点）→ 交付节点 URL；
   **格式铁律**：资源用 bookmark 卡片内嵌预览（视频/原文可点开）、计划与小测用 checkbox
   待办、图示化优先、正文去啰嗦；
5. **步骤 4 变式实测**：文档内嵌小测+变式 → 用户回报对/错 → 掌握判定 / 补救闭环；
6. **步骤 5 台账与画像**：DELIVERY-LOG.md 追加 + profile.json 增量 + 云文档更新日志；
7. **步骤 6 处方**：按 resources.md 触发，绑定证据。

> 与传统"对话式教学 Agent"的区别：交付物（云文档+富媒体）是结果，对话只是确认点；
> 同一数据包任何人、任何具备基本工具的 Agent 都能复现同一套交付。

## 用户动线

1. BeachSOLO 完成一次答题 → 「交付给 Agent」下载 `beachsolo-attempt-*.json`；
2. 把数据包发给已安装本技能的 Agent，附一句"请处理这个数据包，按技能工作流执行"；
3. Agent 自动产出：云文档带教档案 URL + 富媒体产物 + 处方，并记入交付台账；
4. 下次新数据包直接再发，Agent 增量处理：待复查自动置顶、同知识点媒介自动复用。

## 规范案例（可复现基准）

见 `examples/REFERENCE-DELIVERY.md`：一次真实交付的完整流程
（数据包 b1d1d07d → 统计归因 → 媒介路由 → 云文档），
含最终云文档 URL 与复现清单。

---

## 数据包结构速览

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

## 版本与兼容

- 数据包 `schemaVersion` 与 `data-contract.json` 的 `$id` 版本对齐。
- 本仓库升级时 `SKILL.md` 的 `version` 递增（当前 v6）。
- Agent 处理数据包前先比对版本号（SKILL.md 步骤 0）。

## 脚本使用

```bash
node scripts/validate-package.mjs path/to/beachsolo-attempt-xxx.json   # 校验
node scripts/report-scaffold.mjs [目标目录]                             # 目录骨架
node scripts/generate-report.mjs path/to/xxx.json [输出.html]           # 诊断报告
node scripts/build-knowledge-index.mjs path/to/xxx.json [beachsolo目录] # 知识库
```

## 数据来源说明

- 数据包由 BeachSOLO 服务端打包，仅含**用户本人**答题记录；
- 本仓库不含真实用户数据；`examples/sample-package.json` 为完全虚构数据；
- 数据包内图片路径（`*ImageUrls`）为 BeachSOLO 内部存储，外部不可直接访问。
