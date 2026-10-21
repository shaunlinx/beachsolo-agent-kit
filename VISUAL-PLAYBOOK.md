# VISUAL-PLAYBOOK · 带教交互可视化规范

> 本文件是 beachsolo-coach（SKILL.md v4）的呈现配套。**每次带教会话开始前必须完整读取本文件一次**。
> 原则：带教过程禁止"一大段文字讲完就过"，每个环节用可视化呈现，文字只作图内补充。

## 0. 渲染硬约束（违反即渲染失败）

- **HTML renderer 块**：起始行逐字为 ` ```html type="renderer" `，结束行逐字为 ` ``` `，两者独占一行；块内**禁止** `<!DOCTYPE>`、`<head>`、`<body>`、`<TEXT>`。
- 首块写法：`<html style="margin:0;padding:0;">` 紧跟非空 `<title>页面标题</title>`，再写透明根 div；同一文档只写一个 title。
- 布局：根容器 `width:100%;box-sizing:border-box`，自然撑高，**禁止** `100vh`/`height:100%`；多列用 `display:flex;flex-wrap:wrap`，长文字不得溢出；正文 ≥14px。
- **ECharts**：输出完整小写 `echarts` option（含 data 真实值），不输出初始化代码/HTML 包裹。
- **静态优先**：初始画面即可读懂主结论；交互必须揭示新状态，禁止装饰动画。
- 示例数据只出现在"模板示例"中；真实输出必须填真实数据，并在图注写明数据口径。

## 1. 状态色板（全闭环统一）

| 状态 | 色值 | 用途 |
|---|---|---|
| 答对 / 已掌握 | `#2f9e6e` | correct、mastered |
| 答错 / 未掌握 | `#d64545` | wrong、pending |
| 未答 | `#9ca3af` | unanswered |
| 改对 | `#3b82f6` | changedToRight |
| 改错 / 犹豫 | `#f59e0b` | changedToWrong、hesitation |
| 中性背景 | `#f5f6f8` / `#fafbfc` / 边框 `#e5e6eb` | 卡片 |

仅用颜色区分时必须加文字/形状/图例。

---

## V-01 · 关键事实卡（步骤 1 首屏）

**用途**：3 个关键事实（得分与已答/未答、最高频模块正确率、行为异常摘要）+ 1 行总览。
**形态**：指标卡 grid。

```html type="renderer"
<html style="margin:0;padding:0;">
<title>BeachSOLO 首诊 · <试卷名></title>
<div style="width:100%;box-sizing:border-box;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#f5f6f8;padding:16px;color:#1f2329;">
  <div style="font-size:15px;font-weight:700;margin-bottom:10px;">本次首诊 · <试卷名>（attemptId: <前8位>）</div>
  <div style="display:flex;flex-wrap:wrap;gap:10px;">
    <div style="flex:1 1 150px;background:#fff;border:1px solid #e5e6eb;border-radius:8px;padding:10px 12px;">
      <div style="font-size:12px;color:#8a94a6;">得分</div>
      <div style="font-size:18px;font-weight:700;">1.4 / 100</div>
      <div style="font-size:12px;color:#d64545;">已答 11 / 130</div>
    </div>
    <div style="flex:1 1 150px;background:#fff;border:1px solid #e5e6eb;border-radius:8px;padding:10px 12px;">
      <div style="font-size:12px;color:#8a94a6;">最高频作答模块</div>
      <div style="font-size:18px;font-weight:700;">政治理论</div>
      <div style="font-size:12px;color:#d64545;">正确率 18.2%（2/11）</div>
    </div>
    <div style="flex:1 1 150px;background:#fff;border:1px solid #e5e6eb;border-radius:8px;padding:10px 12px;">
      <div style="font-size:12px;color:#8a94a6;">行为异常</div>
      <div style="font-size:18px;font-weight:700;">4 处</div>
      <div style="font-size:12px;color:#8a94a6;">改错 3 · 誊写不一致 3 · 超长 1</div>
    </div>
    <div style="flex:1 1 150px;background:#fff;border:1px solid #e5e6eb;border-radius:8px;padding:10px 12px;">
      <div style="font-size:12px;color:#8a94a6;">整卷用时</div>
      <div style="font-size:18px;font-weight:700;">10 分钟</div>
      <div style="font-size:12px;color:#d64545;">119 题未答</div>
    </div>
  </div>
  <div style="margin-top:8px;font-size:12px;color:#8a94a6;">数据口径：snapshot.meta（score/correctCount/unansweredCount/durationSeconds）与 snapshot.questions 统计。</div>
</div>
</html>
```

