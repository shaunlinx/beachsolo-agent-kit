#!/usr/bin/env node
/**
 * 生成 beachsolo/ 标准目录骨架（已存在则跳过，不覆盖已有文件）。
 * 用法：node scripts/report-scaffold.mjs [目标目录，默认 ./beachsolo]
 */
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const base = resolve(process.argv[2] || 'beachsolo');

const dirs = ['', 'reports', 'plans', 'strategies', 'mistake-books', 'knowledge'];

for (const d of dirs) {
  const p = join(base, d);
  if (!existsSync(p)) {
    mkdirSync(p, { recursive: true });
    console.log(`  创建目录: ${p}`);
  } else {
    console.log(`  已存在，跳过: ${p}`);
  }
}

const logPath = join(base, 'DELIVERY-LOG.md');
if (!existsSync(logPath)) {
  writeFileSync(
    logPath,
    [
      '# BeachSOLO 交付台账',
      '',
      '> 每次数据包会话的全部交付物集中记录于此，只追加不改写历史。',
      '',
    ].join('\n'),
    'utf8',
  );
  console.log(`  初始化: ${logPath}`);
} else {
  console.log(`  已存在，跳过: ${logPath}`);
}

const profilePath = join(base, 'profile.json');
if (!existsSync(profilePath)) {
  const initial = {
    schema: 'beachsolo-profile@1',
    instructionsVersion: 1,
    installedAt: new Date().toISOString(),
    processedSessions: [],
    profile: {
      weakSections: [],
      hesitationTendency: '',
      notes: '',
      masteredPoints: [],
      pendingPoints: [],
    },
  };
  writeFileSync(profilePath, JSON.stringify(initial, null, 2), 'utf8');
  console.log(`  初始化: ${profilePath}`);
} else {
  console.log(`  已存在，跳过: ${profilePath}`);
}

console.log('\n骨架就绪。');
