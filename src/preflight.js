const { execSync } = require('child_process');

function checkCommand(cmd) {
  try {
    const path = execSync(`which ${cmd}`, { encoding: 'utf8' }).trim();
    return { available: true, path };
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
  const tmux = checkCommand('tmux');

  if (java.available) {
    java.version = getJavaVersion(java.path);
  }

  const allGood = java.available && tmux.available;

  return {
    ready: allGood,
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

module.exports = { runPreflight };
