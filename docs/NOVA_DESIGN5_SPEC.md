# NOVA LAUNCHER — DESIGN #5 BUILD SPECIFICATION
Version: 1.0 (design contract) | Product: Windows Minecraft Java launcher

## Non-negotiable design rules
1. Treat the user-approved image named `nova_style5_home.png` as the visual source of truth. Its scene has cherry trees, warm lanterns, pink petals, lake reflections, distant mountains, and a Nether portal. The flat vector landscape currently in `nova/cherry-placeholder.svg` is a rejected placeholder, NOT the target.
2. All six primary views must be original Nova designs: **Home, Installations, Profiles, Mods, Servers, Settings**. No Modrinth-branded buttons, navigation, sidebar, page structures, or default-looking library/browse screens. The underlying open-source Modrinth engine and APIs may be used with proper GPL-3.0 compliance and attribution in About/Credits, not as visible Nova branding.
3. Frosted, semi-transparent lavender/pink panels over a real Minecraft cherry-grove scene. Maintain readable contrast against the photograph using local overlays; avoid giant opaque surfaces that hide the scenery.
4. Functional first: Play must launch the selected actual installation; mods must be real searchable/installable content; accounts must use legitimate Microsoft/Minecraft sign-in; servers and settings must save. Never fabricate install success, online statuses, or player counts.
5. Always include **NovaSMP**, featured and pinned in Servers, with an entry suitable for the Minecraft Java multiplayer server list. The default entry must survive restarts, account changes and upgrades without duplicating entries or deleting a user's other servers. Users can manage their other servers; they cannot permanently delete the NovaSMP featured entry.
6. This is a **Windows desktop app**, not a web-only mockup. A phone-friendly preview is helpful for design reviews but is not proof of in-game functionality.

## Visual system
- Canvas reference: 1440×900 desktop (scale proportionally down to 1280×720 and 1024×768). Preserve large background vista and the key hero cluster.
- Title bar: 40–44 px tall, translucent purple. Left contains custom Nova glyph + `Nova Launcher`; small subtitle `Minecraft Java Launcher`. Right contains native window controls.
- Sidebar: approx. 205–230 px wide. Left-aligned, soft blur/glass, darker gradient than the center. Nova logotype near top. Six vertically stacked icon+text entries with 48 px minimum hit height. Active entry is a light-lavender pill with a subtle white outline. Settings separated toward the bottom. On narrower windows, allow compact icons with tooltips.
- Background: use an original, explicitly licensed Minecraft gameplay screenshot matching the approved composition, *not* pixelated geometric illustration, a stretched mockup, or a generated substitute masquerading as gameplay. Crop with `cover` from center-right to preserve the portal, lake and cherry trees. Add gentle violet darkening where text appears.
- Palette: sidebar deep plum `#473052` with transparency; lavender glass `rgba(139,108,170,.42)`; highlight `#C69AEF`; vivid Play gradient `#C980FF → #9B4DFF`; white `#FFFFFF`; soft pink `#F7C5EB`. No neon sci-fi blue interface.
- Glass components: 16–20 px rounded corners, soft white 1 px border, modest shadow, backdrop blur approx. 16–24 px. Avoid dark solid cards.
- Typography: modern sans-serif (Inter or equivalent), clear hierarchy, sensible weight 600–750. Use a distinctive licensed Nova glyph, never copy Modrinth branding.
- Animation: short hover/focus transitions (120–200 ms), slight glow on Play, and respect reduced-motion preferences.
- Accessibility: keyboard navigation, focus rings, 44 px touch-sized targets where practical, contrast-preserving panel overlays, no information conveyed by color alone.

## 1. Home
**Composition:** panoramic cherry-grove scene uninterrupted by a long scrolling feed. Centered hero slightly above the vertical midpoint:
- Nova symbol approx. 100×100 above `Nova Launcher` headline. Subtitle `A sleek and modern way to play Minecraft.` below.
- Small decorative divider with Minecraft-inspired pixel/star mark.
- Main action row, desktop width roughly 650 px: a 340 px installation selector showing actual installation icon/name/game version/loader, then a 220 px glowing `▶ Play` button. Disabled Play shows why, and the blank state offers `+ Create installation`.
- Bottom three equal-width frosted cards labeled `Profiles`, `Mods`, `Servers`, each with icon, one-line description, and arrow. They navigate to their respective Nova views.
- Empty, downloading, ready, and launching states must be distinct and accurate. No imaginary `Minecraft 1.21.x` if none exists.

