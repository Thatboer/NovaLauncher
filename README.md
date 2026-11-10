# Nova Launcher 🌸

A custom Minecraft Java launcher interface based on the open-source Modrinth App.

## Current status
**Windows CI installer builds succeed, but account login, Minecraft launching, update behavior and final UI are not yet verified on Windows.**

- Design direction: approved #5, soft lavender glass with cherry grove.
- Six Nova UI screens: Home, Installations, Profiles, Mods, Servers, Settings.
- NovaSMP is permanently featured as `novasmp.gg` in the Servers page. Other servers can be added, edited, removed and saved locally. Minecraft `servers.dat` synchronization is not implemented yet.
- The Play action connects to Modrinth's existing game launcher API.
- Mods, Modpacks, Shaders and Resource Packs now browse using Nova UI and real Modrinth search results. For mods, shaders and resource packs, installation requests go to the existing backend dependency resolver; Windows runtime testing is still needed.
- Microsoft authentication is reused from upstream but **has not been tested for this fork**.
- Original Nova icons are generated as part of the Windows build.
- Current Home scene uses a sharp AVIF cherry-grove illustration. It still does **not** match every detail of approved Design #5, especially the lake and portal.

## Building without installing developer tools
GitHub Actions' **Nova Launcher Windows test installer** workflow (manual `workflow_dispatch`) and GitLab's legacy `.gitlab-ci.yml` build from these repository files. It checks out the pinned upstream Modrinth commit, applies \`nova/apply.mjs\`, and attempts to produce an unsigned Windows NSIS installer.

**Do not upload a ZIP.** The full Nova overlay is now tracked directly in the \`nova/\` folder.

The build is available under **Build → Pipelines**. If GitLab refuses to create any jobs and requests **identity verification**, only the GitLab account owner can complete that requirement; see the banner in GitLab.

## Source and attribution
Upstream Modrinth repository: https://github.com/modrinth/code

Upstream source revision: \`f73010ae0809813120a16b733a3d0bfd23f76e24\`

The Modrinth App is licensed under GPL-3.0-only. Distributing a modified Nova application requires complying with that license and making the corresponding modified source available.

**Not ready for public distribution:** Windows build verification, licensed background screenshots, Minecraft account authentication, Minecraft launching, full replacement of upstream secondary pages, and Nova-specific updater/signing are not yet complete.

## Nova sources
- \`nova/NovaPage.vue\`: six primary screens and functional hooks
- \`nova/NovaSidebar.vue\`: custom navigation
- \`nova/nova-theme.css\`: reusable glassmorphism styles
- \`nova/cherry-placeholder.svg\`: temporary illustrated scene
- \`nova/apply.mjs\`: non-destructive overlay onto pinned Modrinth source
- \`nova/generate_icon.py\`: original Nova Windows icons
- \`nova/build-windows.ps1\`: Windows CI build script

This project is unofficial and is not affiliated with Mojang or Microsoft.

## GitHub Actions migration (Thatboer)

- Source mirror target: https://github.com/Thatboer/NovaLauncher (create the repository before migration).
- Build workflow: `.github/workflows/windows-test.yml` (manual only, no push builds).
- Open **Actions → Nova Launcher Windows test installer → Run workflow** to start one Windows build after repository migration.
- Successful job artifacts contain an **unsigned test** `.exe` and its SHA256 checksum. They are not a production release.
- The original GitLab project (https://gitlab.com/novasmp1/novalauncher) remains a backup and historical CI reference.
- The source migration does not migrate GitLab pipeline history or earlier installer artifacts automatically.

## Latest changes: UI test 0.3

- Nova-branded N logo replaces the placeholder star on Home, sidebar and title bar.
- Official NovaSMP server stays pinned and cannot be removed from the Servers page.
- User-favorite Java servers persist locally through launcher restarts, with Add / Edit / Remove / Copy controls.
- Mods browsing uses original Nova views rather than routing into the upstream Browse and Project screens. Mod installation requests use the upstream dependency resolver. A resolved install plan launches an asynchronous background transfer, so Nova reports **started**, not **completed**, until event integration is added.
- Windows runtime validation, Minecraft in-game server-list synchronization, complete Design #5 imagery, modpack creation and update/signing are still pending.
