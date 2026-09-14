# system-monitor

A small Electron desktop app that shows live CPU, memory and battery stats. It sits in the system tray, warns you when memory runs high, and logs power events such as sleep, wake and lock.

Built as an in-class project to practise Electron's desktop APIs, multiple processes, IPC and system-level features.

## Features

- Live CPU usage with a 60-second history chart
- Memory usage in GB and percent
- Battery level and whether the machine is plugged in
- Tray icon with a live tooltip (and the CPU percentage in the menu bar on macOS)
- Closing the window hides the app to the tray, and Quit lives in the tray menu
- Desktop notification when memory goes above a limit you set with a slider (at most one per minute)
- Event log for sleep, resume, lock, unlock, and switching between AC and battery

## Run it

You need Node.js and npm.

```bash
npm install
npm start
```

## How it works

The main process samples the OS every second and pushes the numbers to the window. The window never touches Node directly: a preload script exposes a small API through `contextBridge`, with context isolation on.

| Channel | Direction | Purpose |
| --- | --- | --- |
| `stats:update` | main to window | CPU, memory and power source, once per second |
| `power:event` | main to window | Sleep, resume, lock, unlock, AC or battery changes |
| `system:info` | window asks main | Hostname, OS, CPU model, core count, current alert limit |
| `alerts:set-threshold` | window asks main | Sets the memory alert limit (1 to 100 percent) |

Electron APIs used: `BrowserWindow`, `Tray`, `Menu`, `Notification`, `powerMonitor`, `ipcMain` and `contextBridge`.

## Project layout

```text
main.js            main process: polling, tray, notifications, IPC handlers
preload.js         the API exposed to the window
renderer/          the UI (index.html, styles.css, renderer.js)
```

## Notes

- Battery percentage comes from Chromium's `navigator.getBattery()` in the window, because Electron's main process has no battery level API. Desktops without a battery show `n/a`.
- The tray icon is a plain colored square drawn in code. Replace it with a PNG for a real icon.
