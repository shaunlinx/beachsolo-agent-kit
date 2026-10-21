# VISUAL-PLAYBOOK v2 · 带教交互可视化规范

> beachsolo-coach（SKILL.md v4）的呈现配套。**每次带教会话开始前必须完整读取本文件一次**。
>
> v2 核心升级：从"多张孤立卡片堆叠"升级为**一题一图 · 三幕叙事 · 可降级交互**。
> 阅读体验对标"教练门诊单"：一屏读完全题带教，图随对话节奏逐步展开，禁止一次堆多卡。

## 0. 设计哲学（先读这段，模板只是落点）

1. **一题一图**：每题的证据、轨迹、断点、推理、锚点整合在**一张纵向信息图**里，
   用 ①②③ 编号 + 分区引导阅读顺序；而不是 4 张并列的小卡（并列小卡=贴片感，生硬）。
2. **三幕节奏**：带教按对话流分三幕，每幕只出现一张图：
   - 第一幕·还原：出示"你的作答轨迹 + 时间戳"，断点**留白不揭** → 请用户自述错因；
   - 第二幕·揭秘：用户自述后，揭示"断点标注 + 正确链 vs 错误路径 + 记忆锚点"；
   - 第三幕·检验：小测/变式题卡，判分反馈。
3. **渐进揭示**：结论不提前给。先让用户看证据、开口说，再揭答案——这是教学不是展示。
4. **交互增强、静态可读**：点击节点/断点展开详情、时间线步进回放、hover 高亮都是**增强**；
   无 JS / 渲染器降级时，静态图本身必须完整可读（信息不全靠交互）。
5. **排版质量**：统一色板、图标语义、字号层级、留白节奏、细边框+轻阴影；拒绝粗制 div 卡片。

## 1. 渲染硬约束（违反即渲染失败）

- **HTML renderer 块**：起始行逐字 ` ```html type="renderer" `，结束行逐字 ` ``` `，各独占一行；块内**禁止** `<!DOCTYPE>`/`<head>`/`<body>`/`<TEXT>`。
- 首块写法：`<html style="margin:0;padding:0;">` 紧跟非空 `<title>页面标题</title>`，再写透明根 div；同一文档只写一个 title。
- 布局：根容器 `width:100%;box-sizing:border-box`，自然撑高，**禁止** `100vh`/`height:100%`；多列 `display:flex;flex-wrap:wrap`，长文字不溢出；正文 ≥14px，行高 1.6-1.8。
- **ECharts**：输出完整小写 `echarts option`（真实数据），不输出初始化代码/HTML 包裹。
- **交互脚本**：IIFE + try/catch + DOM 判空；控件 ≥44×44px 且支持 click/tap；动画可暂停/可重置；JS 失败时保留静态主结构 + 文字说明。
- 示例数据只出现在模板示例中；真实输出必须填真实数据并写数据口径。

## 2. 视觉语言（全闭环统一）

### 2.1 状态色板

| 状态 | 色值 | 图标 | 用途 |
|---|---|---|---|
| 答对/已掌握 | `#2f9e6e` | ✓ | correct、mastered |
| 答错/未掌握 | `#d64545` | ✗ | wrong、pending |
| 未答 | `#9ca3af` | – | unanswered |
| 改对 | `#3b82f6` | ↻ | changedToRight |
| 改错/犹豫 | `#f59e0b` | ⚠ | changedToWrong、hesitation |
| 断点（错因定位） | `#d64545` 虚线框 + ⚡ | 红色虚线 2px | 轨迹图中标错因环节 |
| 中性 | `#f5f6f8` 背景 / `#fafbfc` 内卡 / 边框 `#e5e6eb` | | 容器 |
| 记忆锚点 | `#fff7e6` 底 + `#f59e0b` 边 | 🧠 | 一句话口诀 |

仅用颜色区分时必须加文字/图标/形状。

### 2.2 版式节奏

- **纵向信息图**：顶部标题行（题号+知识点+状态徽章）→ 分区（①②③）→ 图脚（数据口径/来源）。
- **编号引导**：每个分区用"① 你的轨迹"式的小标签，明确阅读顺序。
- **间距**：分区间距 12-16px，区内行距 1.7；标题 15-16px 粗，正文 14px，辅助 12px `#8a94a6`。
- **组件**：节点用圆角 8-10px 容器 + 1px 边框；徽章用圆角胶囊；连线用 `→`/SVG 箭头，标时间戳（如 `91s fill`）。

---

## V-01 · 首诊总览（步骤 1，一图替代四卡）

