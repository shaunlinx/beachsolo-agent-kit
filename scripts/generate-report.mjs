#!/usr/bin/env node
/**
 * 生成 BeachSOLO 答题可视化诊断报告（独立 HTML，ECharts CDN，零依赖）。
 * 用法：node scripts/generate-report.mjs <数据包.json> [输出.html]
 * 默认输出：beachsolo/reports/diagnosis-<attemptId前8位>-<YYYYMMDD>.html
 */
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve, join } from 'path';

const STATUS_LABEL = {
  correct: '答对',
  wrong: '答错',
  unanswered: '未答',
  changedToRight: '改对',
  changedToWrong: '改错',
};
const STATUS_COLOR = {
  correct: '#2f9e6e',
  wrong: '#d64545',
  unanswered: '#9ca3af',
  changedToRight: '#3b82f6',
  changedToWrong: '#f59e0b',
};

function fail(msg) {
  console.error('[ERROR] ' + msg);
  process.exit(1);
}

const pkgPath = process.argv[2];
if (!pkgPath) fail('用法: node scripts/generate-report.mjs <数据包.json> [输出.html]');

let pkg;
try {
  pkg = JSON.parse(readFileSync(resolve(pkgPath), 'utf8'));
} catch (e) {
  fail('无法读取/解析数据包: ' + e.message);
}
if (!pkg.snapshot || !Array.isArray(pkg.snapshot.questions)) {
  fail('数据包缺少 snapshot.questions，请确认数据包完整');
}

const meta = pkg.snapshot.meta || {};
const questions = pkg.snapshot.questions;
const behavior = pkg.snapshot.behavior || {};

// ── 模块正确率 ───────────────────────────────────────────────
const bySection = new Map();
for (const q of questions) {
  const s = bySection.get(q.section) || { total: 0, correct: 0 };
  s.total += 1;
  if (q.status === 'correct' || q.status === 'changedToRight') s.correct += 1;
  bySection.set(q.section, s);
}
const sectionStats = Array.from(bySection.entries())
  .map(([name, s]) => ({
    name,
    total: s.total,
    accuracy: Math.round((s.correct / s.total) * 1000) / 10,
  }))
  .sort((a, b) => b.accuracy - a.accuracy);

// ── 五态分布 ────────────────────────────────────────────────
const statusCount = {};
for (const q of questions) statusCount[q.status] = (statusCount[q.status] || 0) + 1;
const statusPie = Object.entries(statusCount).map(([k, v]) => ({
  name: STATUS_LABEL[k] || k,
  value: v,
  itemStyle: { color: STATUS_COLOR[k] || '#888' },
}));

// ── 逐题用时（按状态着色）──────────────────────────────────
const timeBars = questions.map((q) => ({
  no: q.questionNo,
  sec: Math.round(q.elapsedSeconds || 0),
  status: q.status,
  section: q.section,
}));

// ── 事件时间线（散点 + 暂停区带）────────────────────────────
const events = (pkg.behaviorEventsRaw || [])
  .filter((e) => e && e.type)
  .map((e) => ({
    type: e.type,
    x: Math.round(e.elapsedSeconds || 0),
    questionId: e.questionId || null,
    value: e.value || null,
    occurredAt: e.occurredAt || '',
  }));
const eventTypes = Array.from(new Set(events.map((e) => e.type))).sort();
const scatterData = eventTypes.map((t, yi) =>
  events.filter((e) => e.type === t).map((e) => [e.x, yi, e]),
);
const pauses = [];
let pendingPause = null;
for (const e of events) {
  if (e.type === 'pause') pendingPause = e.x;
  else if (e.type === 'resume' && pendingPause !== null) {
    pauses.push([pendingPause, e.x]);
    pendingPause = null;
  }
}

// ── 异常清单 ────────────────────────────────────────────────
const moduleAvg = new Map();
for (const s of sectionStats) {
  const qs = questions.filter((q) => q.section === s.name);
  const avg = qs.reduce((sum, q) => sum + (q.elapsedSeconds || 0), 0) / Math.max(qs.length, 1);
  moduleAvg.set(s.name, avg);
}
const anomalies = [];
for (const q of questions) {
  const reasons = [];
  if ((q.elapsedSeconds || 0) > 600) reasons.push('用时超600秒（截断阈值，可能失真）');
  const avg = moduleAvg.get(q.section) || 0;
  if (avg > 0 && q.elapsedSeconds >= avg * 2 && q.elapsedSeconds <= 600) {
    reasons.push('用时≥模块均值2倍');
  }
  if (q.draftMatchesFinal === false) reasons.push('草稿与终答不一致（誊写失误）');
  if (q.marked) reasons.push('标记待复查');
  if (q.uncertain) reasons.push('标记不确定');
  if (q.status === 'changedToWrong') reasons.push('改答后答错');
  if ((q.elapsedSeconds || 0) === 0 && q.status === 'wrong') reasons.push('零用时答错（疑似盲答）');
  if (reasons.length > 0) {
    anomalies.push({
      no: q.questionNo,
      section: q.section,
      status: STATUS_LABEL[q.status] || q.status,
      sec: Math.round(q.elapsedSeconds || 0),
      reasons: reasons.join('；'),
    });
  }
}