## 2. Installations
**Layout:** page title + `+ New installation` in top-right; below is a grid of broad two-column glass cards (one column when narrow).
- Card fields: actual icon, installation name, version, loader badge (Vanilla/Fabric/Forge/NeoForge/Quilt if supported), installation/update status, last played when available.
- Actions: `Play`, `Manage`, overflow menu `Edit / Duplicate / Open folder / Delete`. Delete requires confirmation and must respect upstream game-data safeguards.
- Create flow: choose Minecraft version, loader, profile name, icon and folder settings, then install with progress/error reporting. No hard-coded placeholder versions.

## 3. Profiles
**Layout:** two major panes: account identity and game profiles.
- Left: Minecraft account identity, head/avatar, username, Microsoft sign-in status and `Add / Switch / Sign out` actions using the existing secure upstream login flow.
- Right: saved launcher profiles linked to installations, default-profile picker, profile name, icon, preferred installation and `Edit`.
- Account/profile empty states and authentication failures must have clear non-deceptive messages; never ask users for Microsoft passwords inside the Nova UI.

## 4. Mods
**Layout:** header + prominent glass search bar, then tabs `Mods | Modpacks | Shaders | Resource Packs`. Desktop: filter rail approx. 230 px; content: 2–3 columns of modern horizontal glass cards.
- Filtering: Minecraft version, loader, category, client/server compatibility and sort order (where the API supports them). Queries and pagination must use the real Modrinth APIs with attribution in About/Credits.
- Card: genuine icon, title, author, concise description, download count, compatibility labels, `View` and `Install` actions.
- Details view stays in Nova styling: screenshots/gallery, markdown description, versions/changelog, dependencies and install-version selection.
- Install to the chosen real instance with compatibility checks and visible progress. No decorative non-working install buttons.

## 5. Servers
**Layout:** full-width featured **NovaSMP** glass banner at top, then `My Servers` grid/list underneath.
- NovaSMP banner: brand mark, `Featured • Pinned`, short community description, verified Java address with copy button, `Join` when supported, and `Website` linking to `https://web.novasmp.gg`. Discord action only when its official invite URL has been verified.
- Server status: probe current status asynchronously; show `Online` / `Offline` / `Status unavailable` and genuine player count only when data exists. Don't invent it.
- Persistence: NovaSMP is an immutable bundled default in the Nova UI and is also idempotently inserted into Minecraft's multiplayer server list (`servers.dat`) for each applicable installation only when implementation can safely read/merge it. Backup before modifications; preserve all other servers, settings, favorites, and file ordering. Do not overwrite a user's existing entry for the same address or create duplicates.
- `My Servers`: Add, Edit, Remove, Copy address and Join actions for the user's own entries. NovaSMP is pinned above these entries and may not be removed.
- Address must be resolved and verified with the project owner before shipping, rather than guessing from a VPS address.

## 6. Settings
**Layout:** left category navigation or horizontal tabs; right-side grouped glass setting panels.
- Categories: `General` (startup behavior/downloads), `Minecraft` (Java executable, RAM, game folders), `Appearance` (theme and background preferences, motion), `Accounts` (account management), `Updates` (Nova app updates), `About & Credits`.
- Every control reads and writes real persistent app configuration. Validate RAM limits against the system and clearly show restart-required states. Defaults must not silently override existing Modrinth-derived settings during migration.
- About/Credits: GPL source attribution and upstream licensing, link to Nova source and third-party notices; distinguish official Minecraft/Modrinth products from the unofficial Nova launcher.

## Quality gates and acceptance tests
1. Fresh install boots directly into Nova Home, not upstream Modrinth home or onboarding library.
2. On every primary page, the custom Nova sidebar, typography, cards and backdrop are visible. No upstream-style page leaks.
3. The release background visually matches the approved cherry-grove scene and is properly licensed. The flat geometric placeholder is absent.
4. Create installation → install → Play → game launches using a legitimately authenticated Minecraft account (actual Windows functional test).
5. Mods browse/search/detail/install work with real data and dependencies; uninstall preserves game files as intended.
6. NovaSMP is present on the Servers screen on fresh boot and after restart; verified address joins correctly; the Java multiplayer server list contains one safe entry with no lost user entries.
7. Settings persist; profiles/accounts switch without corrupting instances.
8. No crashes at 1280×720 or 1440×900, narrow layouts remain usable, and focus controls work with keyboard.
9. Unsigned test build is explicitly labeled. Installer is not called production-ready until the above tests pass.

## Release policy
Design approval does not equal feature or security approval. Ship a test installer only after a green CI build; call the build **unverified** until it has actually been installed and exercised on Windows. Do not reuse Modrinth signing keys, updater URLs, branding or proprietary credentials.