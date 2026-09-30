/* Minimal static file server — zero dependencies.
   Survives malformed URLs, aborted sockets and scanner traffic. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = process.env.PORT || 4173;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, status, body, type) {
  if (res.writableEnded || res.destroyed) return;
  try {
    res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8' });
    res.end(body);
  } catch (_) {
    /* headers already sent or socket gone — nothing to do */
  }
}

const server = http.createServer((req, res) => {
  res.on('error', () => {}); // client vanished mid-response

  try {
    let urlPath;
    try {
      urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    } catch (err) {
      // malformed percent-encoding (e.g. "/%ZZ") — just serve the root
      urlPath = '/';
    }
    if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
    if (urlPath.endsWith('/')) urlPath += 'index.html';

    const filePath = path.join(root, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));
    if (!filePath.startsWith(root)) {
      send(res, 403, 'Forbidden');
      return;
    }

    fs.stat(filePath, (statErr, stat) => {
      if (statErr || !stat.isFile()) {
        send(res, 404, '<h1>404</h1><p>Not found: ' + urlPath.replace(/[<>&]/g, '') + '</p>', types['.html']);
        return;
      }
      fs.readFile(filePath, (readErr, buf) => {
        if (readErr) {
          send(res, 500, 'Server error');
          return;
        }
        send(res, 200, buf, types[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
      });
    });
  } catch (err) {
    send(res, 500, 'Server error');
  }
});

server.on('clientError', (err, socket) => {
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.on('error', (err) => {
  console.error('server error:', err.message);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('uncaught (kept alive):', err.message);
});
process.on('unhandledRejection', (err) => {
  console.error('unhandled rejection (kept alive):', err && err.message);
});

server.listen(port, () => {
  console.log('Victorias Hotel running at http://localhost:' + port);
});