**用途**：得分/已答/模块/行为异常/用时，一屏看完。
**形态**：纵向信息图（顶部指标行 + 模块正确率迷你条 + 行为异常摘要）。

```html type="renderer"
<html style="margin:0;padding:0;">
<title>BeachSOLO 首诊 · 2025-上海-行测</title>
<div style="width:100%;box-sizing:border-box;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#f5f6f8;padding:16px;color:#1f2329;">
  <div style="background:#fff;border:1px solid #e5e6eb;border-radius:12px;padding:16px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
      <div style="font-size:16px;font-weight:700;">首诊 · 2025-上海-行测</div>
      <div style="font-size:12px;color:#8a94a6;">attemptId: b1d1d07d</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:14px;margin-bottom:12px;">
      <div style="flex:1 1 130px;background:#fafbfc;border:1px solid #e5e6eb;border-radius:8px;padding:10px;"><div style="font-size:12px;color:#8a94a6;">得分</div><div style="font-size:20px;font-weight:700;color:#d64545;">1.4<span style="font-size:12px;font-weight:400;color:#8a94a6;"> / 100</span></div><div style="font-size:12px;color:#d64545;">已答 11 / 130</div></div>
      <div style="flex:1 1 130px;background:#fafbfc;border:1px solid #e5e6eb;border-radius:8px;padding:10px;"><div style="font-size:12px;color:#8a94a6;">最高频模块</div><div style="font-size:20px;font-weight:700;">政治理论</div><div style="font-size:12px;color:#d64545;">正确率 18.2%</div></div>
      <div style="flex:1 1 130px;background:#fafbfc;border:1px solid #e5e6eb;border-radius:8px;padding:10px;"><div style="font-size:12px;color:#8a94a6;">整卷用时</div><div style="font-size:20px;font-weight:700;">10 分钟</div><div style="font-size:12px;color:#8a94a6;">暂停 40s</div></div>
      <div style="flex:1 1 130px;background:#fafbfc;border:1px solid #e5e6eb;border-radius:8px;padding:10px;"><div style="font-size:12px;color:#8a94a6;">行为异常</div><div style="font-size:20px;font-weight:700;color:#f59e0b;">4 处</div><div style="font-size:12px;color:#8a94a6;">改错3 · 誊写3 · 超长1</div></div>
    </div>
    <div style="font-size:13px;font-weight:700;color:#646a73;margin-bottom:6px;">模块正确率（已答）</div>
    <div style="display:flex;flex-direction:column;gap:5px;font-size:13px;">
      <div style="display:flex;align-items:center;gap:8px;"><span style="width:110px;flex:none;">政治理论</span><div style="flex:1;background:#e5e6eb;border-radius:4px;height:10px;overflow:hidden;"><div style="width:18%;height:100%;background:#d64545;"></div></div><span style="flex:none;color:#d64545;font-weight:700;">18.2%</span></div>
      <div style="display:flex;align-items:center;gap:8px;"><span style="width:110px;flex:none;">其余 5 模块</span><div style="flex:1;background:#e5e6eb;border-radius:4px;height:10px;overflow:hidden;"><div style="width:0%;height:100%;background:#9ca3af;"></div></div><span style="flex:none;color:#9ca3af;">未作答</span></div>
    </div>
    <div style="margin-top:10px;padding:8px 10px;background:#fef2f2;border:1px solid #d64545;border-radius:8px;font-size:13px;color:#b03a3a;">关键事实：本次仅作答前 11 题即交卷（<b>119 题未答</b>），全部集中在政治理论；3 题改答后错且草稿与终答不一致。</div>
  </div>
  <div style="margin-top:8px;font-size:12px;color:#8a94a6;">数据口径：snapshot.meta + snapshot.questions 统计；异常条目标注见下文 V-03。</div>
</div>
</html>
```

**真实输出**：数字换成数据包实际值；未答模块灰显；关键事实行只写最反常的 1-2 条。

## V-03 · 异常信号清单（步骤 1）

**用途**：逐题异常 + 数据依据字段。
**形态**：Markdown 表格（比图更利于逐行核对），状态字色 + 依据字段。示例：

| 题号 | 状态 | 用时 | 命中信号（数据依据） |
|---|---|---|---|
| 1 | 改错 | 31s | 草稿与终答不一致 `draftMatchesFinal=false`；改答 2 次 `changeCount=2` |
| 11 | 答错 | 451s | 用时远超模块均值；事件流 pause(542s)→resume(582s) |

## V-04 · 作答过程回放（步骤 1/2，交互增强版）

