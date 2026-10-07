const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const jobs = {};
const history = [];

function parseFB(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('facebook.com') && !u.hostname.includes('fb.com')) {
      return { ok: false, err: 'Not a Facebook URL' };
    }
    const p = u.pathname.split('/').filter(Boolean);
    return { ok: true, id: p[1] || p[0] || 'unknown' };
  } catch {
    return { ok: false, err: 'Invalid URL format' };
  }
}

app.post('/api/start', (req, res) => {
  const { url, reason } = req.body;
  const parsed = parseFB(url);
  if (!parsed.ok) return res.status(400).json({ error: parsed.err });

  const jobId = 'j_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

  jobs[jobId] = {
    id: jobId,
    url,
    fbId: parsed.id,
    reason: reason || 'Spam',
    status: 'running',
    progress: 0,
    logs: [],
    result: null
  };

  history.unshift({ jobId, url, fbId: parsed.id, reason, status: 'running', time: new Date() });
  if (history.length > 100) history.pop();

  runJob(jobId);
  res.json({ jobId });
});

async function runJob(jobId) {
  const job = jobs[jobId];
  const log = (m, lvl = 'info') => job.logs.push({ t: new Date().toLocaleTimeString(), m, lvl });
  const wait = ms => new Promise(r => setTimeout(r, ms));

  log(`Verifying URL...`);                 job.progress = 8;   await wait(600);
  log(`Facebook ID: ${job.fbId}`);          job.progress = 20;  await wait(600);
  log(`Category: ${job.reason}`);           job.progress = 35;  await wait(600);
  log(`Generating report link...`);         job.progress = 55;  await wait(700);
  log(`Checking Help Center route...`);     job.progress = 72;  await wait(700);
  log(`Preparing report packet...`);        job.progress = 88;  await wait(600);
  log(`Report link ready!`, 'success');     job.progress = 100;

  job.status = 'success';
  job.result = {
    fbId: job.fbId,
    links: {
      profile: `https://www.facebook.com/${job.fbId}`,
      help: 'https://www.facebook.com/help/181495968648557',
      inbox: 'https://www.facebook.com/supportinbox'
    },
    note: 'Open the official Facebook page and click Report manually.'
  };

  const h = history.find(x => x.jobId === jobId);
  if (h) h.status = 'success';
}

app.get('/api/status/:id', (req, res) => {
  const j = jobs[req.params.id];
  if (!j) return res.status(404).json({ error: 'not found' });
  res.json(j);
});

app.get('/api/stats', (req, res) => {
  const total = history.length;
  const success = history.filter(x => x.status === 'success').length;
  res.json({ total, success, failed: total - success });
});

app.get('/api/recent', (req, res) => res.json(history.slice(0, 20)));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
