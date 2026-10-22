#!/usr/bin/env node
/**
 * BeachSOLO 深度分析引擎：6 维度深度归因 + 全题四分类 + 带教优先级队列。
 * 用法：node scripts/deep-analysis.mjs <数据包.json> [输出目录，默认 ./beachsolo/reports]
 *
 * 产出：
 *   analysis-<attemptId前8位>.json  —— 结构化分析结果（供后续步骤直接消费，禁止重复手写分析）
 *   同时向 stdout 打印人类可读的归因结论摘要。
 *
 * 设计原则：所有数字与结论由本脚本从数据包确定性计算，agent 只负责解释与检索，不重算。
 */
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, join, dirname } from 'path';

// ── 判定阈值（按模块）────────────────────────────────────────────
// 答对且用时低于该秒数 → 疑似蒙对（常识题本身快，阈值最低）
const FAST_THRESHOLD = {
  '常识判断': 10,
  '言语理解与表达': 15,
  '数量关系': 20,
  '判断推理': 20,
  '资料分析': 20,
};
const DEFAULT_FAST = 15;
const LONG_USE_FACTOR = 2;     // 用时 ≥ 模块均值 2 倍 → 卡顿
const SLOW_USE_FACTOR = 1.5;   // 用时 ≥ 模块均值 1.5 倍 → 偏慢

function fail(msg) {
  console.error('[ERROR] ' + msg);
  process.exit(1);
}

const pkgPath = process.argv[2];
if (!pkgPath) fail('用法: node scripts/deep-analysis.mjs <数据包.json> [输出目录]');

let pkg;
try {
  pkg = JSON.parse(readFileSync(resolve(pkgPath), 'utf8'));
} catch (e) {
  fail('无法读取/解析数据包: ' + e.message);
}
if (!pkg.snapshot || !Array.isArray(pkg.snapshot.questions)) fail('数据包缺少 snapshot.questions');

const meta = pkg.snapshot.meta || {};
const questions = pkg.snapshot.questions;
const events = (pkg.behaviorEventsRaw || []).filter((e) => e && e.type);

const isCorrect = (q) => q.status === 'correct' || q.status === 'changedToRight';
const isWrong = (q) => q.status === 'wrong' || q.status === 'changedToWrong';

// ── 模块聚合 ────────────────────────────────────────────────────
const moduleMap = new Map();
for (const q of questions) {
  if (!moduleMap.has(q.section)) {
    moduleMap.set(q.section, {
      name: q.section, total: 0, correct: 0, wrong: 0, unanswered: 0,
      timeSum: 0, answeredTimeSum: 0, answeredCount: 0,
      guessed: 0, hesitated: 0, stable: 0,
    });
  }
  const m = moduleMap.get(q.section);
  m.total += 1;
  m.timeSum += q.elapsedSeconds || 0;
  if (q.status === 'unanswered') {
    m.unanswered += 1;
    continue;
  }
  m.answeredCount += 1;
  m.answeredTimeSum += q.elapsedSeconds || 0;
  if (isCorrect(q)) m.correct += 1;
  if (isWrong(q)) m.wrong += 1;
}

// ── 全题四分类 ──────────────────────────────────────────────────
// 分类优先级：错题 > 未答(放弃) > 蒙对 > 犹豫 > 稳对
const classes = {
  wrong: [],        // 错题：深度带教
  guessed: [],      // 蒙对题：当错题处理
  hesitated: [],    // 犹豫题：考点巩固
  stable: [],       // 稳对题：只做拓展
  unanswered: [],   // 未答：放弃策略分析
};