**用途**：像回放录像一样看用户"先做什么、卡在哪、何时交卷"。
**形态**：ECharts scatter + markArea；**增强**：tooltip 显示事件详情 + 点击节点可高亮对应题（JS 增强，失败则静态 scatter 仍完整）。模板直接复用 `scripts/generate-report.mjs` 的 `c-events` 数据源，对话内输出精简版（首答/改答/暂停/交卷）。

```js
{
  tooltip: { formatter: p => { const e = p.data[2]; return (e.type||'') + (e.questionId ? ' · 第' + e.no + '题' : '') + (e.value ? ' · ' + e.value : '') + ' @ ' + e.x + 's'; } },
  grid: { left: 80, right: 20, top: 20, bottom: 30 },
  xAxis: { type: 'value', name: '秒' },
  yAxis: { type: 'category', data: ['draft', 'changeDraft', 'answer', 'pause', 'submit'] },
  series: [
    { type: 'scatter', symbolSize: 8, data: [ [17,0,{type:'draft',no:1,value:'B'}], [85,1,{type:'changeDraft',no:1,value:'A'}], [90,2,{type:'answer',no:1,value:'B'}], [103,2,{type:'answer',no:10,value:'A'}], [542,3,{type:'pause'}], [582,3,{type:'resume'}], [593,2,{type:'answer',no:11,value:'C'}], [597,4,{type:'submit'}] ] },
    { type: 'scatter', data: [], markArea: { itemStyle: { color: 'rgba(214,69,69,0.12)' }, data: [[{ xAxis: 542, name: '暂停' }, { xAxis: 582 }]] } }
  ]
}
```

## V-05 · 誊写失误路径图（步骤 2/3）

**用途**：把"草稿→涂卡→结果"画成路径，标出断点。
**形态**：HTML/SVG 横向流（节点带时间戳），断点红色虚线框。

```html type="renderer">
<html style="margin:0;padding:0;">
<title>第1题 · 作答路径还原</title>
<div style="width:100%;box-sizing:border-box;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#f5f6f8;padding:16px;color:#1f2329;">
  <div style="background:#fff;border:1px solid #e5e6eb;border-radius:12px;padding:16px;">
    <div style="font-size:15px;font-weight:700;margin-bottom:12px;">第1题 · 作答路径还原 <span style="font-size:12px;font-weight:400;color:#8a94a6;">（behaviorEventsRaw 依据）</span></div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:14px;">
      <div style="background:#fafbfc;border:1px solid #e5e6eb;border-radius:8px;padding:8px 12px;">草稿 <b>B</b><div style="color:#8a94a6;font-size:12px;">17s draft</div></div>
      <div style="color:#9ca3af;">→</div>
      <div style="background:#f0f7f4;border:1px solid #2f9e6e;border-radius:8px;padding:8px 12px;">改草稿 <b style="color:#2f9e6e;">A ✓</b><div style="color:#8a94a6;font-size:12px;">85s changeDraft</div></div>
      <div style="color:#9ca3af;">→</div>
      <div style="background:#fef2f2;border:2px dashed #d64545;border-radius:8px;padding:8px 12px;">涂卡 <b style="color:#d64545;">B ✗</b> ⚡<div style="color:#8a94a6;font-size:12px;">90s answer/fill</div></div>
      <div style="color:#9ca3af;">→</div>
      <div style="background:#f0f7f4;border:1px solid #2f9e6e;border-radius:8px;padding:8px 12px;">正确 <b style="color:#2f9e6e;">A</b></div>
    </div>
    <div style="margin-top:10px;font-size:13px;color:#d64545;">⚡ 断点：卷面已改到正确项 A，答题卡填了 B（draftMatchesFinal=false）→ 归因候选：誊写/流程失误。</div>
  </div>
</div>
</html>
```

## V-07 · 错因路径图（第一幕·还原，请用户自述前出示）

**用途**：可视化作答链（首答→改答→终答 vs 正确项），**断点先留白不揭**，引导用户自述。
**形态**：纵向信息图。作答链横向、时间戳在下；断点区显示"⚡ 待定位"（虚线框+问号），不写结论。

