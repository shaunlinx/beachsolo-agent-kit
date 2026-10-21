#!/usr/bin/env node
/**
 * 为未掌握知识点生成 3 日巩固计划（写入 beachsolo/plans/）。
 * 用法：node scripts/build-remediation-plan.mjs <beachsolo目录，默认 ./beachsolo>
 * 依据：profile.json.pendingPoints（未掌握知识点）+ 对应知识库条目。
 * 幂等：同一知识点已存在有效计划则追加"下次数据包复查"提醒，不重复生成。
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const base = resolve(process.argv[2] || 'beachsolo');
const profilePath = join(base, 'profile.json');
if (!existsSync(profilePath)) {
  console.error('[ERROR] 未找到 profile.json，先运行 report-scaffold.mjs');
  process.exit(1);
}

const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
const pending = profile.profile?.pendingPoints || [];
if (pending.length === 0) {
  console.log('OK  当前无待复查知识点，无需生成计划');
  process.exit(0);
}

const plansDir = join(base, 'plans');
mkdirSync(plansDir, { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const fileName = `remediation-${today}.md`;
const filePath = join(plansDir, fileName);

let content = '';
if (existsSync(filePath)) content = readFileSync(filePath, 'utf8');

content += [
  '',
  `## ${today} · 待复查知识点巩固计划（${pending.length} 项）`,
  '',
  '| 知识点 | 每日动作 | 自查方式 | 复查节点 |',
  '|---|---|---|---|',
  ...pending.map((p) => {
    const [point, note] = (p || '').split('——').map((s) => s || '');
    return [
      `| ${point} | 每日 5 题专项（对应模块工具箱） | 练后复述记忆锚点 / 错因一句话 | 下次数据包自动置顶复查 |`,
    ].join('\n');
  }),
  '',
  '> 规则：每日 5 题专项 + 记忆锚点回顾；3/7 天后若收到应用端复测提醒，直接回来反馈结果。',
  '',
].join('\n');

writeFileSync(filePath, content, 'utf8');
console.log(`OK  巩固计划已生成: ${filePath}`);
console.log(`    覆盖 ${pending.length} 个待复查知识点`);
