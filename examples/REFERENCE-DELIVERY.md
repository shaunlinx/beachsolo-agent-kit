# 规范案例（REFERENCE DELIVERY）

> 本文件记录一次**真实完整交付**（数据包 → 九件套 → 云PPT + 云文档），作为复现基准。
> 新数据包的内容不同，但流程、结构、模板完全一致。
> v7 起主交付为带教课件云 PPT，云文档为辅交付。

## 案例一 · 2026-10-21 首诊（b1d1d07d）

**输入数据包**：`beachsolo-attempt-b1d1d07d-2026-10-21.json`
- 试卷：2025-上海-行测（用户导入，origin=user）
- meta：score 1.4/100 · correct 2 · wrong 9 · unanswered 119 · duration 597s
  · pause 1/40s · eventCount 45
- 行为信号：3 次改答后仍错 · 第 1 题草稿 A 涂卡 B · 第 10 题停驻 7.3 分钟 · 弃卷

**统计归因（步骤 1 输出）**：
- 9 道错题初步错因：memory 6（3/4/7/9/10/11）、concept 3（1/2/8）、
  叠加 careless 信号 1（第 1 题）
- 行为画像：扫答式作答（前 10 题 ~10s/题）+ 停驻不跳题 + 直接弃卷

**媒介路由（步骤 2 输出）**：
- 第 1/2 题（concept）→ 权威原文链接（人民网 / 求是网）
- 第 2 题（memory 叠加）→ 抖音讲解视频 2 条 + 口诀音频（已生成，短链已失效，
  规范要求归档 media/）
- 第 10 题（memory）→ 中国政府网《法治中国建设规划》原文 + 人大 70 周年讲话

**带教课件云 PPT（步骤 3.1 主交付，v7 形态）**：
- 设计系统：A-3 问题牵引·专业版（暖白底 #F5F0EB + 勃垦第红 + 炭黑 + 赭石，思源宋体）
- 知识库节点 URL：https://scnxn527ul86.feishu.cn/wiki/OPT5wWh5Li8zWNkhoFKcNHeinpR
- 6 页结构：封面（驱动问题）→ 一图看懂（3 数字+行为链+错因分布）→
  第1题对照（十个明确 vs 十四个坚持，compare 模板）→
  第2题对照（政治建设 vs 思想建设，compare 模板）→
  第10题记忆（立法格局四词，memory 模板）→
  小结（掌握 2/待复查 1/巩固三步）
- 模板对应：slide-01-cover / slide-02-overview / slide-03-compare ×2 /
  slide-04-memory / slide-06-summary
- 验收：6 页全部 lint passed；逐页截图无溢出/错位；每页有 note 讲稿；
  已挂入"BeachSOLO 复盘"知识库（wiki +move --obj-type slides）

**云文档（步骤 3.2 辅交付，v2 形态）**：
- 知识库空间：BeachSOLO 复盘（space_id 7699172946908040454）
- 知识库节点 URL：https://scnxn527ul86.feishu.cn/wiki/FYcJwf83nit9OSk1D3ecibMin0c
- 结构：摘要 callout → 一图看懂（widget-overview）→ 怎么答的（timeline+行为点）→
  错在哪（reasons+错题表）→ 逐题带教（bookmark 资源卡片内嵌 + 概念对照图 + checkbox
  小测/变式）→ 掌握与巩固计划（progress + checkbox 待办）→ 练习资源（bookmark 卡片）→ 更新日志
- 5 个 HTML block：overview / timeline / reasons / progress / concept（即 templates/widget-*.html）
- 资源内嵌预览：bookmark 卡片 ×8（人民网/求是网/抖音 ×2/政府网 ×2/工具箱 ×2），
  checkbox 待办 ×9（小测/变式/巩固计划 D1-D3）

**变式判定（步骤 4）**：科学体系定位 ✓ 掌握 · 立法格局 ✓ 掌握 ·
政治建设摆在首位 ✗ 待复查（pendingPoint，进入巩固计划）

**后续动作**：写入 profile.json（weakSections=政治理论、mastered 2、pending 1）；
DELIVERY-LOG.md 追加；巩固计划 plans/remediation-2026-10-21.md（D1 背诵/D2 刷题/D3 复查）。

## 复现清单（新数据包照此执行）

1. 跑 validate-package → generate-report；
2. 统计归因（错因分布 + 行为画像）→ 写成结论 JSON；
3. 媒介路由 + 并行采集（检索 + 生成，生成物立即归档 media/）；
4. 套 templates/cloud-doc.xml 与 widget-*.html → 创建云文档 → 回读验证；
5. 变式实测（文档内嵌 checkbox）→ 判定掌握/待复查 → 补救闭环；
6. `wiki +move` 把文档挂入"BeachSOLO 复盘"知识空间，交付节点 URL；
7. 更新 knowledge/ + profile.json + DELIVERY-LOG.md + 云文档更新日志；
8. 处方 → 交付知识库节点 URL + 富媒体产物。