```html type="renderer">
<html style="margin:0;padding:0;">
<title>第2题 · 第一幕：你的作答轨迹</title>
<div style="width:100%;box-sizing:border-box;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#f5f6f8;padding:16px;color:#1f2329;">
  <div style="background:#fff;border:1px solid #e5e6eb;border-radius:12px;padding:16px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
      <div style="font-size:16px;font-weight:700;">第2题 · 你的作答轨迹</div>
      <span style="background:#fef2f2;color:#d64545;border:1px solid #d64545;border-radius:12px;padding:2px 10px;font-size:12px;">改答后错</span>
    </div>
    <div style="font-size:13px;color:#646a73;margin-bottom:12px;">纠治形式主义主要彰显了中国共产党：①作风建设… ②思想建设在首位… ③基层组织建设… ④求真务实走好赶考之路</div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:14px;">
      <div style="background:#fafbfc;border:1px solid #e5e6eb;border-radius:8px;padding:8px 12px;">首答 C（②③）<div style="color:#8a94a6;font-size:12px;">91s fill</div></div>
      <div style="color:#9ca3af;">→</div>
      <div style="background:#fff7e6;border:1px solid #f59e0b;border-radius:8px;padding:8px 12px;">改答 A（①②）<div style="color:#8a94a6;font-size:12px;">108s changeAnswer</div></div>
      <div style="color:#9ca3af;">→</div>
      <div style="background:#fef2f2;border:2px solid #d64545;border-radius:8px;padding:8px 12px;">终答 <b style="color:#d64545;">A ✗</b></div>
      <div style="color:#9ca3af;">→</div>
      <div style="background:#f0f7f4;border:1px solid #2f9e6e;border-radius:8px;padding:8px 12px;">正确 <b style="color:#2f9e6e;">D（①④）</b></div>
    </div>
    <div style="margin-top:12px;padding:10px 12px;background:#fafbfc;border:2px dashed #e5e6eb;border-radius:8px;font-size:14px;color:#8a94a6;">⚡ <b>断点待定位</b>：两次作答都保留了 ②，错因可能藏在这里。你当时为什么坚持②？卡在哪一步？（先自述，我再揭）</div>
  </div>
  <div style="margin-top:8px;font-size:12px;color:#8a94a6;">数据依据：behaviorEventsRaw（fill/changeAnswer）与 answersRaw（firstAnswer/finalAnswer）。</div>
</div>
</html>
```

**真实输出**：题干压缩为要点行（不贴全文）；断点区只给"指向"不给结论；用户自述后才进 V-08 揭晓。

## V-08 · 揭秘：断点定位 + 推理链对比 + 记忆锚点（第二幕）

**用途**：用户自述后，一张图讲完"断点在哪、为什么对、为什么错、怎么记"。
**形态**：纵向信息图三段式：①⚡断点定位 ②正确链 vs 错误路径（左右对比） ③🧠锚点卡。

```html type="renderer">
<html style="margin:0;padding:0;">
<title>第2题 · 第二幕：揭秘</title>
<div style="width:100%;box-sizing:border-box;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#f5f6f8;padding:16px;color:#1f2329;">
  <div style="background:#fff;border:1px solid #e5e6eb;border-radius:12px;padding:16px;">
    <div style="font-size:16px;font-weight:700;margin-bottom:12px;">第2题 · 揭秘 <span style="font-size:12px;font-weight:400;color:#8a94a6;">为什么 D 对、A 错</span></div>
    <div style="padding:10px 12px;background:#fef2f2;border:2px dashed #d64545;border-radius:8px;font-size:14px;margin-bottom:12px;">① ⚡ <b>断点定位</b>：②"思想建设放在首位"——政治建设/思想建设<b>地位混淆</b>（你的核心盲区）；同时漏看④"求真务实↔纠治形式主义"的呼应。</div>
    <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:14px;margin-bottom:12px;">
      <div style="flex:1 1 290px;background:#f0f7f4;border:1px solid #2f9e6e;border-radius:8px;padding:12px;">
        <div style="font-weight:700;color:#2f9e6e;margin-bottom:6px;">✓ 正确推理链</div>
        <div style="line-height:1.8;">纠治形式主义 → 属<b>作风建设</b> → 全面从严治党突破口 → ①对<br>纠治形式主义 → 需<b>求真务实</b> → 呼应"赶考" → ④对<br>②错（政治建设才在首位）→ 排除含②项 → 锁定 D</div>
      </div>
      <div style="flex:1 1 290px;background:#fafbfc;border:1px solid #e5e6eb;border-radius:8px;padding:12px;">
        <div style="font-weight:700;color:#d64545;margin-bottom:6px;">✗ 你的错误路径</div>
        <div style="line-height:1.8;">保留② → <b>地位混淆</b>（断点）<br>漏④ → 未识别呼应<br>速解：含②的 A/B/C 全排除</div>
      </div>
    </div>
    <div style="padding:10px 12px;background:#fff7e6;border:1px solid #f59e0b;border-radius:8px;font-size:14px;">🧠 <b>记忆锚点</b>：政治建设 = <b>根本性</b>、摆<b>首位</b>；思想建设 = <b>基础性</b>。</div>
  </div>
  <div style="margin-top:8px;font-size:12px;color:#8a94a6;">依据：数据包官方解析（《全面从严治党开创管党治党新时代》/2020陕西考察讲话）。</div>
</div>
</html>
```

