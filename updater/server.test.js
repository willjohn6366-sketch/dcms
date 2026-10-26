const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createUpdater } = require('./server');

function fixture(t, run) {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dcms-updater-'));
  t.after(() => fs.rmSync(projectDir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(projectDir, 'version.json'), JSON.stringify({ version: '0.0.3' }));
  const stateFile = path.join(projectDir, 'backend/data/update-status.json');
  return { projectDir, stateFile, updater: createUpdater({ projectDir, stateFile, run }) };
}

async function finished(updater) {
  for (let index = 0; index < 50; index++) {
    if (updater.status().status !== 'running') return updater.status();
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.fail('更新任务没有结束');
}

test('先拉取并完成构建，再重建应用；更新服务不中断，结果持久化', async (t) => {
  const calls = [];
  const { updater, stateFile, projectDir } = fixture(t, async (command, args, options) => {
    calls.push({ command, args, options });
    return { stdout: '' };
  });
  updater.start();
  const state = await finished(updater);
  assert.equal(state.status, 'succeeded');
  assert.equal(state.version, '0.0.3');
  assert.deepEqual(calls.map(({ command, args }) => [command, args.includes('pull'), args.includes('build'), args.includes('up')]), [
    ['git', false, false, false], ['git', false, false, false], ['git', true, false, false],
    ['docker', false, true, false], ['docker', false, false, true]
  ]);
  const up = calls[4];
  assert.ok(up.args.includes('--wait'));
  assert.ok(up.args.includes('--no-build'));
  assert.ok(up.args.includes('--force-recreate'));
  assert.ok(!up.args.includes('updater'));
  assert.equal(up.options.cwd, projectDir);
  assert.equal(up.options.env.DCMS_PROJECT_DIR, projectDir);
  assert.deepEqual(JSON.parse(fs.readFileSync(stateFile, 'utf8')), state);
});

test('源码有改动时拒绝拉取和重建', async (t) => {
  const calls = [];
  const { updater } = fixture(t, async (command, args) => {
    calls.push(command);
    return { stdout: args.includes('status') ? ' M version.json' : '' };
  });
  updater.start();
  assert.equal((await finished(updater)).status, 'failed');
  assert.match(updater.status().message, /未提交改动/);
  assert.deepEqual(calls, ['git', 'git']);
});

test('构建失败时保留原容器，显示失败信息，并允许重试', async (t) => {
  let fail = true;
  let upCalls = 0;
  const { updater } = fixture(t, async (command, args) => {
    if (command === 'docker' && args.includes('build') && fail) {
      throw Object.assign(new Error('build failed'), { stderr: '构建失败详情' });
    }
    if (args.includes('up')) upCalls++;
    return { stdout: '' };
  });
  updater.start();
  const first = await finished(updater);
  assert.equal(first.status, 'failed');
  assert.match(first.message, /构建失败详情/);
  assert.equal(upCalls, 0);
  fail = false;
  updater.start();
  assert.equal((await finished(updater)).status, 'succeeded');
  assert.equal(upCalls, 1);
});

test('重复点击只启动一个任务', async (t) => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  let checks = 0;
  const { updater } = fixture(t, async () => {
    checks++;
    await gate;
    return { stdout: '' };
  });
  const first = updater.start();
  const second = updater.start();
  assert.equal(first.id, second.id);
  assert.equal(checks, 1);
  release();
  assert.equal((await finished(updater)).status, 'succeeded');
  assert.equal(checks, 5);
});

test('重建失败不会误报成功', async (t) => {
  const { updater } = fixture(t, async (command, args) => {
    if (args.includes('up')) throw new Error('容器未通过健康检查');
    return { stdout: '' };
  });
  updater.start();
  assert.equal((await finished(updater)).status, 'failed');
  assert.match(updater.status().message, /健康检查/);
});

test('更新服务重启后恢复结果，将未完成的任务标记为中断', (t) => {
  const { projectDir, stateFile } = fixture(t, async () => ({ stdout: '' }));
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify({ id: 'old-job', status: 'running' }));
  const restarted = createUpdater({ projectDir, stateFile });
  assert.equal(restarted.status().status, 'failed');
  assert.match(restarted.status().message, /中断/);
  assert.equal(restarted.status().id, 'old-job');
});
