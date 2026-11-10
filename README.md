# NOVA Launcher 🌌

An independent Minecraft Java launcher with a **NOVA-only cosmic logo** and a lavender-glass **Design #5** interface. This development branch retains the open-source Modrinth App launcher engine while replacing its visible UI and branding.

**Current development:** [`modrinth-design5`](https://github.com/Thatboer/NovaLauncher/tree/modrinth-design5)  
**Visual target:** [Design #5 reference and notes](docs/NOVA_DESIGN5_SPEC.md)

## NOVA Test 0.5: the branding cleanup

- **NOVA only**, no “SMP” in the logo or default launcher branding.
- Original purple galaxy logo now used on the Home screen, sidebar, titlebar and splash.
- The Windows build generates a matching NOVA-only executable/taskbar icon.
- The launcher's visible startup title, HTML title, window identity, and installer warning no longer display the upstream product name.
- The upstream ad service and consent popup are disabled in this Nova fork, and the default green theme is overridden with lavender and violet.
- **Servers are empty by default.** Users can add, edit, copy and remove their own Java server favorites; saved favorites aren't deleted.
- The existing Windows installer and Minecraft functionality require runtime testing after each build.

## Desktop builds

Visit the [GitHub Actions page](https://github.com/Thatboer/NovaLauncher/actions) and open the **NOVA Launcher Windows test installer** workflow. Download the latest successful workflow artifact and extract the ZIP to find the **unsigned test** `.exe`.

The installer has no digital signature. The app is not production-ready. Microsoft authentication, Minecraft game launching, updater behavior and the final screenshot fidelity require a real Windows test.

## Design

The six pages are **Home, Installations, Profiles, Mods, Servers, Settings**. The Cherry Grove background, purple glass, and controls are all Nova-owned. The code preserves upstream Minecraft install, account, and mod-resolution functionality. Some advanced upstream screens may still contain provider names, which must be audited before a stable release.

## Branches

- `modrinth-design5`: current Nova-branded Modrinth-engine rebuild.
- `main`: earlier Modrinth-based experimental installer, kept as a backup.
- `xmcl-rebuild`: separate XMCL experiment, kept for historical comparison.

## Credits and license

Based on the open-source [Modrinth App](https://github.com/modrinth/code) under its GPL-3.0 license. The fork must preserve applicable copyright and license notices and make the corresponding source code available. **NOVA is unofficial** and is not affiliated with Microsoft, Mojang Studios or Modrinth. Original Modrinth trademarks and branding are not part of NOVA.

