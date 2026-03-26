# Minima Installer

The easiest way to run a [Minima](https://minima.global) node on your computer.

One command. No technical knowledge needed. Works on Mac and Windows.

---

## Install

### Mac

Open **Terminal** (search "Terminal" in Spotlight) and paste this:

```
curl -sL https://raw.githubusercontent.com/eurobuddha/minima-installer/main/setup-minima.command | bash
```

Press Enter. A setup wizard will open in your browser. Follow the steps.

### Windows

Open **Command Prompt** (search "cmd" in the Start menu) and paste this:

```cmd
curl -o %TEMP%\setup-minima.bat https://raw.githubusercontent.com/eurobuddha/minima-installer/main/setup-minima.bat && %TEMP%\setup-minima.bat
```

Press Enter. A setup wizard will open in your browser. Follow the steps.

---

## What happens

1. Any missing software (Java, Node.js) gets installed automatically
2. A setup wizard opens in your browser — pick your settings and click **Install Minima**
3. Minima starts running in the background
4. A **Minima** app/shortcut appears on your Desktop — use it to start, stop, and manage your node

That's it. Your node is running.

---

## Managing your node

Double-click **Minima** on your Desktop to open the control panel:

```
  ● Minima Node
  ─────────────────────────────────

  Status: ● Running (port 9001)

  1) Start node
  2) Stop node
  3) Restart node
  4) View node
  5) Open MDS Hub in browser
  6) Exit
```

---

## Settings

The wizard lets you choose:

| Setting | Default | What it means |
|---------|---------|---------------|
| Port | 9001 | The port Minima runs on |
| MDS Password | — | Your password to access the MiniDapp hub |
| Desktop Mode | On | Best for home computers |
| Auto-start on login | Off | Start Minima when your computer boots |

There are also advanced settings for power users (archive mode, MegaMMR, RPC, etc).

---

## Uninstall

**Mac:**
```
rm -rf ~/minima-installer ~/Desktop/Minima.app ~/.minima-installer-tool
```

**Windows:**
```cmd
rmdir /s /q %USERPROFILE%\minima-installer %USERPROFILE%\.minima-installer-tool
del %USERPROFILE%\Desktop\Minima.bat
```

---

## License

MIT