**真实输出**：把 `<试卷名>`、数字换成数据包实际值；未答/得分等关键异常用 `#d64545` 标注。

## V-02 · 模块正确率条形图（步骤 1）

**用途**：一眼看到哪些模块弱、哪些没做。
**形态**：ECharts bar（按已答正确率降序；未作答模块单独一行标注"未作答"）。

```js
{
  tooltip: { trigger: 'axis', formatter: p => p[0].name + '：' + p[0].value + '%（' + (p[0].data.total || '') + ' 题）' },
  grid: { left: 100, right: 40, top: 10, bottom: 30 },
  xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
  yAxis: { type: 'category', data: ['政治理论', '常识判断', '言语理解与表达', '判断推理', '数量关系', '资料分析'] },
  series: [{ type: 'bar', barMaxWidth: 22, label: { show: true, position: 'right', formatter: '{c}%' },
    data: [
      { value: 18.2, total: '已答11' },
      { value: 0, total: '未作答' },
      { value: 0, total: '未作答' },
      { value: 0, total: '未作答' },
      { value: 0, total: '未作答' },
      { value: 0, total: '未作答' }
    ],
    itemStyle: { color: p => p.value > 0 ? (p.value >= 60 ? '#2f9e6e' : '#d64545') : '#9ca3af' } }]
}
```

**真实输出**：按数据包各模块已答正确率填充；未作答模块 value=0 并灰显、标注"未作答"；口径为"已答题目中的正确率"。

## V-03 · 异常信号清单（步骤 1）

**用途**：列出每题异常 + 数据依据字段。
**形态**：Markdown 表格（标题、状态色字）+ 每条附依据（如 `draftMatchesFinal=false`）。示例：

| 题号 | 模块 | 状态 | 用时 | 命中信号（数据依据） |
|---|---|---|---|---|
| 1 | 政治理论 | 改错 | 31s | 草稿与终答不一致 `draftMatchesFinal=false`；改答 2 次 `changeCount=2` |
| 11 | 政治理论 | 答错 | 451s | 用时远超模块均值；事件流含 pause(542s)→resume(582s) |

**真实输出**：只列命中信号的行；依据引用 `snapshot.questions` / `behaviorEventsRaw` 字段名，不编造。

## V-04 · 作答过程时间线（步骤 1/2）

**用途**：还原"先做什么、卡在哪、何时交卷"，支撑行为模式带教。
**形态**：ECharts scatter（事件类型分 y 轴）+ markArea 暂停区。可直接复用 `scripts/generate-report.mjs` 生成的 `c-events` 图数据；对话内输出精简版（只保留关键事件：首答、改答、pause、submit）。

```js
{
  tooltip: { formatter: p => { const e = p.data[2]; return (e.type || '') + (e.questionId ? ' · 第' + e.no + '题' : '') + (e.value ? ' · ' + e.value : '') + ' @ ' + e.x + 's'; } },
  grid: { left: 80, right: 20, top: 20, bottom: 30 },
  xAxis: { type: 'value', name: '秒' },
  yAxis: { type: 'category', data: ['draft', 'changeDraft', 'answer', 'pause', 'submit'] },
  series: [
    { type: 'scatter', symbolSize: 8, data: [ [17,0,{type:'draft',no:1,value:'B'}], [85,1,{type:'changeDraft',no:1,value:'A'}], [90,2,{type:'answer',no:1,value:'B'}], [103,2,{type:'answer',no:10,value:'A'}], [542,3,{type:'pause'}], [582,3,{type:'resume'}], [593,2,{type:'answer',no:11,value:'C'}], [597,4,{type:'submit'}] ] },
    { type: 'scatter', data: [], markArea: { itemStyle: { color: 'rgba(214,69,69,0.12)' }, data: [[{ xAxis: 542, name: '暂停' }, { xAxis: 582 }]] } }
  ]
}
```

**真实输出**：事件从 `behaviorEventsRaw` 提取，questionId 映射为题号；暂停区用 markArea 标红。

