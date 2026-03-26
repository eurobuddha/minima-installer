const { execSync } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';

function checkCommand(cmd) {
  try {
    const findCmd = isWindows ? `where ${cmd}` : `which ${cmd}`;
    const result = execSync(findCmd, { encoding: 'utf8' }).trim();
    // `where` on Windows can return multiple lines; take the first
    const firstPath = result.split(/\r?\n/)[0];
    return { available: true, path: firstPath };
  } catch {
    return { available: false, path: null };
  }
}

function getJavaVersion(javaPath) {
  try {
    const output = execSync(`"${javaPath}" -version 2>&1`, { encoding: 'utf8' });
    const match = output.match(/version "([^"]+)"/);
    return match ? match[1] : 'unknown';
  } catch {
    return null;
  }
}

function runPreflight() {
  const java = checkCommand('java');

  if (java.available) {
    java.version = getJavaVersion(java.path);
  }

  if (isWindows) {
    // Windows doesn't need tmux — runs in a separate cmd window
    return {
      ready: java.available,
      java: {
        ...java,
        hint: java.available
          ? null
          : 'Install Java from https://adoptium.net — download the Windows .msi installer'
      },
      tmux: {
        available: true,
        path: null,
        hint: null,
        notNeeded: true
      }
    };
  }

  // macOS / Linux — needs tmux
  const tmux = checkCommand('tmux');

  return {
    ready: java.available && tmux.available,
    java: {
      ...java,
      hint: java.available
        ? null
        : 'Install Java: brew install openjdk or download from https://adoptium.net'
    },
    tmux: {
      ...tmux,
      hint: tmux.available
        ? null
        : 'Install tmux: brew install tmux'
    }
  };
}

module.exports = { runPreflight, isWindows };
