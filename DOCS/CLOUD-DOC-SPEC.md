# 云文档带教档案规范（CLOUD-DOC-SPEC）

> 主交付物规范。创建/更新云文档前必须读本文件与 `templates/cloud-doc.xml`、
> `templates/widget-*.html`。参考真实案例：`examples/REFERENCE-DELIVERY.md`。

## 1. 载体选择

- 优先飞书云文档（lark-doc skill，+create 工作流），交付 URL，长期维护；
- 无云文档能力 → 降级本地 HTML 档案（自包含单文件，含同样结构）。

## 2. 文档结构与模板变量

标题：`BeachSOLO 带教档案 · <试卷标题>（<第N次诊断>）`

| 章节 | 内容 | 组件 |
|---|---|---|
| 摘要 | 核心问题 + 3 条结论（≤300 字） | callout（浅灰） |
| 1 本次诊断结论 | 关键事实基线 | widget-overview + 结论段 |
| 2 作答行为画像 | 时间线 + 行为点 | widget-timeline + 段 |
| 3 错因模式统计 | 分布 + 错题明细表 | widget-reasons + table |
| 4 逐题带教档案 | 每题：考点/作答/错因/讲解/媒介/小测/变式/判定 | 标题 + 段 + 链接 |
| 5 掌握与待复查 | 进度 + 巩固计划表 | widget-progress + table |
| 6 资源处方 | 按 resources.md 触发 | 列表 + 链接 |
| 7 更新日志 | 每次带教追加一行 | table |
| 8 参考来源 | 编号链接 | ol + a |

## 3. HTML block 图集（4 张，确定性绘制）

| 模板 | 回答的问题 | 数据来源 |
|---|---|---|
| widget-overview.html | 这次整体情况？ | snapshot.meta + questions 统计 |
| widget-timeline.html | 作答过程发生了什么？ | behaviorEventsRaw 时差归因 |
| widget-reasons.html | 错因集中在哪类？ | 选项差异比对统计 |
| widget-progress.html | 哪些已掌握/待复查？ | 变式判定 + 处方 |

要求：
- 纯 HTML/CSS/SVG，**无外部依赖**（不引 CDN/JS 库），离线可读；
- 主色 `#1A2B4A`（藏青），辅助 `#758092/#BABFC9/#DDE0E4`，状态色克制
  （对=绿 #1E6B46、错=红 #922B21），禁止彩虹色；
- 高度自适应（meta html-box-height-mode=auto），宽度 100%；
- 每个 block 只回答一个问题；图题点明判断；口径/来源就近标注。

## 4. 嵌入与验证

- 按 lark-doc 的 html5-block 规范写入（`<html5-block path="@./widget.html"/>`）；
- 创建后必须 `+fetch --detail full` 回读：4 个 block 均存在、链接可点、内容与相邻段落对应；
- 局部问题用 `+update` 最小修复，禁止重建文档。

## 5. 长期维护约定

- 每次新数据包：在"更新日志"追加一行 + 更新第 1/3/5 章数据，**不覆盖历史记录**；
- 待复查知识点下次自动置顶（profile.json.pendingPoints 驱动）。
