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

  const end = value.lastIndexOf('</script>')
  if (end < 0) throw new Error('App.vue missing script block')
  const handlers = "\nfunction novaOpenSettings() { settingsActions.openSettings() }\n" +
    "onMounted(() => { document.title = 'Nova Launcher | Test 0.2'; document.documentElement.classList.add('nova-theme'); document.addEventListener('nova-open-settings', novaOpenSettings) })\n" +
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
  const logo = '<TextLogo class="h-7 w-auto shrink-0 text-contrast pointer-events-none" />'
  mustContain(value, logo, 'title bar logo')
  value = value.replace(logo, '<span class="nova-app-title" data-tauri-drag-region>✧ NOVA LAUNCHER <small class="nova-test-label">TEST 0.2</small></span>')
  mustContain(value, 'TextLogo, ', 'title bar logo import')
  value = value.replace('TextLogo, ', '')
  return value
}
const changes = [
  [files.app, patchApp],
  [files.index, patchIndex],
  [files.title, patchTitle],
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
for (const name of ['NovaPage.vue', 'NovaSidebar.vue', 'nova-theme.css', 'cherry-grove.avif']) {
  fs.copyFileSync(path.join(sourceDir, name), path.join(dest, name))
}
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
config.version = '1.0.1' // Above prior 1.0.0-local so the NSIS update installs cleanly
fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
console.log('Applied Nova UI and Windows app identity. Original files backed up.')