## V-05 · 誊写失误路径图（步骤 2/3）

**用途**：把"草稿→涂卡→结果"画成路径，标出断点（草稿对、涂卡错）。
**形态**：HTML/SVG 三节点横向流。

```html type="renderer"
<html style="margin:0;padding:0;">
<title>第1题 · 作答路径还原</title>
<div style="width:100%;box-sizing:border-box;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#f5f6f8;padding:16px;color:#1f2329;">
  <div style="font-size:15px;font-weight:700;margin-bottom:12px;">第1题 · 作答路径还原（事件流依据）</div>
  <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:14px;">
    <div style="background:#fff;border:1px solid #e5e6eb;border-radius:8px;padding:8px 12px;">草稿 <b>B</b><div style="color:#8a94a6;font-size:12px;">17s draft</div></div>
    <div style="color:#9ca3af;">→</div>
    <div style="background:#fff;border:1px solid #e5e6eb;border-radius:8px;padding:8px 12px;">改草稿 <b style="color:#2f9e6e;">A ✓</b><div style="color:#8a94a6;font-size:12px;">85s changeDraft（已改对）</div></div>
    <div style="color:#9ca3af;">→</div>
    <div style="background:#fef2f2;border:2px solid #d64545;border-radius:8px;padding:8px 12px;">涂卡 <b style="color:#d64545;">B ✗</b><div style="color:#8a94a6;font-size:12px;">90s answer/fill（誊写失误）</div></div>
    <div style="color:#9ca3af;">→</div>
    <div style="background:#f0f7f4;border:1px solid #2f9e6e;border-radius:8px;padding:8px 12px;">正确 <b style="color:#2f9e6e;">A</b></div>
  </div>
  <div style="margin-top:8px;font-size:12px;color:#d64545;">断点：卷面已改到正确项 A，答题卡填了 B（draftMatchesFinal=false）→ 归因：誊写/流程失误。</div>
</div>
</html>
```

**真实输出**：节点与时间戳取自 `behaviorEventsRaw`（draft/changeDraft/answer/fill），正确项用绿、失误用红。

## V-06 · 知识点卡（步骤 3.1）

**用途**：每题开讲前给知识点定位 + 历史命中。
**形态**：HTML 信息卡。

```html type="renderer"
<html style="margin:0;padding:0;">
<title>第2题 · 知识点卡</title>
<div style="width:100%;box-sizing:border-box;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#f5f6f8;padding:16px;color:#1f2329;">
  <div style="background:#fff;border:1px solid #e5e6eb;border-radius:10px;padding:14px;">
    <div style="font-size:15px;font-weight:700;margin-bottom:8px;">第2题 · 考察知识点</div>
    <div style="font-size:14px;line-height:1.7;">
      <b>全面从严治党·作风建设</b>——党建各领域地位辨析（政治建设摆在首位）+ 组合式判断<br>
      板块：政治理论 / 党史党建
    </div>
    <div style="margin-top:10px;padding:8px 10px;background:#fff7e6;border:1px solid #f59e0b;border-radius:8px;font-size:13px;color:#8a5a00;">⚠ 历史命中：knowledge/政治理论/q002-870a483b.md 曾收录同知识点错题（2026-10-21）</div>
  </div>
</div>
</html>
```

**真实输出**：知识点判定后回写知识库 `考察知识点:` 行；历史命中用 Grep 检索 knowledge/ 后如实列出，无历史则不显示 ⚠ 行。

## V-07 · 错因路径图（步骤 3.2，先给用户看，再请自述）

**用途**：可视化作答链（首答→改答→终答 vs 正确项），标断点，引导用户自述"当时为什么这么选"。
**形态**：HTML/SVG 作答链 + 断点标签。

