# Nova Launcher v2 🌸

An independent Minecraft Java Edition desktop launcher, under active development, built on the open-source **X Minecraft Launcher (XMCL)** engine.

> **Current branch:** `xmcl-rebuild`. The old Modrinth-based Nova Launcher is preserved in `main` as a working backup. These are separate implementations.

## Target design

The approved **Nova Design #5** is the visual contract: cherry-grove lake and portal scenery, lavender glass, pink-purple Play button, original Nova branding and six consistent pages. See `docs/NOVA_DESIGN5_SPEC.md`.

- **Home:** original Nova shell, real installed instances and XMCL launch controller
- **Installations:** real installed Minecraft Java versions, search, loader filtering and create dialog
- **Profiles:** real XMCL Microsoft authentication and account manager, with Nova layout
- **Mods:** real Modrinth catalog search. Direct install is **not yet integrated** in this new engine.
- **Servers:** permanent NovaSMP (`novasmp.gg`) plus persistent local favorites. Does **not yet** merge `servers.dat` or implement one-click joining.
- **Settings:** real saved glass opacity, About/Credits; advanced game memory/Java controls still to be integrated.

This is not production-ready. The first XMCL-v2 renderer compiled successfully on GitHub Actions. The Windows x64 unsigned preview workflow is separate; its build outcome and actual Minecraft launch/authentication must be tested before claiming they work.

## Source layout

- `xmcl/NovaShell.vue`: six native Nova screens and XMCL engine integration
- `xmcl/nova.css`: original lavender/pink frosted-glass styling
- `xmcl/apply.mjs`: non-destructive renderer overlay onto pinned upstream source
- `xmcl/prepare-windows.mjs`: isolated Nova app identity, no XMCL publishing or auto-update behavior
- `xmcl/generate_windows_icons.py`: original purple Nova icon art for Windows
- `.github/workflows/xmcl-renderer.yml`: Linux Vue/TypeScript + renderer verification
- `.github/workflows/xmcl-windows.yml`: Windows x64 portable unsigned ZIP preview

Builds fetch XMCL at the **exact pinned commit**
`4aee50aaf1cb7ee741ba995c87017f4dbe85584e`.
Do not automatically switch to upstream latest without rechecking compatibility.

## Build/verification

The GitHub Actions tab provides two workflows. The Windows artifact is a **portable ZIP preview**, not a signed installer. A renderer-only artifact cannot be launched as a Windows app.

Before sharing publicly: verify all six screens, Minecraft account login, instance creation, Java installation and launch, no hidden XMCL/Modrinth styling, update isolation, Windows startup and app data isolation. Use only a properly licensed background asset matching Design #5. Existing cherry-grove art is not yet the exact lake/portal composition.

## Licensing and upstream credit

XMCL source and libraries are maintained by the [Voxelum project](https://github.com/Voxelum/x-minecraft-launcher) under the **MIT license**. The fetched original repository includes its `LICENSE` and copyright notices, which must be retained when distributing the modified application. The Modrinth catalog API is used as a content provider; it is not the launcher base.

Nova Launcher is unofficial and not affiliated with Mojang Studios, Microsoft, XMCL or Modrinth.
