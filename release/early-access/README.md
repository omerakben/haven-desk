# Haven Desk early-access setup package

This folder contains pilot-friendly launchers for handpicked early-access users.

## Hosted one-line setup

After the GitHub Pages site is published from `omerakben/swiss-knife`, approved macOS pilots can run:

```bash
curl -fsSL https://omerakben.github.io/swiss-knife/install.sh | bash
```

Approved Windows pilots can run this in PowerShell:

```powershell
irm https://omerakben.github.io/swiss-knife/install.ps1 | iex
```

These commands download or update the repo into `~/HavenDesk`, run the same setup/start scripts,
and open `http://localhost:4141`.

## macOS

Double-click:

```text
Haven Desk Setup.command
```

If macOS blocks the file because it was downloaded from the internet, right-click it, choose Open, and confirm. If the file is not executable, run this once in Terminal from the repo root:

```bash
chmod +x "release/early-access/Haven Desk Setup.command"
```

## Windows

Double-click:

```text
Haven Desk Setup.cmd
```

The command wrapper runs `HavenDeskSetup.ps1` with a one-time execution-policy bypass for this script only.

## What the launcher does

1. Runs the existing Haven Desk setup command.
2. Starts the local stack.
3. Opens `http://localhost:4141`.

It does not create an online account, send email, process payments, or upload business data. It only starts the local app.
