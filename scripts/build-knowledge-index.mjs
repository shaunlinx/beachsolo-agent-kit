#!/usr/bin/env node
/**
 * 从数据包提取错题，沉淀为可检索的知识库（按模块分目录、每题一个 markdown），
 * 并重建 INDEX.md 索引。幂等：同一 attemptId 重复执行只记一次。
 * 用法：node scripts/build-knowledge-index.mjs <数据包.json> [beachsolo目录，默认 ./beachsolo]
 */
import {
  readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync,
} from 'fs';
import { join, resolve, relative } from 'path';

const WRONG_STATUSES = new Set(['wrong', 'changedToWrong']);

function fail(msg) {
  console.error('[ERROR] ' + msg);
  process.exit(1);
}

const pkgPath = process.argv[2];
if (!pkgPath) fail('用法: node scripts/build-knowledge-index.mjs <数据包.json> [beachsolo目录]');

let pkg;
try {
  pkg = JSON.parse(readFileSync(resolve(pkgPath), 'utf8'));
} catch (e) {
  fail('无法读取/解析数据包: ' + e.message);
}
if (!pkg.snapshot || !Array.isArray(pkg.snapshot.questions)) {
  fail('数据包缺少 snapshot.questions');
}

const base = resolve(process.argv[3] || 'beachsolo');
const knowledgeDir = join(base, 'knowledge');
mkdirSync(knowledgeDir, { recursive: true });

const fullMap = new Map((pkg.questionsFull || []).map((q) => [q.questionId, q]));
const mistakeMap = new Map((pkg.snapshot.mistakes || []).map((m) => [m.questionId, m]));
const attemptId = pkg.attemptId || 'unknown';
const dateTag = new Date().toISOString().slice(0, 10);

function sanitizeDir(name) {
  return String(name || '未分类').replace(/[\\/:*?"<>|\s]+/g, '');
}

let written = 0;
let skipped = 0;

for (const q of pkg.snapshot.questions) {
  if (!WRONG_STATUSES.has(q.status)) continue;
  const full = fullMap.get(q.questionId);
  const mistake = mistakeMap.get(q.questionId);

  const dir = join(knowledgeDir, sanitizeDir(q.section));
  mkdirSync(dir, { recursive: true });
  const fileName =
    `q${String(q.questionNo).padStart(3, '0')}-${String(q.questionId).slice(0, 8)}.md`;
  const filePath = join(dir, fileName);

  let content;
  if (existsSync(filePath)) {
    content = readFileSync(filePath, 'utf8');
    if (content.includes(attemptId)) {
      skipped += 1;
      continue;
    }
  } else {
    content = renderNewEntry(q, full, mistake);
  }
  content += renderVisit(pkg, q);
  writeFileSync(filePath, content, 'utf8');
  written += 1;
}

rebuildIndex(knowledgeDir);
console.log(`OK  知识库更新完成：新增/追加 ${written} 题，跳过（已含本次会话）${skipped} 题`);
console.log(`    索引: ${join(knowledgeDir, 'INDEX.md')}`);

function renderNewEntry(q, full, mistake) {
  const lines = [];
  lines.push(`# 第${q.questionNo}题 · ${q.section} / ${q.subsection || '-'}`);
  lines.push('');
  lines.push(`- 模块: ${q.section} / ${q.subsection || '-'}`);
  lines.push(`- questionId: ${q.questionId}`);
  if (mistake) {
    lines.push(`- 累计做错: ${mistake.wrongCount} 次`);
    const reasons = (mistake.userReasons || [])
      .map((r) => `${r.type}${r.note ? `（${r.note}）` : ''}`)
      .join('、');
    if (reasons) lines.push(`- 用户自打错因: ${reasons}`);
  }
  lines.push('');
  lines.push('## 题干');
  lines.push('');
  lines.push(full?.stem || '（题干缺失）');
  lines.push('');
  const options = full?.options || {};
  const optionKeys = Object.keys(options).filter((k) => options[k]);
  if (optionKeys.length > 0) {
    lines.push('## 选项');
    lines.push('');
    for (const k of optionKeys) lines.push(`- ${k}. ${options[k]}`);
    lines.push('');
  }
  lines.push('## 正确答案');
  lines.push('');
  lines.push(full?.answer || full?.correctOptions || '（缺失）');
  lines.push('');
  lines.push('## 解析');
  lines.push('');
  lines.push(full?.analysis || '（无解析）');
  lines.push('');
  lines.push('## 出现记录');
  lines.push('');
  return lines.join('\n');
}

function renderVisit(p, q) {
  const statusText = q.status === 'wrong' ? '答错' : '改答后答错';
  return (
    `- ${dateTag}（${p.attemptId}）：${statusText}，` +
    `你的答案 ${q.finalAnswer || '未作答'}，用时 ${Math.round(q.elapsedSeconds || 0)} 秒` +
    `${q.uncertain ? '，自标不确定' : ''}${q.marked ? '，自标待复查' : ''}\n`
  );
}

function rebuildIndex(dir) {
  const sections = readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isDirectory())
    .sort();
  const lines = [];
  lines.push('# 错题知识库索引');
  lines.push('');
  lines.push(`> 由 build-knowledge-index.mjs 自动生成，最后更新 ${dateTag}。`);
  lines.push('> 检索方式：先读本索引定位模块，再 grep 对应目录的题干/解析关键词。');
  lines.push('');
  for (const section of sections) {
    const files = readdirSync(join(dir, section))
      .filter((f) => f.endsWith('.md'))
      .sort();
    if (files.length === 0) continue;
    lines.push(`## ${section}（${files.length} 题）`);
    lines.push('');
    for (const f of files) {
      lines.push(`- ${relative(dir, join(dir, section, f))}`);
    }
    lines.push('');
  }
  writeFileSync(join(dir, 'INDEX.md'), lines.join('\n'), 'utf8');
}
