# 云文档带教档案规范（CLOUD-DOC-SPEC v2）

> 主交付物规范。创建/更新云文档前必须读本文件与 `templates/cloud-doc.xml`、
> `templates/widget-*.html`。真实案例见 `examples/REFERENCE-DELIVERY.md`。

## 0. 格式铁律（v2，用户验收标准）

1. **去啰嗦**：正文只保留结论与证据，一句一意；标题必须是判断句（如"错在哪：记忆错误占 6/9"），
   禁止"趋势总览"类抽象标题；每节正文 ≤3 行。
2. **图示化优先**：能用 HTML block / 图解表达的不写段落（诊断/行为/错因/进度=4 张固定图，
   概念混淆题=概念对照图）。
3. **资源可预览内嵌，不堆链接**：外部资源用 `<bookmark href="URL"></bookmark>` 卡片内嵌
   （视频/原文可点开预览），音频用附件卡（`<figure view-type="Card"><source/></figure>`），
   图解用 `<img href="URL"/>` 内嵌；参考来源只放正文未内嵌的兜底编号链接。
4. **卡片用卡片、待办用待办**：处方/资源用 bookmark 卡片或 callout；巩固计划用
   `<checkbox done="true|false">` 待办列表；小测/变式也用 checkbox（用户勾选即回报）。
5. **一份卷子 = 一个知识库节点**：每套卷子的复盘文档必须放进"BeachSOLO 复盘"知识空间
   （见 §6），长期累积、可检索、可对照。

## 1. 载体选择

- 优先飞书云文档（lark-doc +create），创建后挂入知识库（lark-wiki）；
- 无云文档能力 → 降级本地 HTML 档案（自包含，含同样结构与图集）。

## 2. 文档结构（templates/cloud-doc.xml）

| 章节 | 内容 | 组件 |
|---|---|---|
| 摘要 | 1 行核心 + 3 条结论（≤150 字） | callout（浅灰） |
| 1 一图看懂本次复盘 | 整体事实基线 | widget-overview + 1 句注 |
| 2 怎么答的 | 时间线 + 行为点 | widget-timeline + ul |
| 3 错在哪 | 错因分布 + 错题表 | widget-reasons + 精简 table |
| 4 逐题带教 | 每题：作答/错因/讲解/资源卡片/小测/变式/判定 | 见 §4 |
| 5 掌握情况与巩固计划 | 进度 + 待办计划 | widget-progress + checkbox |
| 6 练习资源 | 处方卡片 | bookmark/callout |
| 7 更新日志 | 每次追加一行 | table |

## 3. HTML block 图集（5 张）

| 模板 | 回答的问题 | 数据来源 |
|---|---|---|
| widget-overview.html | 这次整体情况？ | snapshot.meta + questions 统计 |
| widget-timeline.html | 作答过程发生了什么？ | behaviorEventsRaw 时差归因 |
| widget-reasons.html | 错因集中在哪类？ | 选项差异比对统计 |
| widget-progress.html | 哪些已掌握/待复查？ | 变式判定 + 处方 |
| widget-concept.html | 两个概念差在哪？（概念混淆题专用） | 知识点结构 |

要求：纯 HTML/CSS/SVG 零依赖；主色 #1A2B4A（藏青）辅助 #758092/#BABFC9/#DDE0E4，
状态色克制（对 #1E6B46 / 错 #922B21）；禁止彩虹色；高度自适应、宽度 100%。

## 4. 逐题带教段模板（每题一个 h2，替换变量）

```xml
<h2 seq="auto">{{题号}} {{判断式标题，如"政治建设≠基础性建设"}}</h2>
<p><b>你的答案</b> {{你的选项}} · <b>正确</b> {{正确选项}} · <b>错因</b> {{concept/memory/...：一句}}</p>
<p>{{讲解 1-2 句：正确项为什么对 + 你错在哪}}</p>
{{媒介（按错因路由，任选组合，全部可预览）}}
  <bookmark href="{{权威原文URL}}"></bookmark>
  <bookmark href="{{讲解视频URL}}"></bookmark>
  <img href="{{图解URL}}" width="320px"/>
<checkbox done="false">小测：{{一题一测}}</checkbox>
<checkbox done="false">变式：{{变式题简述（来源）}}</checkbox>
<p><b>判定：</b>{{已掌握 / 待复查}}</p>
```

- 媒介路由：concept→img 概念对照图（widget-concept 或生图）；memory→音频附件 + bookmark 原文；
  reasoning→PPT 附件或 bookmark；time→bookmark 视频 + bookmark 原文；
- 用户回报判定 = 勾选 checkbox（小测/变式），不做开放式对话。

## 5. 嵌入与验证

- html5-block 按 lark-doc 规范写入；创建后必须 `+fetch --detail full` 回读：
  5 个 block 存在、bookmark 卡片/图片/附件可预览、checkbox 存在；
- 局部问题用 `+update` 最小修复，禁止重建。

## 6. 知识库集成（一份卷子 = 一个节点）

1. 首次使用：`lark-cli wiki +space-list --as user` 查"BeachSOLO 复盘"空间，
   不存在则 `+space-create --name "BeachSOLO 复盘" --description "每套卷子的带教复盘档案知识库"`；
2. 每次创建复盘文档后，用 **docs-to-wiki 模式**挂入（不是 node-create，node-create 只能新建对象）：
   `lark-cli wiki +move --obj-type docx --obj-token <document_id> --target-space-id <space_id>`
   → 返回 `node_token` 即知识库节点，节点 URL 为 `https://<host>/wiki/<node_token>`；
3. 文档 URL 以知识库节点 URL 交付；下次复盘在同空间再挂新节点，形成"一套卷子一份档案"的
   长期知识库（可与历史卷子对照复发错因）。

## 7. 长期维护约定

- 每次新数据包：更新日志追加一行 + 第 1/3/5 章数据，不覆盖历史；
- 待复查知识点下次自动置顶（profile.json.pendingPoints 驱动）；
- 知识库内可跨卷检索"同知识点错题"（复发提示）。
