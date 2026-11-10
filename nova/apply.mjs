// Nova Launcher overlay for a pinned clean Modrinth checkout.
// Copies original Nova components, patches three integration points, and preserves backups.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sourceDir = path.dirname(fileURLToPath(import.meta.url))
const target = path.resolve(process.argv[2] ?? '.')
const files = {
  app: 'apps/app-frontend/src/App.vue',
  index: 'apps/app-frontend/src/pages/Index.vue',
  title: 'apps/app-frontend/src/app/shell/title-bar/index.vue',
  splash: 'apps/app-frontend/src/components/ui/SplashScreen.vue',
  html: 'apps/app-frontend/index.html',
  rust: 'apps/app/src/main.rs',
  installer: 'apps/app/nsis/hooks.nsi',
}
const required = Object.values(files)
function mustContain(value, token, area) {
  if (!value.includes(token)) throw new Error('Upstream layout changed: ' + area)
}
function patchApp(value) {
  const token = "import AppTitleBar from '@/app/shell/title-bar/index.vue'"
  mustContain(value, token, 'AppTitleBar import')
  value = value.replace(token, token + "\nimport NovaSidebar from '@/features/nova/NovaSidebar.vue'\nimport '@/features/nova/nova-theme.css'")

  // Remove, rather than just hide, the legacy Modrinth left nav.
  const navStart = value.indexOf('\t\t<div\n\t\t\tclass="app-grid-navbar')
  const navEnd = value.indexOf('\t\t<AppTitleBar', navStart)
  if (navStart < 0 || navEnd < navStart) throw new Error('Could not locate legacy sidebar boundary')
  value = value.slice(0, navStart) +
    '\t\t<NovaSidebar @create="installationModal?.show()" @settings="settingsActions.openSettings" />\n' +
    value.slice(navEnd)

  // The previous build still displayed Modrinth's advertisement/right pane on non-home routes.
  const rightStart = value.indexOf('\t\t<AppSidebar\n')
  const rightEnd = value.indexOf('\n\t\t/>', rightStart)
  if (rightStart < 0 || rightEnd < rightStart) throw new Error('Could not locate old right sidebar')
  value = value.slice(0, rightStart) + value.slice(rightEnd + '\n\t\t/>'.length)

  // Nova does not display advertising. Disable ad initialization and the CMP
  // event handler itself, not only its visible popup.
  const replaceExact = (before, after, name) => {
    if (value.split(before).length !== 2) throw new Error('Unexpected upstream ' + name)
    value = value.replace(before, after)
  }
  replaceExact(
    "useAppEvent('ads_consent_required', handleAdsConsentRequired, appEvents)",
    "// Independent Nova client: advertising service and consent popup disabled.",
    'ad consent event'
  )
  replaceExact(
    "const showAd = computed(\n\t() => sidebarVisible.value && !hasPlus.value && credentials.value !== undefined,\n)",
    "const showAd = computed(() => false)",
    'ad visibility'
  )
  replaceExact(
    "const adConsentAvailable = computed(() => credentials.value !== undefined && !hasPlus.value)",
    "const adConsentAvailable = computed(() => false)",
    'ad consent availability'
  )
  replaceExact(
    "try {\n\t\thandleAdsConsentRequired(await should_show_ads_consent_popup())\n\t} catch (error) {\n\t\thandleError(error)\n\t}",
    "// Ad-consent setup removed because Nova does not request or display ads.",
    'startup consent call'
  )
  const cStart = value.indexOf('function handleAdsConsentRequired(required) {')
  const cEnd = value.indexOf('async function setupApp() {', cStart)
  if (cStart < 0 || cEnd < cStart) throw new Error('Ad consent handler moved')
  value = value.slice(0, cStart) + value.slice(cEnd)
  const mStart = value.indexOf('\tadsConsentTitle: {')
  const mEnd = value.indexOf('\thome: {', mStart)
  if (mStart < 0 || mEnd < mStart) throw new Error('Ad consent messages moved')
  value = value.slice(0, mStart) + value.slice(mEnd)
  const wStart = value.indexOf('watch(\n\t[stateInitialized, showAd, adConsentAvailable],')
  const wEnd = value.indexOf("onMounted(() => {\n\tinvoke('show_window')", wStart)
  if (wStart < 0 || wEnd < wStart) throw new Error('Ad initialization watcher moved')
  value = value.slice(0, wStart) +
    "watch(stateInitialized, (ready) => {\n\tif (ready) void hide_ads_window(true).catch(handleError)\n}, { immediate: true })\n\n" +
    value.slice(wEnd)
  value = value.replace('\t\t\t<SurveyPopup />', '\t\t\t<!-- Nova does not load upstream survey promotions -->')
  value = value.replace("import SurveyPopup from '@/components/ui/SurveyPopup.vue'\n", '')
  // Preserve the real connection check while keeping its notice out of
  // the page layout. The old full-width Admonition pushed every Nova screen down.
  const noticeStart = value.indexOf('\t\t\t<Admonition\n\t\t\t\tv-if="authUnreachable"')
  const noticeEnd = value.indexOf('\t\t\t<HostingUpdateRequired', noticeStart)
  if (noticeStart < 0 || noticeEnd < noticeStart) throw new Error('Auth warning position changed')
  value = value.slice(0, noticeStart) + [
    '\t\t\t<div v-if="authUnreachable && !novaAuthDismissed" class="nova-auth-notice" role="status">',
    '\t\t\t\t<span aria-hidden="true" class="nova-auth-notice-icon">!</span>',
    '\t\t\t\t<div class="nova-auth-notice-copy"><strong>Account check unavailable</strong>',
    '\t\t\t\t\t<small>Minecraft authentication could not be checked. Your connection may still work.</small></div>',
    '\t\t\t\t<button type="button" class="nova-auth-retry" @click="authServerQuery.refetch()">Retry</button>',
    '\t\t\t\t<button type="button" class="nova-auth-dismiss" aria-label="Dismiss account notice" @click="novaAuthDismissed = true">×</button>',
    '\t\t\t</div>',
    '',
  ].join('\n') + value.slice(noticeEnd)
  const authEnd = 'let unlistenEditMenu'
  if (!value.includes(authEnd)) throw new Error('Auth checker not found')
  value = value.replace(authEnd, 'const novaAuthDismissed = ref(false)\n\n' + authEnd)
  // This name scopes CSS only to instance creation; other functional dialogs remain intact.
  const creationTag = '\t\t<CreationFlowModal\n'
  if (value.split(creationTag).length !== 2) throw new Error('Creation dialog hook moved')
  value = value.replace(creationTag, creationTag + '\t\t\tclass="nova-create-instance-modal"\n')
  const end = value.lastIndexOf('</script>')
  if (end < 0) throw new Error('App.vue missing script block')
  const handlers = "\nfunction novaOpenSettings() { settingsActions.openSettings() }\n" +
    "onMounted(() => { document.title = 'NOVA Launcher | Test 0.7'; document.documentElement.classList.add('nova-theme'); document.addEventListener('nova-open-settings', novaOpenSettings) })\n" +
    "onUnmounted(() => { document.documentElement.classList.remove('nova-theme'); document.removeEventListener('nova-open-settings', novaOpenSettings) })\n"
  return value.slice(0, end) + handlers + value.slice(end)
}
function patchIndex(value) {
  const imp = "import RecentWorldsList from '@/components/ui/world/RecentWorldsList.vue'"
  mustContain(value, imp, 'Index imports')
  value = value.replace(imp, imp + "\nimport NovaPage from '@/features/nova/NovaPage.vue'")
  const end = value.lastIndexOf('</script>')
  if (end < 0) throw new Error('Index.vue missing script block')
  value = value.slice(0, end) + "\nfunction novaSettings() { document.dispatchEvent(new Event('nova-open-settings')) }\n" + value.slice(end)

  // This is intentionally the ONLY home-page template. The previous patch
  // left Modrinth's onboarding/library nodes in the build behind v-else branches.
  const templateStart = value.indexOf('<template>')
  const templateEnd = value.lastIndexOf('</template>')
  if (templateStart < 0 || templateEnd < templateStart) throw new Error('Index.vue template not found')
  const novaTemplate = '<template>\n\t<NovaPage :instances="instances" @create="showCreationModal?.()" @settings="novaSettings" />\n</template>'
  return value.slice(0, templateStart) + novaTemplate + value.slice(templateEnd + '</template>'.length)
}
function patchTitle(value) {
  mustContain(value, '<TextLogo class="h-7 w-auto shrink-0 text-contrast pointer-events-none" />', 'legacy title logo')
  const start = value.indexOf('<template>')
  const end = value.lastIndexOf('</template>')
  if (start < 0 || end < start) throw new Error('Title bar template missing')
  // Import the SVG through Vite so the titlebar never renders a literal @/ URL.
  const logoImportAnchor = "import WindowControls from './window-controls.vue'"
  mustContain(value, logoImportAnchor, 'titlebar WindowControls')
  value = value.replace(logoImportAnchor, logoImportAnchor + "\nimport novaLogoUrl from '@/features/nova/nova-logo.svg?url'")
  const nova = [
    '<template>',
    '  <header data-tauri-drag-region class="app-title-bar nova-titlebar">',
    '    <div data-tauri-drag-region class="nova-titlebar-brand">',
    '      <img class="nova-titlebar-logo" :src="novaLogoUrl" alt="" aria-hidden="true" />',
    '      <strong data-tauri-drag-region>Nova Launcher</strong>',
    '      <span class="nova-bar-divider" data-tauri-drag-region></span>',
    '      <small data-tauri-drag-region>Minecraft Java Launcher</small>',
    '      <span class="nova-test-label" data-tauri-drag-region>DESIGN #5 · TEST 0.7</span>',
    '    </div>',
    '    <WindowControls />',
    '  </header>',
    '</template>',
  ].join('\n')
  return value.slice(0, start) + nova + value.slice(end + '</template>'.length)
}

