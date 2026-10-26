const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { randomUUID } = require('node:crypto');

function createUpdater({ projectDir, stateFile, run = promisify(execFile) }) {
  let state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : { status: 'idle' };
  let running = false;

  function save(patch) {
    state = { ...state, ...patch };
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(`${stateFile}.tmp`, JSON.stringify(state));
    fs.renameSync(`${stateFile}.tmp`, stateFile);
  }

  if (state.status === 'running') {
    save({ status: 'failed', message: '更新服务曾中断，请重新检查更新。' });
  }

  async function update() {
    const options = { cwd: projectDir, timeout: 20 * 60 * 1000, maxBuffer: 8 * 1024 * 1024,
      env: { ...process.env, DCMS_PROJECT_DIR: projectDir, GIT_TERMINAL_PROMPT: '0' } };
    const git = (args) => run('git', ['-c', `safe.directory=${projectDir}`, ...args], { ...options, timeout: 60000 });
    const compose = (args) => run('docker', ['compose', '--project-directory', projectDir, ...args], options);
    const services = ['backend', 'pc-web', 'mobile-h5'];
    try {
      save({ message: '正在检查源码目录…' });
      await git(['rev-parse', '--is-inside-work-tree']);
      const changes = await git(['status', '--porcelain']);
      if (changes.stdout.trim()) throw new Error('服务器源码有未提交改动，请先处理后再更新。');
      save({ message: '正在拉取最新代码…' });
      await git(['pull', '--ff-only']);
      const version = JSON.parse(fs.readFileSync(path.join(projectDir, 'version.json'), 'utf8')).version;
      save({ message: '正在构建新版镜像，首次构建可能需要几分钟…', version });
      await compose(['build', ...services]);
      save({ message: '正在重建应用容器，页面可能短暂断开…' });
      await compose(['up', '-d', '--no-build', '--force-recreate', '--wait', '--wait-timeout', '180', ...services]);
      save({ status: 'succeeded', message: `v${version} 更新完成`, finishedAt: new Date().toISOString() });
    } catch (error) {
      const detail = [error.message, error.stderr, error.stdout].filter(Boolean).join('\n').slice(-6000);
      save({ status: 'failed', message: detail, finishedAt: new Date().toISOString() });
    } finally {
      running = false;
    }
  }

  return {
    status: () => state,
    start() {
      if (running) return state;
      running = true;
      state = {};
      save({ id: randomUUID(), status: 'running', message: '准备更新…', startedAt: new Date().toISOString() });
      void update();
      return state;
    }
  };
}

if (require.main === module) {
  const projectDir = process.env.PROJECT_DIR;
  if (!projectDir || !path.isAbsolute(projectDir)) throw new Error('PROJECT_DIR 必须是宿主机项目的绝对路径');
  const updater = createUpdater({ projectDir, stateFile: path.join(projectDir, 'backend/data/update-status.json') });
  http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'GET' && req.url === '/status') {
      res.end(JSON.stringify(updater.status()));
    } else if (req.method === 'POST' && req.url === '/update') {
      res.writeHead(202);
      res.end(JSON.stringify(updater.start()));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ message: 'Not found' }));
    }
  }).listen(6110, '0.0.0.0');
}

module.exports = { createUpdater };
