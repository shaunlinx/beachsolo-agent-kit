#!/usr/bin/env node
/**
 * 校验 BeachSOLO 数据包完整性。
 * 用法：node scripts/validate-package.mjs <数据包路径>
 * 退出码：0=通过，1=有错误
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const REQUIRED_TOP_LEVEL = [
  'schemaVersion', 'attemptId', 'userId', 'exportedAt',
  'paper', 'snapshot', 'questionsFull', 'answersRaw',
  'starterAnswers', 'behaviorEventsRaw',
];

const REQUIRED_SNAPSHOT = ['meta', 'questions', 'behavior', 'mistakes', 'dataDictionary'];
const REQUIRED_META = ['attemptId', 'paperTitle', 'examMode', 'durationSeconds', 'score', 'correctCount', 'wrongCount'];
const REQUIRED_QUESTION = ['questionNo', 'questionId', 'section', 'status', 'elapsedSeconds'];
const VALID_STATUS = ['correct', 'wrong', 'unanswered', 'changedToRight', 'changedToWrong'];

const errors = [];

function err(path, msg) {
  errors.push(`[ERROR] ${path}: ${msg}`);
}

function checkRequired(obj, fields, path) {
  if (!obj || typeof obj !== 'object') {
    err(path, '不是对象');
    return;
  }
  for (const f of fields) {
    if (!(f in obj)) err(`${path}.${f}`, '字段缺失');
  }
}

// ── 主流程 ──────────────────────────────────────────────────────────────────
const filePath = process.argv[2];
if (!filePath) {
  console.error('用法: node scripts/validate-package.mjs <数据包.json>');
  process.exit(1);
}

let pkg;
try {
  pkg = JSON.parse(readFileSync(resolve(filePath), 'utf8'));
} catch (e) {
  console.error(`[ERROR] 无法读取/解析文件: ${e.message}`);
  process.exit(1);
}

// 顶层
checkRequired(pkg, REQUIRED_TOP_LEVEL, '$');
if (pkg.schemaVersion !== 1) err('$.schemaVersion', `期望 1，实际 ${pkg.schemaVersion}`);
if (typeof pkg.attemptId !== 'string' || !pkg.attemptId) err('$.attemptId', '必须为非空字符串');

// snapshot
if (pkg.snapshot) {
  checkRequired(pkg.snapshot, REQUIRED_SNAPSHOT, '$.snapshot');
  if (pkg.snapshot.meta) {
    checkRequired(pkg.snapshot.meta, REQUIRED_META, '$.snapshot.meta');
    if (pkg.snapshot.meta.attemptId !== pkg.attemptId) {
      err('$.snapshot.meta.attemptId', '与顶层 attemptId 不一致');
    }
  }
  if (Array.isArray(pkg.snapshot.questions)) {
    pkg.snapshot.questions.forEach((q, i) => {
      checkRequired(q, REQUIRED_QUESTION, `$.snapshot.questions[${i}]`);
      if (q.status && !VALID_STATUS.includes(q.status)) {
        err(`$.snapshot.questions[${i}].status`, `非法值 "${q.status}"`);
      }
    });
  } else {
    err('$.snapshot.questions', '必须为数组');
  }
  if (pkg.snapshot.dataDictionary && typeof pkg.snapshot.dataDictionary !== 'object') {
    err('$.snapshot.dataDictionary', '必须为对象');
  }
}

// questionsFull / answersRaw / behaviorEventsRaw 必须是数组
for (const key of ['questionsFull', 'answersRaw', 'starterAnswers', 'behaviorEventsRaw']) {
  if (!Array.isArray(pkg[key])) err(`$.${key}`, '必须为数组');
}

// ── 结果 ─────────────────────────────────────────────────────────────────────
if (errors.length === 0) {
  const qCount = Array.isArray(pkg.snapshot?.questions) ? pkg.snapshot.questions.length : '?';
  const evtCount = Array.isArray(pkg.behaviorEventsRaw) ? pkg.behaviorEventsRaw.length : '?';
  console.log(`PASS  attemptId=${pkg.attemptId}  题目数=${qCount}  事件数=${evtCount}`);
  process.exit(0);
} else {
  console.error(`FAIL  ${errors.length} 个错误：`);
  errors.forEach((e) => console.error('  ' + e));
  process.exit(1);
}
