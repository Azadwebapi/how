const $ = id => document.getElementById(id);

$('btn').addEventListener('click', start);
$('url').addEventListener('keypress', e => { if (e.key === 'Enter') start(); });

async function start() {
  const url = $('url').value.trim();
  const reason = $('reason').value;
  if (!url) return alert('Please enter a URL');

  $('btn').disabled = true;
  $('logCard').style.display = 'block';
  $('resultCard').style.display = 'none';
  $('term').innerHTML = '';
  $('fill').style.width = '0%';
  $('pct').innerText = '0%';

  try {
    const r = await fetch('/api/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, reason })
    });
    const d = await r.json();
    if (d.error) { alert(d.error); $('btn').disabled = false; return; }
    poll(d.jobId);
  } catch (e) {
    alert('Error: ' + e.message);
    $('btn').disabled = false;
  }
}

async function poll(id) {
  const t = setInterval(async () => {
    try {
      const r = await fetch('/api/status/' + id);
      const j = await r.json();

      $('term').innerHTML = j.logs.map(l =>
        `<div class="${l.lvl}">[${l.t}] ${esc(l.m)}</div>`
      ).join('');
      $('term').scrollTop = $('term').scrollHeight;
      $('fill').style.width = j.progress + '%';
      $('pct').innerText = j.progress + '%';

      if (j.status === 'success' || j.status === 'error') {
        clearInterval(t);
        showResult(j);
        $('btn').disabled = false;
        loadStats();
      }
    } catch { clearInterval(t); }
  }, 800);
}

function showResult(j) {
  $('resultCard').style.display = 'block';
  const b = $('rBadge'), body = $('rBody');

  if (j.status === 'success') {
    b.className = 'rBadge success';
    b.innerText = '✅ Report Link Ready';
    body.innerHTML = `
      <p style="font-size:13px;color:#999;margin-bottom:10px;">${esc(j.result.note)}</p>
      <a href="${j.result.links.profile}" target="_blank">🔗 Open Facebook Profile</a>
      <a href="${j.result.links.help}" target="_blank">📖 Facebook Help Center</a>
      <a href="${j.result.links.inbox}" target="_blank">📥 Support Inbox</a>
    `;
  } else {
    b.className = 'rBadge error';
    b.innerText = '❌ Failed';
    body.innerHTML = `<p style="color:#f87171">${esc(j.result.message)}</p>`;
  }
}

async function loadStats() {
  try {
    const r = await fetch('/api/stats');
    const s = await r.json();
    $('sTotal').innerText = s.total;
    $('sSuccess').innerText = s.success;
    $('sFailed').innerText = s.failed;
  } catch {}
}

function esc(t) {
  return String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

loadStats();
setInterval(loadStats, 10000);