## V-09 · 小测 / 变式题卡（第三幕·检验）

**用途**：即时小测与变式题呈现，便于快速作答判分。
**形态**：HTML 题干卡 + 选项（A-D 分行）+ 来源标注（真题/改编/原创，必须可见）。

```html type="renderer">
<html style="margin:0;padding:0;">
<title>变式题 2 · 检测卡</title>
<div style="width:100%;box-sizing:border-box;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#f5f6f8;padding:16px;color:#1f2329;">
  <div style="background:#fff;border:1px solid #e5e6eb;border-radius:12px;padding:16px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
      <div style="font-size:15px;font-weight:700;">变式题 2 · 党的建设布局</div>
      <div style="font-size:12px;color:#8a94a6;">来源：改编（十九大报告论断）</div>
    </div>
    <div style="font-size:14px;line-height:1.7;margin-bottom:10px;">下列关于新时代党的建设布局的说法，正确的是：</div>
    <div style="font-size:14px;line-height:1.9;">
      <div style="padding:6px 10px;border-radius:8px;">A. 思想建设是根本性建设</div>
      <div style="padding:6px 10px;border-radius:8px;">B. 政治建设摆在首位，是根本性建设</div>
      <div style="padding:6px 10px;border-radius:8px;">C. 组织建设是基础性建设</div>
      <div style="padding:6px 10px;border-radius:8px;">D. 作风建设摆在首位</div>
    </div>
    <div style="margin-top:10px;font-size:12px;color:#8a94a6;">直接回复答案字母即可。</div>
  </div>
</div>
</html>
```

## V-10 · 判定 / 进度 / 处方卡（步骤 4/5/7）

**用途**：掌握判定徽章、带教进度条、处方卡、3 日巩固计划。
**形态**：HTML 徽章 + 进度条 + 处方卡（判定与处方可同图）。

```html type="renderer">
<html style="margin:0;padding:0;">
<title>带教进度与判定</title>
<div style="width:100%;box-sizing:border-box;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#f5f6f8;padding:16px;color:#1f2329;">
  <div style="background:#fff;border:1px solid #e5e6eb;border-radius:12px;padding:16px;">
    <div style="font-size:15px;font-weight:700;margin-bottom:10px;">带教进度 · 组A 3/3</div>
    <div style="background:#e5e6eb;border-radius:6px;height:10px;overflow:hidden;margin-bottom:10px;"><div style="width:100%;height:100%;background:#2f9e6e;"></div></div>
    <div style="font-size:14px;line-height:2;">
      <span style="display:inline-block;background:#f0f7f4;color:#2f9e6e;border:1px solid #2f9e6e;border-radius:12px;padding:2px 10px;margin-right:6px;">✓ 已掌握</span>科学体系板块定位 · 立法工作格局<br>
      <span style="display:inline-block;background:#fef2f2;color:#d64545;border:1px solid #d64545;border-radius:12px;padding:2px 10px;margin-right:6px;">⚡ 待复查</span>政治建设摆在首位（补救后再测仍错）
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

---

## 3. 三幕带教节奏（每题的对话编排）

| 幕 | 教练动作 | 可视化 | 用户动作 |
|---|---|---|---|
| 第一幕·还原 | 出示轨迹图，只给证据 | V-07（断点留白） | 自述错因 |
| 第二幕·揭秘 | 用户自述后揭断点+讲解 | V-08（三段式） | 提疑/确认 |
| 第三幕·检验 | 小测 → 变式 → 判分 → 补救 | V-09 → 判分表 → V-10 | 作答 |

**节奏纪律**：第一幕图先出、结论后给；用户没自述前不揭断点；一轮对话只推进一幕。

## 4. 降级规则

- 渲染器不可用/失败 → 用结构化 Markdown（表格/列表/引用）表达同等信息，不得留空白。
- 交互脚本失败 → 保留静态主结构 + 文字说明。
- 数据缺失（字段 null）→ 如实标注"该信号未采集"，图内该节点置灰。
- 长题干 → 压缩为要点行（如"①作风建设…②思想建设在首位…"），全文放知识库。