// ── 汇总指标 ────────────────────────────────────────────────
const answered = questions.filter((q) => q.status !== 'unanswered').length;
const correct = (statusCount.correct || 0) + (statusCount.changedToRight || 0);
const changedRight = statusCount.changedToRight || 0;
const changedWrong = statusCount.changedToWrong || 0;
const durationMin = Math.round((meta.durationSeconds || 0) / 60);
const accuracy = answered > 0 ? Math.round((correct / answered) * 1000) / 10 : 0;

const reportData = {
  meta: {
    title: meta.paperTitle || pkg.paper?.title || '未知试卷',
    attemptId: pkg.attemptId || '',
    score: meta.score ?? '-',
    totalScore: meta.totalScore ?? '-',
    durationMin,
    accuracy,
    questionCount: questions.length,
    pauseCount: behavior.pauseCount || 0,
    pauseTotalSeconds: behavior.pauseTotalSeconds || 0,
    changedRight,
    changedWrong,
    anomalyCount: anomalies.length,
    exportedAt: pkg.exportedAt || '',
  },
  sectionStats,
  statusPie,
  timeBars,
  eventTypes,
  scatterData,
  pauses,
  anomalies,
};

const id8 = String(pkg.attemptId || 'unknown').slice(0, 8);
const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const outPath = process.argv[3]
  ? resolve(process.argv[3])
  : join(process.cwd(), 'beachsolo', 'reports', `diagnosis-${id8}-${dateTag}.html`);
mkdirSync(dirname(outPath), { recursive: true });

const html = buildHtml(reportData);
writeFileSync(outPath, html, 'utf8');
console.log(`OK  可视化报告已生成: ${outPath}`);
console.log(`    模块 ${sectionStats.length} | 异常题 ${anomalies.length} | 事件 ${events.length}`);