```html type="renderer"
<html style="margin:0;padding:0;">
<title>第2题 · 错因路径图</title>
<div style="width:100%;box-sizing:border-box;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#f5f6f8;padding:16px;color:#1f2329;">
  <div style="font-size:15px;font-weight:700;margin-bottom:12px;">第2题 · 你的作答链（行为证据）</div>
  <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:14px;">
    <div style="background:#fff;border:1px solid #e5e6eb;border-radius:8px;padding:8px 12px;">首答 C（②③）<div style="color:#8a94a6;font-size:12px;">91s fill</div></div>
    <div style="color:#9ca3af;">→</div>
    <div style="background:#fff7e6;border:1px solid #f59e0b;border-radius:8px;padding:8px 12px;">改答 A（①②）<div style="color:#8a94a6;font-size:12px;">108s changeAnswer</div></div>
    <div style="color:#9ca3af;">→</div>
    <div style="background:#fef2f2;border:2px solid #d64545;border-radius:8px;padding:8px 12px;">终答 <b style="color:#d64545;">A ✗</b><div style="color:#8a94a6;font-size:12px;">两次都保留②</div></div>
    <div style="color:#9ca3af;">→</div>
    <div style="background:#f0f7f4;border:1px solid #2f9e6e;border-radius:8px;padding:8px 12px;">正确 <b style="color:#2f9e6e;">D（①④）</b></div>
  </div>
  <div style="margin-top:8px;font-size:13px;color:#8a94a6;">断点指向：对②"思想建设放在首要位置"的判断。你当时为什么坚持②？卡在哪一步？（请先自述，我再补证据）</div>
</div>
</html>
```

**真实输出**：节点取自 `behaviorEventsRaw`/`answersRaw`；断点标签是"待确认假设"而非结论，请用户先自述。

## V-08 · 推理链对比图 + 记忆锚点卡（步骤 3.3）

**用途**：讲清①正确推理链 ②你的错误路径错在哪个环节；配一句话记忆锚点。
**形态**：HTML 左右对比 + 锚点卡。

```html type="renderer"
<html style="margin:0;padding:0;">
<title>第2题 · 推理链对比</title>
<div style="width:100%;box-sizing:border-box;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#f5f6f8;padding:16px;color:#1f2329;">
  <div style="font-size:15px;font-weight:700;margin-bottom:10px;">第2题 · 为什么 D 对、A 错</div>
  <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:14px;">
    <div style="flex:1 1 300px;background:#fff;border:1px solid #e5e6eb;border-radius:8px;padding:12px;">
      <div style="font-weight:700;color:#2f9e6e;margin-bottom:6px;">✓ 正确推理链</div>
      <div style="line-height:1.8;">纠治形式主义 → 属<b>作风建设</b> → 作风是全面从严治党的突破口 → ①对<br>纠治形式主义 → 需<b>求真务实</b> → 呼应新时代"赶考"之路 → ④对<br>②"思想建设在首位"<b>错</b>（政治建设才在首位）→ 排除含②选项</div>
    </div>
    <div style="flex:1 1 300px;background:#fff;border:1px solid #e5e6eb;border-radius:8px;padding:12px;">
      <div style="font-weight:700;color:#d64545;margin-bottom:6px;">✗ 你的错误路径</div>
      <div style="line-height:1.8;">选②（思想建设在首位）→ <b style="color:#d64545;">断点：政治建设/思想建设地位混淆</b><br>漏④ → 未识别"求真务实↔纠治形式主义"呼应<br>速解：含②的选项 A/B/C 全排除 → 直接锁定 D</div>
    </div>
  </div>
  <div style="margin-top:10px;background:#fff7e6;border:1px solid #f59e0b;border-radius:8px;padding:10px 12px;font-size:14px;">
    🧠 <b>记忆锚点</b>：政治建设 = <b>根本性</b>建设、摆<b>首位</b>；思想建设 = <b>基础性</b>建设。
  </div>
</div>
</html>
```

**真实输出**：正确链与错误路径按数据包解析 + 确认错因填充；锚点用一句话口诀/固定搭配，必须可复述。

## V-09 · 小测 / 变式题卡（步骤 3.4 / 3.5 / 4）

**用途**：即时小测与变式题的题目呈现，便于快速作答与判分。
**形态**：HTML 题干卡（选项 A-D）；来源标注必须可见（真题/改编/原创）。

