# SLIDES-WORKFLOW · 带教课件云 PPT 工作流契约（v7）

> 本文档定义：Agent 拿到数据包后，如何**标准化地**产出一份带教课件云 PPT。
> 目标：任何具备 lark-cli 能力的 Agent，按本文档执行，都能复现同形态、同质量的 PPT。
> 模板在 `templates/slides/`，共 6 个页型。

---

## 0. 设计系统（固定，不允许自行更换）

| 维度 | 固定值 |
|---|---|
| 场景 | ppt skill → 教育培训 → **A-3 问题牵引·专业版** |
| 底色 | 暖白 `rgb(245,240,235)` |
| 主色（强调） | 勃垦第红 `rgba(139,38,53,1)` |
| 正文色 | 炭黑 `rgba(43,47,54,1)` |
| 辅助色（线/注释） | 赭石 `rgba(160,137,104,1)` |
| 字体 | 思源宋体（标题/正文统一） |
| 画布 | 960×540（固定） |
| 正文字号 | ≥15px（标题 28-46px，注释 12-14px） |

**为什么固定**：公考/政治理论场景的正式感与质感来自这套配色；换配色会破坏"一份卷子一个节点"的知识库视觉一致性。

---

## 1. 页型路由（错因 → 模板）

| 错因类型 | 模板 | 每页讲几道题 |
|---|---|---|
| （封面） | `slide-01-cover.xml` | — |
| （统计归因） | `slide-02-overview.xml` | — |
| concept 概念混淆 | `slide-03-compare.xml` | 1 题/页 |
| memory 记忆/固定搭配 | `slide-04-memory.xml` | 1 题/页 |
| reasoning 推理遗漏 | `slide-05-reasoning.xml` | 1 题/页 |
| careless 粗心誊写 | 不单独占页，写入对应题的 `your_answer` 字段 | — |
| （小结） | `slide-06-summary.xml` | — |

**页数规则**：封面 1 + 总览 1 + 错题讲解（每题 1 页，按错因选模板）+ 小结 1。
- 最少 4 页（1 道错题）；错题超过 6 道时，只讲**错因最集中的前 6 道**，其余写入云文档辅交付。
- 同错因题连续排列，concept → memory → reasoning 顺序。

---

## 2. 完整工作流（7 步，必须按序）

### Step 1 · 读 ppt skill 主文档
```
Read /home/user/.doubao/agent_mode/workspace/.skills/ppt/SKILL.md
```
**必须读**，不能凭记忆调用 lark-cli slides 命令。读完后确认 `+create` / `+add-slide` / `+xml-get` / `+screenshot` / `+delete-slide` 的参数格式。

### Step 2 · 创建空白幻灯片
```bash
lark-cli slides +create --title "<试卷标题> · 复盘" --format json
```
从返回中记下 `xml_presentation_id` 和 `url`。
**立即用 present_files 发开工通知**（把 url 发给用户，说明"PPT 制作中"）。

### Step 3 · 逐页填充模板并写入
对每一页：
1. 从 `templates/slides/` 复制对应模板到工作目录；
2. 替换全部 `{{占位符}}`（见 §3 占位符规则）；
3. 写入幻灯片：
```bash
lark-cli slides +add-slide \
  --presentation "<xml_presentation_id>" \
  --slide @<模板文件>.xml --format json
```
4. **必须开启 lint**（默认即开启，禁止 `--no-lint`）；
5. 检查返回：`ok:true` 且无 `data.issues` → 继续下一页；
   报错 → 读 `error.message` 里的 lint 报告，修复后**同页重试**，不跳过。

**页序由写入先后决定**，必须按 封面→总览→错题（concept→memory→reasoning）→小结 顺序写入。
写错位置用 `+delete-slide` 删旧页 + 重新 `+add-slide`，不要用 `--before-slide-id` 硬插（容易乱序）。

### Step 4 · 回读全文校验
```bash
lark-cli slides +xml-get --presentation "<id>" --output deck.xml --json
```
检查：
- 页数 = 预期页数；
- 每页 `status: passed`，无 `errors`；
- 页序正确（用 `xml_inspect.py --mode summary` 核对 `text_preview`）。

### Step 5 · 逐页截图视觉验收
```bash
lark-cli slides +screenshot --presentation "<id>" \
  --slide-id <id1> --slide-id <id2> ... --output-dir shots/
```
逐张 Read 截图，检查：
- 无文字溢出（文本框被撑破）；
- 无元素错位（竖线/分隔线对齐）；
- 配色一致（暖白底+勃垦第红+炭黑）；
- 无空白页或半空白页。
发现问题 → `+update-slide` 或 `+delete-slide`+重写 → 重新截图。

### Step 6 · 挂入知识库
```bash
# 查"BeachSOLO 复盘"空间，不存在则创建
lark-cli wiki +space-list --as user --format json
lark-cli wiki +space-create --name "BeachSOLO 复盘" --as user   # 仅当不存在
# 挂载（slides 类型）
lark-cli wiki +move --obj-type slides --obj-token "<xml_presentation_id>" \
  --target-space-id "<space_id>" --format json
```
返回 `node_token` 即成功。知识库节点 URL = `https://<域名>/wiki/<node_token>`。

### Step 7 · 交付
用 `present_files` 交付**知识库节点 URL**（不是 slides 原始 URL），附 1-2 句说明（页数、核心结论）。

---

## 3. 占位符填充规则