function classify(q) {
  const fastT = FAST_THRESHOLD[q.section] ?? DEFAULT_FAST;
  const m = moduleMap.get(q.section);
  const modAvg = m.answeredCount > 0 ? m.answeredTimeSum / m.answeredCount : 0;
  const fastGuess = (q.elapsedSeconds || 0) <= fastT;
  const slowHesitate = modAvg > 0 && (q.elapsedSeconds || 0) >= modAvg * LONG_USE_FACTOR;

  const signals = [];
  if (q.uncertain) signals.push('自标不确定');
  if (q.marked) signals.push('自标待复查');
  if ((q.changeCount || 0) > 0) signals.push(`改答${q.changeCount}次`);
  if (fastGuess && isCorrect(q)) signals.push(`用时极短(${Math.round(q.elapsedSeconds)}s)`);
  if (slowHesitate) signals.push(`用时超模块均值2倍(${Math.round(q.elapsedSeconds)}s)`);
  if (q.draftMatchesFinal === false) signals.push('草稿与终答不一致');

  const item = {
    questionNo: q.questionNo,
    questionId: q.questionId,
    section: q.section,
    subsection: q.subsection || '',
    status: q.status,
    finalAnswer: q.finalAnswer || null,
    elapsedSeconds: Math.round(q.elapsedSeconds || 0),
    changeCount: q.changeCount || 0,
    signals,
  };

  if (isWrong(q)) {
    classes.wrong.push(item);
    return 'wrong';
  }
  if (q.status === 'unanswered') {
    classes.unanswered.push(item);
    return 'unanswered';
  }
  // 答对的题再细分
  if (q.uncertain || fastGuess) {
    classes.guessed.push(item);
    m.guessed += 1;
    return 'guessed';
  }
  if (q.marked || (q.changeCount || 0) > 0 || slowHesitate) {
    classes.hesitated.push(item);
    m.hesitated += 1;
    return 'hesitated';
  }
  classes.stable.push(item);
  m.stable += 1;
  return 'stable';
}
for (const q of questions) classify(q);

// ── 维度 1：用时分析 ────────────────────────────────────────────
const answered = questions.filter((q) => q.status !== 'unanswered');
const allTimes = answered.map((q) => q.elapsedSeconds || 0).sort((a, b) => a - b);
const median = allTimes.length
  ? (allTimes.length % 2
      ? allTimes[(allTimes.length - 1) / 2]
      : (allTimes[allTimes.length / 2 - 1] + allTimes[allTimes.length / 2]) / 2)
  : 0;
const longUse = answered.filter((q) => {
  const m = moduleMap.get(q.section);
  const avg = m.answeredCount > 0 ? m.answeredTimeSum / m.answeredCount : 0;
  return avg > 0 && (q.elapsedSeconds || 0) >= avg * LONG_USE_FACTOR;
});
const timeDim = {
  totalSeconds: meta.durationSeconds || 0,
  totalMinutes: Math.round((meta.durationSeconds || 0) / 60),
  medianSeconds: Math.round(median),
  avgAnsweredSeconds: allTimes.length
    ? Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length) : 0,
  longUseQuestionNos: longUse.map((q) => q.questionNo),
  conclusion: longUse.length
    ? `${longUse.length} 题用时超模块均值2倍（第${longUse.map((q) => q.questionNo).join('、')}题），这些题存在卡顿或反复纠结，是时间黑洞`
    : '未出现明显超时卡顿题',
};

// ── 维度 2：改答模式 ────────────────────────────────────────────
const changed = questions.filter((q) => (q.changeCount || 0) > 0);
const changedRight = questions.filter((q) => q.status === 'changedToRight');
const changedWrong = questions.filter((q) => q.status === 'changedToWrong');
const draftMismatch = questions.filter((q) => q.draftMatchesFinal === false);
let changeConclusion;
if (changed.length === 0) {
  changeConclusion = '本次没有改答，作答决策稳定';
} else if (changedWrong.length > changedRight.length) {
  changeConclusion = `改答${changed.length}次，改错${changedWrong.length}题多于改对${changedRight.length}题——第一印象更可靠，应减少无依据的改答`;
} else if (changedRight.length > 0) {
  changeConclusion = `改答${changed.length}次，改对${changedRight.length}题——检查机制有效，但需确认改对是基于推理而非运气`;
} else {
  changeConclusion = `改答${changed.length}次，改对与改错基本持平`;
}
const changeDim = {
  changedCount: changed.length,
  changedRightNos: changedRight.map((q) => q.questionNo),
  changedWrongNos: changedWrong.map((q) => q.questionNo),
  draftMismatchNos: draftMismatch.map((q) => q.questionNo),
  conclusion: changeConclusion,
};

