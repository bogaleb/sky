#!/usr/bin/env node
// Verify the Supabase migrations against a real, throwaway Postgres.
//
//   DATABASE_URL=postgres://postgres@localhost:54329/postgres pnpm db:verify
//
// Steps: create a fresh database -> load supabase/tests/supabase_stub.sql ->
// apply every migration in order -> re-apply every migration from
// IDEMPOTENT_FROM onward (those are documented as safe to re-run, because
// they were pasted into the SQL editor by hand) -> run every
// supabase/tests/*.test.sql file. Any SQL error
// fails the run. Needs `psql` on PATH. Never point this at production: it
// creates and drops its own database next to the one in DATABASE_URL.

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) {
  console.error('Set DATABASE_URL to a local Postgres (e.g. postgres://postgres@localhost:5432/postgres).');
  process.exit(2);
}

const dbName = `sky_verify_${process.pid}`;
const url = new URL(baseUrl);
const adminUrl = url.toString();
url.pathname = `/${dbName}`;
const testUrl = url.toString();

function psql(target, args, label) {
  const res = spawnSync('psql', [target, '-X', '-q', '-v', 'ON_ERROR_STOP=1', ...args], {
    encoding: 'utf8',
  });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    console.error(`FAIL ${label}\n${res.stdout}\n${res.stderr}`);
    return false;
  }
  if (res.stdout.trim()) console.log(res.stdout.trim());
  return true;
}

const migDir = join(root, 'supabase', 'migrations');
const testDir = join(root, 'supabase', 'tests');
const migrations = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort();
// Migrations from this prefix onward must be safe to run twice.
const IDEMPOTENT_FROM = '20260925';
const tests = readdirSync(testDir).filter((f) => f.endsWith('.test.sql')).sort();

let ok = psql(adminUrl, ['-c', `create database ${dbName}`], 'create database');
try {
  ok = ok && psql(testUrl, ['-f', join(testDir, 'supabase_stub.sql')], 'supabase stub');
  for (const pass of [1, 2]) {
    const batch = pass === 1 ? migrations : migrations.filter((f) => f >= IDEMPOTENT_FROM);
    for (const f of batch) {
      if (!ok) break;
      ok = psql(testUrl, ['-f', join(migDir, f)], `migration ${f} (pass ${pass})`);
    }
    if (ok) console.log(`ok   ${batch.length} migrations applied (pass ${pass})`);
  }
  for (const f of tests) {
    if (!ok) break;
    ok = psql(testUrl, ['-f', join(testDir, f)], `test ${f}`);
    if (ok) console.log(`ok   ${f}`);
  }
} finally {
  psql(adminUrl, ['-c', `drop database if exists ${dbName} with (force)`], 'drop database');
}
process.exit(ok ? 0 : 1);