| 占位符 | 填充来源 | 示例 |
|---|---|---|
| `{{paper_title}}` | 数据包 `snapshot.paper.title` | `2025-上海-行测` |
| `{{driving_question}}` | Agent 根据统计归因生成的 1 句问句 | `这次只答了 11 题——是没掌握，还是策略崩了？` |
| `{{meta_line}}` | 带教范围 + 掌握/待复查 + 日期 | `组A三题带教 · 2 掌握 / 1 待复查 · 2026-10-21` |
| `{{score}}` / `{{score_label}}` | `snapshot.score` / 自定义 | `1.4` / `得分 / 100` |
| `{{answered}}` / `{{answered_label}}` | 已答题数 / 总题数 | `11` / `已答 / 130（119 未答）` |
| `{{accuracy}}` / `{{accuracy_label}}` | 模块正确率 | `18.2%` / `政治理论正确率（2/11）` |
| `{{behavior_chain}}` | 行为事件流归因 | `扫答（10s/题）→ 停驻（7.3min 不跳题）→ 弃卷（119题）` |
| `{{reason_dist}}` | 错因统计 | `记忆错误 6 题 · 概念混淆 3 题 · 叠加誊写 1 题` |
| `{{q_nav}}` | 题号+组号 | `复盘 03/06 · 组A 01` |
| `{{title}}` | 判断句（不是板块名） | `十个明确≠十四个坚持：一个管"是什么"，一个管"怎么做"` |
| `{{left_name}}` / `{{left_desc}}` | 左概念名 + 1-2 句定位描述 | `十个明确` / `理论主体内容、四梁八柱；回答"是什么"` |
| `{{right_name}}` / `{{right_desc}}` | 右概念名 + 定位描述 | `十四个坚持` / `基本方略；回答"怎么做"` |
| `{{your_answer}}` | 你的选项 + 正确选项 | `你的作答：B（草稿曾改A，涂卡为B）· 正确：A` |
| `{{pitfall}}` | 易混点（1 句） | `把"十四个坚持"当成了理论主体内容` |
| `{{anchor}}` | 记忆锚点（口诀，≤30 字） | `十个明确管"是什么"，十四个坚持管"怎么做"` |
| `{{term_1..4}}` / `{{term_1_desc..4}}` | memory 题的固定搭配词 + 角色说明 | `党委领导` / `把握立法方向` |
| `{{step_1..3}}` / `{{step_1_desc..3}}` | reasoning 题的推理步骤 | `定位考点` / `题干问"根本"→ 政治建设` |
| `{{mastered_list}}` | 已掌握知识点（多行 `<p>· ...</p>`） | `<p>· 十个明确定位</p><p>· 立法格局</p>` |
| `{{pending_list}}` | 待复查知识点（多行 `<p>`） | `<p>· 政治建设地位（变式再错）</p>` |
| `{{actions}}` | 巩固三步（1 行或多行 `<p>`） | `<p>D1 默写口诀 · D2 重做变式 3 题 · D3 模块限时 10 题</p>` |
| `{{source}}` | 权威原文出处（含 `<a href>`） | `法治中国建设规划 · <a href="...">gov.cn 原文</a>` |

**填充纪律**：
- 所有数字必须来自数据包或可复现计算，禁止编造；
- `{{title}}` 必须是判断句或问句，禁止"XX 概述""XX 介绍"；
- `{{anchor}}` 必须是可复述的口诀，不是"注意区分"这类空话；
- 占位符全部替换后，XML 中不应残留 `{{`。

---

## 4. 硬规则（违反 = 交付不合格）

1. **禁止 emoji**（任何位置，包括 note）——语义图标用 IconPark，本套模板不用图标；
2. **禁止 `<b>` 标签**——加粗用 `<span bold="true">` 或 `<content bold="true">`；
3. **逐页 lint，禁止 `--no-lint`**——lint 报错必须修复，不能跳过；
4. **文本框高度留够**——正文 16px 单行约 24px，2 行留 50px，3 行留 75px；lint 报 `text_may_overflow_shape` 必须加高或减字；
5. **每页必须有 `<note>`**（3-5 句讲稿，用户可直接照读）；
6. **禁止 http 外链图**——需要图片先 `curl -L` 下载到本地，再 `+media-upload` 拿 `file_token`；本套模板默认无图，需要插图时遵守此规则；
7. **页序固定**——封面→总览→错题→小结，不允许乱序；
8. **必须挂知识库**——不挂知识库的 PPT 不算完成交付；
9. **必须截图验收**——不截图 = 没验证视觉，禁止直接交付。

---

## 5. 降级链

| 故障 | 降级方案 |
|---|---|
| lark-cli slides 不可用 | 主交付降级为云文档（v6.1 形态），在文档开头说明"PPT 生成失败，以文档代替" |
| 单页 lint 反复报错（≥3 次） | 该页改用最简版式（标题+正文+锚点，去掉对照/四词布局），仍须 lint 通过 |
| 知识库挂载失败 | 交付 slides 原始 URL，并在台账记录"未挂库，待重试" |
| 截图工具不可用 | 用 `+xml-get` 回读 + `xml_inspect.py` 结构校验代替，交付时说明"未做视觉截图验收" |

任何降级必须在交付说明中明确告知用户，不允许静默降级。

---

## 6. 验收清单（交付前逐项打勾）

- [ ] 页数 = 封面 1 + 总览 1 + 错题 N + 小结 1（N≤6）
- [ ] 每页 lint 通过（`status: passed`）
- [ ] 回读 XML 页序正确
- [ ] 逐页截图无溢出/错位/空白
- [ ] 每页有 `<note>` 讲稿
- [ ] 配色统一（暖白+勃垦第红+炭黑+赭石）
- [ ] 无 emoji、无 `<b>` 标签
- [ ] 所有数字来自数据包
- [ ] 已挂入"BeachSOLO 复盘"知识库
- [ ] present_files 交付知识库节点 URL
- [ ] 台账已追加（`beachsolo/DELIVERY-LOG.md`）