// ── HTML 模板 ───────────────────────────────────────────────
function buildHtml(data) {
  const cards = [
    ['得分', `${data.meta.score} / ${data.meta.totalScore}`],
    ['正确率', `${data.meta.accuracy}%`],
    ['整卷用时', `${data.meta.durationMin} 分钟`],
    ['题目数', String(data.meta.questionCount)],
    ['暂停', `${data.meta.pauseCount} 次 / ${data.meta.pauseTotalSeconds} 秒`],
    ['改答', `改对 ${data.meta.changedRight} / 改错 ${data.meta.changedWrong}`],
    ['异常信号', `${data.meta.anomalyCount} 处`],
  ];
  const cardHtml = cards
    .map(
      ([label, value]) =>
        `<div class="card"><div class="card-label">${label}</div><div class="card-value">${value}</div></div>`,
    )
    .join('\n');

  const anomalyRows =
    data.anomalies.length === 0
      ? '<tr><td colspan="5" style="color:#8a94a6">本次答题未发现异常信号</td></tr>'
      : data.anomalies
          .map(
            (a) =>
              `<tr><td>${a.no}</td><td>${a.section}</td><td>${a.status}</td><td>${a.sec}s</td><td>${a.reasons}</td></tr>`,
          )
          .join('\n');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BeachSOLO 诊断报告 - ${data.meta.title}</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
<style>
  body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
         margin: 0; background: #f5f6f8; color: #1f2329; }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 24px 16px 64px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #646a73; font-size: 13px; margin-bottom: 20px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .card { background: #fff; border-radius: 8px; padding: 12px 14px; border: 1px solid #e5e6eb; }
  .card-label { font-size: 12px; color: #8a94a6; }
  .card-value { font-size: 18px; font-weight: 600; margin-top: 4px; }
  .panel { background: #fff; border: 1px solid #e5e6eb; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .panel h2 { font-size: 15px; margin: 0 0 12px; }
  .chart { width: 100%; height: 320px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #f0f1f3; }
  th { color: #8a94a6; font-weight: 500; background: #fafbfc; }
</style>
</head>
<body>
<div class="wrap">
  <h1>${data.meta.title}</h1>
  <div class="sub">BeachSOLO 自动诊断报告 · attemptId: ${data.meta.attemptId} · 导出: ${data.meta.exportedAt}</div>
  <div class="cards">${cardHtml}</div>
  <div class="panel"><h2>模块正确率（降序）</h2><div id="c-section" class="chart"></div></div>
  <div class="panel"><h2>逐题用时（按答题状态着色，虚线为 600 秒截断阈值）</h2><div id="c-time" class="chart"></div></div>
  <div class="panel"><h2>五态分布</h2><div id="c-pie" class="chart" style="height:260px"></div></div>
  <div class="panel"><h2>行为事件时间线（红带=暂停）</h2><div id="c-events" class="chart"></div></div>
  <div class="panel"><h2>异常信号清单（${data.anomalies.length} 处）</h2>
    <table>
      <thead><tr><th>题号</th><th>模块</th><th>状态</th><th>用时</th><th>命中信号</th></tr></thead>
      <tbody>${anomalyRows}</tbody>
    </table>
  </div>
</div>
<script>
window.__D__ = ${JSON.stringify(data)};
(function () {
  var D = window.__D__;
  function init(id) { return echarts.init(document.getElementById(id)); }

  var sec = init('c-section');
  sec.setOption({
    tooltip: { trigger: 'axis', formatter: function (p) {
      var d = D.sectionStats[p[0].dataIndex];
      return d.name + '：正确率 ' + d.accuracy + '%（共 ' + d.total + ' 题）';
    }},
    grid: { left: 90, right: 40, top: 10, bottom: 30 },
    xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    yAxis: { type: 'category', data: D.sectionStats.map(function (s) { return s.name; }).reverse(),
             inverse: false },
    series: [{ type: 'bar', data: D.sectionStats.map(function (s) { return s.accuracy; }).reverse(),
      barMaxWidth: 22, itemStyle: { color: '#3b82f6', borderRadius: 4 },
      label: { show: true, position: 'right', formatter: '{c}%' } }]
  });

  var time = init('c-time');
  time.setOption({
    tooltip: { trigger: 'axis', formatter: function (p) {
      var d = D.timeBars[p[0].dataIndex];
      return '第' + d.no + '题（' + d.section + '）：' + d.sec + ' 秒 · ' + d.status;
    }},
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: D.timeBars.map(function (d) { return d.no; }),
             axisLabel: { interval: Math.max(0, Math.floor(D.timeBars.length / 30)) } },
    yAxis: { type: 'value', name: '秒' },
    series: [{ type: 'bar', data: D.timeBars.map(function (d) {
        return { value: d.sec, itemStyle: { color: {
          correct: '#2f9e6e', wrong: '#d64545', unanswered: '#9ca3af',
          changedToRight: '#3b82f6', changedToWrong: '#f59e0b' }[d.status] || '#888' } };
      }),
      markLine: { silent: true, symbol: 'none', lineStyle: { type: 'dashed', color: '#d64545' },
        data: [{ yAxis: 600, label: { formatter: '600s 截断' } }] } }]
  });

  var pie = init('c-pie');
  pie.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{ type: 'pie', radius: ['40%', '68%'], center: ['50%', '45%'],
      data: D.statusPie, label: { formatter: '{b} {c} 题' } }]
  });

  var ev = init('c-events');
  ev.setOption({
    tooltip: { formatter: function (p) {
      var e = p.data[2];
      return e.type + (e.questionId ? ' · ' + e.questionId.slice(0, 8) : '') +
        (e.value ? ' · ' + e.value : '') + ' @ ' + e.x + 's';
    }},
    grid: { left: 110, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'value', name: '秒' },
    yAxis: { type: 'category', data: D.eventTypes },
    series: D.eventTypes.map(function (t, i) {
      return { name: t, type: 'scatter', symbolSize: 7, data: D.scatterData[i] };
    }).concat([{
      type: 'scatter', data: [],
      markArea: { silent: true, itemStyle: { color: 'rgba(214,69,69,0.12)' },
        data: D.pauses.map(function (p) {
          return [{ xAxis: p[0], name: '暂停' }, { xAxis: p[1] }];
        }) }
    }])
  });

  window.addEventListener('resize', function () {
    [sec, time, pie, ev].forEach(function (c) { c.resize(); });
  });
})();
</script>
</body>
</html>`;
}