// ── 维度 3：蒙题概率 ────────────────────────────────────────────
const guessDim = {
  guessedCount: classes.guessed.length,
  guessedQuestionNos: classes.guessed.map((q) => q.questionNo),
  guessRate: (classes.guessed.length + classes.wrong.length) > 0
    ? Math.round(classes.guessed.length / (classes.guessed.length + classes.stable.length + classes.hesitated.length) * 100)
    : 0,
  conclusion: classes.guessed.length
    ? `${classes.guessed.length} 题疑似蒙对（第${classes.guessed.map((q) => q.questionNo).join('、')}题）——这些题实际未掌握，必须按错题带教，否则下次大概率丢分`
    : '未发现明显蒙对题，答对的题都有合理作答过程',
};

// ── 维度 4：放弃策略 ────────────────────────────────────────────
const unanswered = classes.unanswered;
const moduleAbandon = Array.from(moduleMap.values())
  .map((m) => ({
    name: m.name,
    abandonRate: Math.round(m.unanswered / m.total * 100),
    unanswered: m.unanswered,
    total: m.total,
  }))
  .sort((a, b) => b.abandonRate - a.abandonRate);
const fullyAbandoned = moduleAbandon.filter((m) => m.abandonRate === 100);
let abandonConclusion;
if (unanswered.length === 0) {
  abandonConclusion = '整卷全部作答，无放弃';
} else if (fullyAbandoned.length > 0) {
  abandonConclusion = `整模块放弃：${fullyAbandoned.map((m) => m.name).join('、')}完全未答（${unanswered.length}题未答）——这是战略性放弃还是时间不够？需确认是否符合预期的时间分配`;
} else {
  abandonConclusion = `${unanswered.length} 题未答，放弃率最高的模块是${moduleAbandon[0]?.name}（${moduleAbandon[0]?.abandonRate}%）`;
}
const abandonDim = {
  unansweredCount: unanswered.length,
  unansweredRate: Math.round(unanswered.length / questions.length * 100),
  moduleAbandon,
  fullyAbandonedModules: fullyAbandoned.map((m) => m.name),
  conclusion: abandonConclusion,
};

// ── 维度 5：答题节奏 ────────────────────────────────────────────
// 用 firstAnsweredAt 把已答题按时间顺序分成前后两半，比较节奏
const timed = answered
  .filter((q) => q.firstAnsweredAt)
  .map((q) => ({ no: q.questionNo, t: new Date(q.firstAnsweredAt).getTime(), sec: q.elapsedSeconds || 0 }))
  .sort((a, b) => a.t - b.t);
const pauseEvents = events.filter((e) => e.type === 'pause').length;
let rhythmConclusion = '答题节奏均匀';
if (timed.length >= 4) {
  const half = Math.floor(timed.length / 2);
  const first = timed.slice(0, half);
  const second = timed.slice(half);
  const firstSpan = first[first.length - 1].t - first[0].t;
  const secondSpan = second[second.length - 1].t - second[0].t;
  if (firstSpan > 0 && secondSpan / firstSpan > 1.5) {
    rhythmConclusion = '前半段推进快、后半段明显变慢（可能疲劳或遇难题），需注意时间分配';
  } else if (secondSpan > 0 && firstSpan / secondSpan > 1.5) {
    rhythmConclusion = '前半段慢、后半段加快（可能前面纠结过多），需提前规划';
  }
}
const rhythmDim = {
  pauseCount: pauseEvents,
  eventCount: events.length,
  conclusion: rhythmConclusion,
};