function patchSplash(value) {
  mustContain(value, 'id="modrinth-app-logo"', 'upstream splash logo')
  mustContain(value, "import ProgressBar from '@/components/ui/ProgressBar.vue'", 'splash progress')
  const start = value.indexOf('<template>')
  const end = value.indexOf('</template>', start)
  if (start !== 0 || end < 0) throw new Error('Unexpected splash template')
  const replacement = `<template>
  <Transition name="splash-fade" @after-leave="onAfterLeave">
    <div v-if="!doneLoading" class="splash-screen nova-splash" :class="theme.active + '-mode'">
      <div class="app-logo-wrapper nova-splash-content" data-tauri-drag-region>
        <img class="nova-splash-logo" :src="novaLogoUrl" alt="NOVA" />
        <strong class="nova-splash-label">NOVA LAUNCHER</strong>
        <small class="nova-splash-subtitle">Minecraft Java Edition</small>
        <ProgressBar class="loading-bar" :progress="Math.min(loadingProgress, 100)" />
        <span v-if="message" class="nova-splash-message">{{ message }}</span>
      </div>
    </div>
  </Transition>
</template>`
  // Existing loading state, progression, and lifecycle remain untouched.
  value = replacement + value.slice(end + '</template>'.length)
  const splashImportAnchor = "import { useTheme } from '@/composables/use-theme.ts'"
  mustContain(value, splashImportAnchor, 'splash theme import')
  value = value.replace(splashImportAnchor, splashImportAnchor + "\nimport novaLogoUrl from '@/features/nova/nova-logo.svg?url'")
  return value + `
<style scoped>
.nova-splash {
  background: radial-gradient(circle at 50% 35%, #663a91, #1c0c31 68%, #090514);
}
.nova-splash-content { color: #fff; gap: 9px; }
.nova-splash-logo { width: 164px; height: 164px; border-radius: 50%; object-fit: contain; filter: drop-shadow(0 0 22px #b24af58c); }
.nova-splash-label { font: 850 27px Inter, system-ui, sans-serif; letter-spacing: .08em; }
.nova-splash-subtitle { margin-bottom: 20px; color: #e6c8f9; font: 13px Inter, system-ui, sans-serif; }
.nova-splash-message { color: #dfc5ef; font-size: 12px; }
.nova-splash .loading-bar { --color-brand: #bd7af9; }
</style>`
}
function patchHtml(value) {
  mustContain(value, '<title>Modrinth App</title>', 'upstream HTML title')
  value = value.replace('<title>Modrinth App</title>', '<title>Nova Launcher</title>')
  // This startup page runs before Vue; leave no upstream tab icon or survey widget.
  value = value.replace('<link rel="icon" type="image/svg+xml" href="/vite.svg" />', '')
  value = value.replace(/<script src="https:\/\/tally\.so\/widgets\/embed\.js" async><\/script>\s*/, '')
  return value
}
function patchRust(value) {
  mustContain(value, 'Loading Modrinth App!', 'Rust startup string')
  return value.replace('Loading Modrinth App!', 'Loading Nova Launcher!')
}

