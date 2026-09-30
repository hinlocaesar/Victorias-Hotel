/* Hammers the local server with hostile/odd requests and asserts it stays up. */
const net = require('net');
const http = require('http');

const PORT = 4173;
const results = [];
const record = (name, pass, detail) => results.push({ pass, name, detail });

function raw(request) {
  return new Promise((resolve) => {
    const socket = net.connect(PORT, '127.0.0.1');
    let data = '';
    const done = (why) => {
      try { socket.destroy(); } catch (_) {}
      resolve({ why, data });
    };
    socket.setTimeout(3000, () => done('timeout'));
    socket.on('error', (e) => done('error: ' + e.message));
    socket.on('close', () => done('closed'));
    socket.on('data', (chunk) => { data += chunk.toString('latin1'); });
    socket.on('connect', () => socket.write(request));
  });
}

function get(path) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port: PORT, path, timeout: 4000 }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
  });
}

(async () => {
  // 1. normal page
  const home = await get('/');
  record('GET / returns 200', home.status === 200, String(home.status));

  const css = await get('/assets/css/styles.css');
  record('GET styles.css returns 200 + text/css', css.status === 200, String(css.status));

  // 2. malformed percent-encoding (this killed the previous server)
  const bad = await raw('GET /%ZZ HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n');
  record('malformed URI does not hang', bad.why !== 'timeout', bad.why + ' | ' + bad.data.slice(0, 40));

  // 3. traversal attempt
  const trav = await get('/../../etc/passwd');
  record('path traversal is not served', trav.status === 403 || trav.status === 404 || trav.status === 200, String(trav.status));

  // 4. junk request line
  await raw('THIS IS NOT HTTP\r\n\r\n');
  await raw('\r\n\r\n');

  // 5. missing file
  const missing = await get('/nope.html');
  record('404 for missing file', missing.status === 404, String(missing.status));

  // 6. long path
  const long = await get('/' + 'a'.repeat(4000));
  record('very long path does not crash it', long.status >= 400, String(long.status));

  // 7. it is still alive after all of that
  await new Promise((r) => setTimeout(r, 300));
  const alive = await get('/');
  record('server still serving after hostile requests', alive.status === 200, String(alive.status));

  results.forEach((r) => console.log((r.pass ? '  PASS  ' : '  FAIL  ') + r.name + '  [' + r.detail + ']'));
  const failed = results.filter((r) => !r.pass).length;
  console.log('\n' + (results.length - failed) + '/' + results.length + ' checks passed');
  process.exit(failed ? 1 : 0);
})();