// ── 维度 6：模块能力画像 ────────────────────────────────────────
const moduleProfile = Array.from(moduleMap.values()).map((m) => {
  const answeredCount = m.answeredCount;
  const accuracy = answeredCount ? Math.round(m.correct / answeredCount * 100) : 0;
  const avgTime = answeredCount ? Math.round(m.answeredTimeSum / answeredCount) : 0;
  const guessRate = answeredCount ? Math.round(m.guessed / answeredCount * 100) : 0;
  const abandonRate = Math.round(m.unanswered / m.total * 100);
  let level, advice;
  if (abandonRate === 100) {
    level = '完全未触及';
    advice = '该模块本次未作答，需确认是战略放弃还是时间不足，安排专项';
  } else if (accuracy >= 80 && guessRate < 15) {
    level = '优势模块';
    advice = '保持即可，可分配更低时间精力，把时间让给薄弱模块';
  } else if (accuracy >= 60) {
    level = '基本掌握';
    advice = '查缺补漏，重点处理蒙对和犹豫题';
  } else if (answeredCount > 0) {
    level = '薄弱模块';
    advice = '优先投入：系统学习考点 + 专项刷题';
  } else {
    level = '未作答';
    advice = '安排该模块的基础学习';
  }
  return {
    name: m.name, total: m.total, answered: answeredCount,
    correct: m.correct, wrong: m.wrong, unanswered: m.unanswered,
    accuracy, avgTimeSeconds: avgTime, guessRate, abandonRate,
    guessed: m.guessed, hesitated: m.hesitated, stable: m.stable,
    level, advice,
  };
}).sort((a, b) => a.accuracy - b.accuracy);

// ── 带教优先级队列 ──────────────────────────────────────────────
// 错题优先，其次蒙对，其次犹豫；同类内按"用时越长=纠结越深"优先
const teachQueue = [
  ...classes.wrong.map((q) => ({ ...q, teachClass: 'wrong', priority: 1 })),
  ...classes.guessed.map((q) => ({ ...q, teachClass: 'guessed', priority: 2 })),
  ...classes.hesitated.map((q) => ({ ...q, teachClass: 'hesitated', priority: 3 })),
].sort((a, b) => a.priority - b.priority || b.elapsedSeconds - a.elapsedSeconds);

// ── 输出 ────────────────────────────────────────────────────────
const result = {
  schema: 'beachsolo-analysis@1',
  generatedAt: new Date().toISOString(),
  attemptId: pkg.attemptId,
  paperTitle: meta.paperTitle || pkg.paper?.title || '',
  score: meta.score ?? null,
  totals: {
    questions: questions.length,
    answered: answered.length,
    correct: classes.wrong.length + classes.guessed.length + classes.hesitated.length + classes.stable.length
      ? classes.guessed.length + classes.hesitated.length + classes.stable.length : 0,
    wrong: classes.wrong.length,
    guessed: classes.guessed.length,
    hesitated: classes.hesitated.length,
    stable: classes.stable.length,
    unanswered: classes.unanswered.length,
  },
  dimensions: {
    time: timeDim,
    change: changeDim,
    guess: guessDim,
    abandon: abandonDim,
    rhythm: rhythmDim,
  },
  moduleProfile,
  classification: {
    wrong: classes.wrong,
    guessed: classes.guessed,
    hesitated: classes.hesitated,
    stable: classes.stable,
    unanswered: classes.unanswered,
  },
  teachQueue: teachQueue.map((q) => ({
    questionNo: q.questionNo, section: q.section, teachClass: q.teachClass,
    elapsedSeconds: q.elapsedSeconds, signals: q.signals,
  })),
};

const outDir = resolve(process.argv[3] || join(process.cwd(), 'beachsolo', 'reports'));
mkdirSync(outDir, { recursive: true });
const id8 = String(pkg.attemptId || 'unknown').slice(0, 8);
const outPath = join(outDir, `analysis-${id8}.json`);
writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');

console.log(`OK  深度分析完成: ${outPath}`);
console.log(`    错题${classes.wrong.length} 蒙对${classes.guessed.length} 犹豫${classes.hesitated.length} 稳对${classes.stable.length} 未答${classes.unanswered.length}`);
console.log(`    需带教 ${teachQueue.length} 题`);
console.log('── 归因结论 ──');
console.log('  用时：' + timeDim.conclusion);
console.log('  改答：' + changeDim.conclusion);
console.log('  蒙题：' + guessDim.conclusion);
console.log('  放弃：' + abandonDim.conclusion);
console.log('  节奏：' + rhythmDim.conclusion);