function patchInstaller(value) {
  const oldPhrase = 'An old installation of the Modrinth App was detected'
  mustContain(value, oldPhrase, 'NSIS upgrade warning')
  return value.replace(oldPhrase, 'An existing Nova Launcher installation was detected')
}

const changes = [
  [files.app, patchApp],
  [files.index, patchIndex],
  [files.title, patchTitle],
  [files.splash, patchSplash],
  [files.html, patchHtml],
  [files.rust, patchRust],
  [files.installer, patchInstaller],
]
const staged = []
for (const [relative, fn] of changes) {
  const full = path.join(target, relative)
  if (!fs.existsSync(full)) throw new Error('Missing upstream file: ' + relative)
  const initial = fs.readFileSync(full, 'utf8')
  if (initial.includes('nova-theme') || initial.includes("nova-open-settings") || initial.includes('NovaPage')) {
    throw new Error('Nova patch already applied to ' + relative)
  }
  staged.push({ full, original: initial, changed: fn(initial) })
}
const dest = path.join(target, 'apps/app-frontend/src/features/nova')
if (fs.existsSync(dest)) throw new Error('Nova components already present: ' + dest)
fs.mkdirSync(dest, { recursive: true })
for (const name of ['NovaPage.vue', 'NovaSidebar.vue', 'NovaAccounts.vue', 'NovaSettings.vue', 'nova-theme.css', 'nova-logo.svg', 'cherry-grove.avif']) {
  fs.copyFileSync(path.join(sourceDir, name), path.join(dest, name))
}
// Confirm image files really exist in the fork and contain recognizable formats.
const sceneFile = path.join(dest, 'cherry-grove.avif')
const sceneBytes = fs.readFileSync(sceneFile)
const imageHeader = sceneBytes.subarray(4, 24).toString('ascii')
if (sceneBytes.length < 1024 || !imageHeader.includes('avif')) {
  throw new Error('NOVA scenery is missing or is not a valid AVIF image')
}
const logoFile = path.join(dest, 'nova-logo.svg')
if (!fs.readFileSync(logoFile, 'utf8').includes('<svg')) {
  throw new Error('NOVA logo SVG is missing or malformed')
}
console.log('Verified NOVA scenery (' + sceneBytes.length + ' bytes) and logo assets.')
for (const item of staged) {
  fs.writeFileSync(item.full + '.nova-original', item.original, 'utf8')
  fs.writeFileSync(item.full, item.changed, 'utf8')
}
const configPath = path.join(target, 'apps/app/tauri.conf.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
fs.copyFileSync(configPath, configPath + '.nova-original')
config.productName = 'Nova Launcher'
config.mainBinaryName = 'NovaLauncher'
config.identifier = 'gg.novasmp.novalauncher'
config.app.windows[0].title = 'Nova Launcher'
config.bundle.shortDescription = 'NOVA Minecraft Java Launcher'
config.bundle.longDescription = 'Independent Nova Launcher for Minecraft Java Edition.'
config.plugins['deep-link'].desktop.schemes = ['nova-launcher']
config.version = '1.0.6' // Design 5 visual correction above previous 1.0.5
fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
console.log('Applied Nova UI and Windows app identity. Original files backed up.')
