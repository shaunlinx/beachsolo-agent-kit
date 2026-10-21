# 规范案例（REFERENCE DELIVERY）

> 本文件记录一次**真实完整交付**（数据包 → 八件套 → 云文档），作为复现基准。
> 新数据包的内容不同，但流程、结构、模板完全一致。

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

**云文档（步骤 3 主交付）**：
- URL：https://scnxn527ul86.feishu.cn/docx/EsL1d5CNFobykSxzwxkcoQNunke
- 结构：摘要 callout → 8 章（诊断/行为/错因/逐题/进度/处方/更新日志/来源）
- 4 个 HTML block：overview / timeline / reasons / progress（即 templates/widget-*.html 的来源）

**变式判定（步骤 4）**：科学体系定位 ✓ 掌握 · 立法格局 ✓ 掌握 ·
政治建设摆在首位 ✗ 待复查（pendingPoint，进入巩固计划）

**后续动作**：写入 profile.json（weakSections=政治理论、mastered 2、pending 1）；
DELIVERY-LOG.md 追加；巩固计划 plans/remediation-2026-10-21.md（D1 背诵/D2 刷题/D3 复查）。

## 复现清单（新数据包照此执行）

1. 跑 validate-package → generate-report；
2. 统计归因（错因分布 + 行为画像）→ 写成结论 JSON；
3. 媒介路由 + 并行采集（检索 + 生成，生成物立即归档 media/）；
4. 套 templates/cloud-doc.xml 与 widget-*.html → 创建云文档 → 回读验证；
5. 变式实测（文档内嵌）→ 判定掌握/待复查 → 补救闭环；
6. 更新 knowledge/ + profile.json + DELIVERY-LOG.md + 云文档更新日志；
7. 处方 → 交付云文档 URL + 富媒体产物。
