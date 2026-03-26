const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const { runPreflight } = require('./preflight');
const { install } = require('./installer');

function startServer(port) {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/preflight', (req, res) => {
    const result = runPreflight();
    res.json(result);
  });

  app.post('/api/install', (req, res) => {
    const config = req.body;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    function sendEvent(type, data) {
      res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    }

    install(config, sendEvent)
      .then(() => {
        // Give client time to process the complete event, then open MDS + control panel
        setTimeout(async () => {
          const homeDir = process.env.HOME;
          const mdsPort = (parseInt(config.port) || 9001) + 2;
          const controlPanel = path.join(homeDir, 'minima-installer', 'Minima.command');

          try {
            const open = (await import('open')).default;
            await open(`https://localhost:${mdsPort}`);
          } catch {}

          try {
            execSync(`open "${controlPanel}"`);
          } catch {}

          console.log('\nInstallation complete. Shutting down wizard...');
          process.exit(0);
        }, 3000);
      })
      .catch((err) => {
        sendEvent('error', err.message);
      });
  });

  const server = app.listen(port, async () => {
    const url = `http://localhost:${port}`;
    console.log(`\n  Minima Installer running at ${url}\n`);

    try {
      const open = (await import('open')).default;
      await open(url);
    } catch {
      console.log(`  Open ${url} in your browser to continue.\n`);
    }
  });

  return server;
}

module.exports = { startServer };
