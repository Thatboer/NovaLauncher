<div align="center">

<img src="assets/landing/nova-banner.svg" alt="Nova Launcher: Your Minecraft. Your worlds. Your way." width="100%" />

<br />

<a href="https://github.com/Thatboer/NovaLauncher/releases/download/v2.0.0-preview.1/NovaLauncher-v2.0.0-preview.1-Windows-x64.zip"><img src="assets/landing/download-windows.svg" alt="Download Nova Launcher Windows preview" width="330" /></a>
&nbsp;
<a href="https://github.com/Thatboer/NovaLauncher/tree/xmcl-rebuild"><img src="assets/landing/view-source.svg" alt="View Nova v2 source code" width="226" /></a>

<br /><br />

[![Windows preview build](https://github.com/Thatboer/NovaLauncher/actions/workflows/xmcl-windows.yml/badge.svg?branch=xmcl-rebuild)](https://github.com/Thatboer/NovaLauncher/actions/workflows/xmcl-windows.yml)
![Windows x64](https://img.shields.io/badge/Windows-x64-B888F3?style=flat-square)
![Preview](https://img.shields.io/badge/Release-Experimental%20Preview-C181E9?style=flat-square)
![XMCL engine](https://img.shields.io/badge/Engine-XMCL-8C67C8?style=flat-square)

**A new way to launch Minecraft Java Edition.** 🌸

*Lavender glass • Cherry-grove atmosphere • Your worlds, all in one place*

</div>

> [!IMPORTANT]
> **Early preview, not a finished launcher.** The Windows build compiles successfully, but Microsoft sign-in, Minecraft installation, multiplayer joining, and launching the game are **not yet verified on a Windows PC**. Download for testing, not as a replacement for a working launcher.

## ✨ Meet Nova Launcher

Nova Launcher is an independent Minecraft Java launcher being rebuilt with a fully original **Design #5** interface. Think soft purple glass, cherry blossoms, an uncluttered home screen, and a big glowing Play button.

Unlike our earlier prototype, **Nova v2 runs on the open-source [X Minecraft Launcher (XMCL)](https://github.com/Voxelum/x-minecraft-launcher) engine** rather than the Modrinth App frontend. We use XMCL's installation, account, and game-launching systems while building Nova's own six-page interface.

<table>
<tr><td width="50%" valign="top">

### 🌸 Your space, your style
A lavender-glass interface with a cherry-grove atmosphere, Nova branding and an easy-to-find Play button.

</td><td width="50%" valign="top">

### 🎮 Minecraft installations
Select your Minecraft Java profile, create new installations and organize Vanilla or modded versions.

</td></tr>
<tr><td valign="top">

### 🧩 Discover Minecraft content
Browse real mods, shaders and modpacks. Direct installation into XMCL is **still in development**.

</td><td valign="top">

### 🌌 NovaSMP built in
NovaSMP is permanently featured with Java address `novasmp.gg`. Other servers can be saved as favorites.

</td></tr>
</table>

## 💜 Download for Windows

<div align="center">

<a href="https://github.com/Thatboer/NovaLauncher/releases/download/v2.0.0-preview.1/NovaLauncher-v2.0.0-preview.1-Windows-x64.zip"><img src="assets/landing/download-windows.svg" alt="Download Nova Launcher Windows x64 preview" width="330" /></a>

**[See the release notes](https://github.com/Thatboer/NovaLauncher/releases/tag/v2.0.0-preview.1)** · **[All releases](https://github.com/Thatboer/NovaLauncher/releases)**

</div>

This preview is a **Windows x64 portable ZIP**, approximately **136 MiB**. It is not an installer and is not digitally signed.

1. Click **Download for Windows** above.
2. Extract the entire ZIP to a folder of your choice.
3. Open **`Nova Launcher.exe`** from the extracted folder.
4. Treat it as an experimental build. Back up important Minecraft worlds before testing.

> [!NOTE]
> You do **not** need to log into GitHub to download the ZIP from Releases. Windows might show a publisher warning because this experimental build is unsigned. The build does not prove that Minecraft login or launching works yet.

## 🪄 Six pages, one launcher

| Page | What's inside |
| --- | --- |
| **🏠 Home** | Nova-themed dashboard, installation selector and Play control |
| **📦 Installations** | Real Java instances, search, version details and create flow |
| **👤 Profiles** | Microsoft account integration through XMCL |
| **🧩 Mods** | Nova-styled discovery powered by Minecraft content catalogs |
| **🌌 Servers** | Permanent NovaSMP shortcut and locally saved server favorites |
| **⚙️ Settings** | Theme and glass appearance controls, with more features planned |

## 🛠️ Development progress

- [x] Original Nova six-page shell
- [x] XMCL-based engine, separated from the old prototype
- [x] Lavender-glass theme and Nova Windows icon
- [x] Windows x64 portable preview built on GitHub Actions
- [x] Stable GitHub Release download
- [x] NovaSMP permanently displayed in Servers
- [ ] Confirm Microsoft authentication and game launch on Windows
- [ ] Direct mod installation and installed-mod management
- [ ] One-click multiplayer joining and `servers.dat` synchronization
- [ ] Perfect Design #5 scenery, including lake and Nether portal
- [ ] Final settings, updater, signing and installer

## 👩‍💻 Source code and branches

| Branch | Purpose |
| --- | --- |
| [`xmcl-rebuild`](https://github.com/Thatboer/NovaLauncher/tree/xmcl-rebuild) | **Current Nova v2 development**, using XMCL |
| [`main`](https://github.com/Thatboer/NovaLauncher/tree/main) | Preserved earlier Modrinth-based Nova prototype |

[View current source](https://github.com/Thatboer/NovaLauncher/tree/xmcl-rebuild/xmcl) · [GitHub Actions builds](https://github.com/Thatboer/NovaLauncher/actions) · [Design #5 notes](https://github.com/Thatboer/NovaLauncher/blob/xmcl-rebuild/docs/NOVA_DESIGN5_SPEC.md) · [Report a problem](https://github.com/Thatboer/NovaLauncher/issues)

## 📜 Credits and licensing

Nova Launcher v2 is based on **[X Minecraft Launcher](https://github.com/Voxelum/x-minecraft-launcher)**, licensed under MIT. The source and downloadable Windows preview retain upstream attribution and license information. We also use third-party Minecraft content catalogs, including Modrinth, for search results.

The earlier prototype under `main` uses the Modrinth App (GPL-3.0-only) and remains separate from the XMCL-based rebuild.

**Nova Launcher is unofficial** and is not affiliated with Mojang Studios, Microsoft, XMCL or Modrinth.

<div align="center">

**Made for Minecraft adventures. Built around Nova.** 🌸

<a href="#-download-for-windows">Back to the download</a> · <a href="https://web.novasmp.gg">NovaSMP website</a>

</div>