```html type="renderer"
<html style="margin:0;padding:0;">
<title>变式题 2 · 检测卡</title>
<div style="width:100%;box-sizing:border-box;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#f5f6f8;padding:16px;color:#1f2329;">
  <div style="background:#fff;border:1px solid #e5e6eb;border-radius:10px;padding:14px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
      <div style="font-size:15px;font-weight:700;">变式题 2 · 党的建设布局</div>
      <div style="font-size:12px;color:#8a94a6;">来源：改编（十九大报告权威论断）</div>
    </div>
    <div style="font-size:14px;line-height:1.7;margin-bottom:10px;">下列关于新时代党的建设布局的说法，正确的是：</div>
    <div style="font-size:14px;line-height:1.9;">
      A. 党的思想建设是根本性建设<br>B. 党的政治建设摆在首位，是根本性建设<br>C. 党的组织建设是基础性建设<br>D. 党的作风建设摆在首位
    </div>
    <div style="margin-top:10px;font-size:12px;color:#8a94a6;">直接回复答案字母即可。</div>
  </div>
</div>
</html>
```

**真实输出**：题干/选项来自 variants 题库或现场命题；来源标注（真题=注明出处；改编=注明依据；原创=注明原创）不得省略。

## V-10 · 判定 / 进度 / 处方卡（步骤 4 / 5 / 7）

**用途**：掌握判定徽章、整卷带教进度条、处方卡、3 日巩固计划。
**形态**：HTML 徽章 + 进度条 + 卡片。

```html type="renderer"
<html style="margin:0;padding:0;">
<title>带教进度与判定</title>
<div style="width:100%;box-sizing:border-box;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#f5f6f8;padding:16px;color:#1f2329;">
  <div style="background:#fff;border:1px solid #e5e6eb;border-radius:10px;padding:14px;">
    <div style="font-size:15px;font-weight:700;margin-bottom:10px;">带教进度 · 组A 3/3</div>
    <div style="background:#e5e6eb;border-radius:6px;height:10px;overflow:hidden;margin-bottom:10px;"><div style="width:100%;height:100%;background:#2f9e6e;"></div></div>
    <div style="font-size:14px;line-height:2;">
      <span style="display:inline-block;background:#f0f7f4;color:#2f9e6e;border:1px solid #2f9e6e;border-radius:12px;padding:2px 10px;margin-right:6px;">已掌握</span>科学体系板块定位 · 立法工作格局<br>
      <span style="display:inline-block;background:#fef2f2;color:#d64545;border:1px solid #d64545;border-radius:12px;padding:2px 10px;margin-right:6px;">待复查</span>政治建设摆在首位（补救后再测仍错）
    </div>
    <div style="margin-top:12px;padding:10px 12px;background:#fafbfc;border:1px solid #e5e6eb;border-radius:8px;font-size:14px;">
      <b>处方 · 政治常识专项</b>（触发：政治模块错 9 题 ≥2，变式未掌握）<br>
      <a href="https://scnxn527ul86.feishu.link/app/app_17g9haefb33?from=from_copylink">打开政治常识专项工具箱</a><br>
      <span style="font-size:12px;color:#8a94a6;">建议：每日 5 题"党建布局"类，练后自查政治/思想/组织/作风/纪律建设各自身份。</span>
    </div>
  </div>
</div>
</html>
```

**真实输出**：进度百分比 = 已带教题数/带教目标数；徽章状态与 profile 一致；处方按 resources.md 触发规则 + 数据包证据。

---

## 2. 使用顺序总览（一轮完整带教的 renderer 编排）

| 环节 | 模板 | 说明 |
|---|---|---|
| 首诊 | V-01 + V-02 + V-03（+ V-04 可选） | 一屏内呈现，不分多次 |
| 行为模式带教 | V-04 + V-05（如有誊写失误） | 最多 2 轮对话 |
| 逐题·知识点 | V-06 | 每题一次 |
| 逐题·错因确认 | V-07 → 用户自述 → 补证据 | 先图后问 |
| 逐题·讲解 | V-08 | 含记忆锚点 |
| 逐题·小测 | V-09 | 1 题，答错回 V-08 |
| 变式实测 | V-09 ×2-3 | 判分用 Markdown 表 |
| 补救闭环 | V-08（换角度）+ V-09 | 未过才触发 |
| 判定/处方 | V-10 | 每题判定 + 整卷终版 |

## 3. 降级规则

- 渲染器不可用/失败 → 用结构化 Markdown（表格/列表）表达同等信息，不得留空白。
- 数据缺失（字段 null）→ 如实标注"该信号未采集"，图内该节点置灰。
- 交互模板失败 → 用对应静态模板。
