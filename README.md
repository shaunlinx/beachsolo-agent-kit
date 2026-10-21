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
├── SKILL.md                    # Agent 技能定义（五步工作流，唯一入口）
├── data-contract.json          # 数据包 JSON Schema（snapshot_version=1）
├── scripts/
│   ├── validate-package.mjs    # 校验数据包完整性（字段、类型、版本）
│   └── report-scaffold.mjs     # 生成标准目录结构骨架
├── examples/
│   └── sample-package.json     # 脱敏样例数据包（字段结构完整，数据为虚构）
└── README.md
```

---

## 用户动线

1. 在 BeachSOLO 完成一次答题，进入「答题结果总览」页面；
2. 点击「交付给 Agent」，下载 `beachsolo-attempt-*.json` 数据包；
3. 将数据包文件发给已安装本技能的 Agent，附一句：

   > 请处理这个数据包，按技能工作流执行。

4. Agent 自动完成幂等检查 → 首诊报告 → 专项计划 → 错题集，写入 `beachsolo/` 目录；
5. 下次拿到新数据包，直接再发一次，Agent 增量处理，不重复分析旧会话。

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

---

## 数据来源说明

- 数据包由 BeachSOLO（公考刷题应用）服务端打包，仅含**用户本人的答题记录**；
- 本仓库不含任何真实用户数据；`examples/sample-package.json` 为完全虚构数据；
- 数据包中的图片路径（`*ImageUrls`）为 BeachSOLO 内部存储路径，外部无法直接访问。
