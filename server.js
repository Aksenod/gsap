const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const defaultFile = 'app.html';
const port = process.env.PORT ? Number(process.env.PORT) : 4173;

const args = new Set(process.argv.slice(2));
if (args.has('--check')) {
  console.log('Static server ready. Run `node server.js` or `npm start` to serve the prototype.');
  process.exit(0);
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname === '/') {
    pathname = `/${defaultFile}`;
  }

  const safePath = path.normalize(path.join(root, pathname));
  if (!safePath.startsWith(root)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Доступ запрещён.');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Файл не найден.');
      return;
    }

    const filePath = stats.isDirectory() ? path.join(safePath, defaultFile) : safePath;

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Внутренняя ошибка сервера.');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store'
      });
      res.end(data);
    });
  });
});

server.listen(port, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${port}`);
});
