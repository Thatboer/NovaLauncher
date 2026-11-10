<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { injection } from '@/util/inject'
import { kInstance } from '@/composables/instance'
import { kLaunchButton } from '@/composables/launchButton'
import { kUserContext } from '@/composables/user'
import { useUserMenuControl } from '@/composables/userMenu'
import { useDialog } from '@/composables/dialog'
import { AddInstanceDialogKey } from '@/composables/instanceTemplates'

type Page = 'home' | 'installations' | 'profiles' | 'mods' | 'servers' | 'settings'
type SavedServer = { id: string; name: string; address: string }
type ModProject = { project_id: string; title: string; description: string; icon_url?: string; slug: string; author: string; downloads: number }
const nav: Array<{ key: Page; name: string; icon: string }> = [
  { key: 'home', name: 'Home', icon: '⌂' },
  { key: 'installations', name: 'Installations', icon: '⬡' },
  { key: 'profiles', name: 'Profiles', icon: '♙' },
  { key: 'mods', name: 'Mods', icon: '✿' },
  { key: 'servers', name: 'Servers', icon: '▤' },
  { key: 'settings', name: 'Settings', icon: '⚙' },
]
const page = ref<Page>('home')
const { instances, path: activePath, select } = injection(kInstance)
const launcher = injection(kLaunchButton)
const { userProfile, gameProfile } = injection(kUserContext)
const accountMenu = useUserMenuControl()
const { show: openCreateDialog } = useDialog(AddInstanceDialogKey)
const javaInstances = computed(() => instances.value.filter(i => i.edition !== 'bedrock'))
const current = computed(() => javaInstances.value.find(i => i.path === activePath.value) ?? null)
const selectedPath = computed({
  get: () => activePath.value,
  set: (value: string) => select(value),
})
const launchError = ref('')
const searchInstall = ref('')
const installFilter = ref('all')
const filteredInstances = computed(() => javaInstances.value.filter(i => {
  const name = i.name.toLowerCase()
  const searchMatches = name.includes(searchInstall.value.toLowerCase()) ||
    (i.runtime.minecraft || '').toLowerCase().includes(searchInstall.value.toLowerCase())
  const loader = instanceLoader(i).toLowerCase()
  return searchMatches && (installFilter.value === 'all' || loader === installFilter.value)
}))
function instanceLoader(i: (typeof javaInstances.value)[number]) {
  if (i.runtime.neoForged) return 'NeoForge'
  if (i.runtime.fabricLoader) return 'Fabric'
  if (i.runtime.forge) return 'Forge'
  if (i.runtime.quiltLoader) return 'Quilt'
  return 'Vanilla'
}
function version(i: (typeof javaInstances.value)[number]) { return i.runtime.minecraft || i.version || 'Unknown version' }
async function launch(instancePath?: string) {
  launchError.value = ''
  if (instancePath && activePath.value !== instancePath) {
    select(instancePath)
    await new Promise<void>(resolve => setTimeout(resolve, 0))
  }
  if (!activePath.value) {
    launchError.value = 'Create or select a Minecraft installation first.'
    return
  }
  try { await launcher.onClick() }
  catch (error) { launchError.value = error instanceof Error ? error.message : String(error) }
}
function changePage(value: Page) {
  page.value = value
  launchError.value = ''
}
function signedIn() { return !!gameProfile.value.name && !userProfile.value.invalidated }

// Modrinth is a content catalog only. XMCL continues to own game files and launching.
const modSearch = ref('')
const modKind = ref('mod')
const modLoading = ref(false)
const modError = ref('')
const modItems = ref<ModProject[]>([])
const modLoaded = ref(false)
async function findMods() {
  modLoading.value = true
  modError.value = ''
  try {
    const url = new URL('https://api.modrinth.com/v2/search')
    url.searchParams.set('query', modSearch.value)
    url.searchParams.set('facets', JSON.stringify([['project_type:' + modKind.value]]))
    url.searchParams.set('limit', '24')
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error('Catalog request failed: HTTP ' + response.status)
    const data: { hits?: ModProject[] } = await response.json()
    modItems.value = Array.isArray(data.hits) ? data.hits : []
    modLoaded.value = true
  } catch (error) {
    modError.value = error instanceof Error ? error.message : String(error)
  } finally { modLoading.value = false }
}
function selectKind(kind: string) {
  modKind.value = kind
  void findMods()
}
function viewProject(project: ModProject) {
  const segment = modKind.value === 'resourcepack' ? 'resourcepack' : modKind.value
  window.open('https://modrinth.com/' + segment + '/' + encodeURIComponent(project.slug || project.project_id), '_blank', 'noopener,noreferrer')
}

// NovaSMP is always shown; user favorites are additive and never overwrite servers.dat.
const NOVA_IP = 'novasmp.gg'
const FAVORITES_KEY = 'nova.xmcl.serverFavorites.v1'
const servers = ref<SavedServer[]>([])
const serverName = ref('')
const serverIp = ref('')
const serverForm = ref(false)
const serverError = ref('')
const serverInfo = ref('')
const serverEditing = ref('')
const serverAddress = (v: string) => v.trim().toLowerCase()
const isNova = (v: string) => serverAddress(v).replace(/:\d+$/, '') === NOVA_IP
onMounted(() => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
    if (!Array.isArray(value)) return
    const seen = new Set<string>()
    servers.value = value.filter((entry): entry is SavedServer => {
      if (!entry || typeof entry !== 'object') return false
      const item = entry as Record<string, unknown>
      if (typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.address !== 'string') return false
      const normalized = serverAddress(item.address)
      if (isNova(normalized) || seen.has(normalized) || !normalized) return false
      seen.add(normalized)
      return true
    })
  } catch { serverError.value = 'Saved servers could not be read. No existing data was deleted.' }
})
watch(servers, value => {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(value)) }
  catch { serverError.value = 'Could not save favorites on this device.' }
}, { deep: true })
function editServer(entry?: SavedServer) {
  serverName.value = entry?.name || ''
  serverIp.value = entry?.address || ''
  serverEditing.value = entry?.id || ''
  serverError.value = ''
  serverForm.value = true
}
function saveServer() {
  const name = serverName.value.trim()
  const address = serverIp.value.trim()
  if (!name || name.length > 50 || !/^[a-z0-9.-]+(?::\d{1,5})?$/i.test(address)) {
    serverError.value = 'Enter a server name and valid Java hostname.'
    return
  }
  const port = address.match(/:(\d+)$/)?.[1]
  if (port && (+port < 1 || +port > 65535)) { serverError.value = 'Invalid port.'; return }
  if (isNova(address)) { serverError.value = 'NovaSMP is permanently featured above.'; return }
  if (servers.value.some(s => serverAddress(s.address) === serverAddress(address) && s.id !== serverEditing.value)) {
    serverError.value = 'Server already saved.'
    return
  }
  if (serverEditing.value) {
    const target = servers.value.find(s => s.id === serverEditing.value)
    if (target) { target.name = name; target.address = address }
  } else servers.value.push({ id: crypto.randomUUID(), name, address })
  serverForm.value = false
  serverInfo.value = 'Saved to Nova favorites.'
}
function removeServer(entry: SavedServer) {
  if (window.confirm('Remove ' + entry.name + ' from Nova favorites?'))
    servers.value = servers.value.filter(s => s.id !== entry.id)
}
async function copyAddress(address: string) {
  try {
    await navigator.clipboard.writeText(address)
    serverInfo.value = 'Copied ' + address
    serverError.value = ''
  } catch { serverError.value = 'Select and copy the address manually.' }
}

const opacity = ref(65)
watch(opacity, value => localStorage.setItem('nova.xmcl.opacity', String(value)))
onMounted(() => {
  const stored = Number(localStorage.getItem('nova.xmcl.opacity'))
  if (stored >= 35 && stored <= 90) opacity.value = stored
})
const shellStyle = computed(() => ({ '--nova-glass-alpha': (opacity.value / 100).toFixed(2) }))
</script>

<template>
  <div class="nova-shell" :style="shellStyle">
    <header class="nova-titlebar">
      <div class="nova-title-identity"><span class="nova-small-mark">N</span><strong>Nova Launcher</strong><span class="nova-title-divider"></span><small>Minecraft Java Launcher</small></div>
      <div class="nova-window-controls">
        <button title="Minimize" aria-label="Minimize" @click="windowController.minimize()">−</button>
        <button title="Maximize" aria-label="Maximize" @click="windowController.maximize()">□</button>
        <button class="nova-window-close" title="Close" aria-label="Close" @click="windowController.close()">×</button>
      </div>
    </header>
    <div class="nova-layout">
      <aside class="nova-side">
        <div class="nova-side-logo"><span class="nova-side-mark">N</span><span>Nova Launcher</span></div>
        <nav class="nova-navigation" aria-label="Nova navigation">
          <button v-for="item in nav" :key="item.key" :class="{ active: page === item.key }" @click="changePage(item.key)">
            <span class="nova-nav-icon">{{ item.icon }}</span>{{ item.name }}
          </button>
        </nav>
        <div class="nova-side-bottom"><small>NOVA LAUNCHER · XMCL-BASED TEST</small></div>
      </aside>
      <main class="nova-main" :class="'nova-page-' + page">
        <section v-if="page === 'home'" class="nova-home">
          <div class="nova-hero">
            <div class="nova-orbit-logo" aria-label="Nova symbol"><span>N</span><i>✦</i></div>
            <h1>Nova Launcher</h1>
            <p>A sleek and modern way to play Minecraft.</p>
            <div class="nova-divider">✧</div>
            <div class="nova-play-row">
              <label class="nova-glass nova-instance-picker">
                <span class="nova-block-icon">▣</span>
                <span class="nova-picker-content"><small>ACTIVE INSTALLATION</small>
                  <select v-model="selectedPath" aria-label="Choose Minecraft installation">
                    <option v-if="!javaInstances.length" value="">No installations yet</option>
                    <option v-for="instance in javaInstances" :key="instance.path" :value="instance.path">{{ instance.name }} · {{ version(instance) }}</option>
                  </select>
                  <span v-if="current">{{ instanceLoader(current) }} · Java Edition</span>
                </span>
              </label>
              <button class="nova-play-button" :disabled="!current || launcher.loading.value" @click="launch()">
                ▶ {{ launcher.loading.value ? 'Preparing…' : launcher.text.value || 'Play' }}
              </button>
            </div>
            <button v-if="!javaInstances.length" class="nova-glass nova-button nova-create-first" @click="openCreateDialog()">+ Create installation</button>
            <p v-if="launchError" class="nova-error">{{ launchError }}</p>
          </div>
          <div class="nova-home-cards">
            <button class="nova-glass nova-home-card" @click="changePage('profiles')"><b>♙</b><span><strong>Profiles</strong><small>Manage your Minecraft accounts</small></span><em>›</em></button>
            <button class="nova-glass nova-home-card" @click="changePage('mods')"><b>✿</b><span><strong>Mods</strong><small>Discover and manage content</small></span><em>›</em></button>
            <button class="nova-glass nova-home-card" @click="changePage('servers')"><b>▤</b><span><strong>Servers</strong><small>Save your favorite servers</small></span><em>›</em></button>
          </div>
        </section>

        <section v-else class="nova-page-content">
          <div class="nova-page-heading">
            <div><h1>{{ nav.find(n => n.key === page)?.name }}</h1>
              <p v-if="page === 'installations'">Manage Minecraft versions and game profiles.</p>
              <p v-else-if="page === 'profiles'">Your Microsoft account and Minecraft identity.</p>
              <p v-else-if="page === 'mods'">Browse real Minecraft mods, modpacks, and shaders.</p>
              <p v-else-if="page === 'servers'">Your favorite multiplayer servers, always close.</p>
              <p v-else>Customize your launcher appearance.</p>
            </div>
            <button v-if="page === 'installations'" class="nova-button nova-purple" @click="openCreateDialog()">+ New installation</button>
            <button v-if="page === 'profiles'" class="nova-button nova-purple" @click="accountMenu.show('login')">+ Add Microsoft Account</button>
            <button v-if="page === 'servers'" class="nova-button nova-purple" @click="editServer()">+ Add Server</button>
          </div>

          <template v-if="page === 'installations'">
            <div class="nova-tool-row">
              <input v-model="searchInstall" class="nova-glass nova-search" placeholder="Search installations..." aria-label="Search installations"/>
              <div class="nova-filter-list"><button v-for="item in ['all','vanilla','fabric','forge','neoforge']" :key="item" class="nova-filter" :class="{selected:installFilter===item}" @click="installFilter=item">{{ item }}</button></div>
            </div>
            <p v-if="launchError" class="nova-error">{{ launchError }}</p>
            <div v-if="!filteredInstances.length" class="nova-glass nova-empty">No matching installations. Create one to install Minecraft.</div>
            <div v-for="instance in filteredInstances" :key="instance.path" class="nova-glass nova-instance-item">
              <span class="nova-instance-icon">▣</span>
              <div><strong>{{ instance.name }}</strong><small>Minecraft {{ version(instance) }} · {{ instanceLoader(instance) }}</small></div>
              <button class="nova-button nova-purple" :disabled="launcher.loading.value" @click="launch(instance.path)">▶ Play</button>
            </div>
          </template>

          <template v-else-if="page === 'profiles'">
            <div class="nova-two-column">
              <div class="nova-stack">
                <div class="nova-glass nova-panel nova-account">
                  <div class="nova-avatar">♙</div><div><small>SELECTED ACCOUNT</small><h2>{{ signedIn() ? gameProfile.name : 'Not signed in' }}</h2><p>{{ signedIn() ? 'Minecraft Java Edition · Microsoft account' : 'Sign in securely with Microsoft to play Minecraft.' }}</p><button class="nova-button nova-outline" @click="accountMenu.show('login')">{{ signedIn() ? 'Manage account' : 'Sign in to Minecraft' }}</button></div>
                </div>
                <div class="nova-glass nova-panel"><h2>Minecraft appearance</h2><p>Your actual Minecraft skin and cape are managed through your account.</p><button class="nova-button nova-outline" @click="accountMenu.show('overview')">Manage Minecraft profile</button></div>
              </div>
              <div class="nova-stack">
                <div class="nova-glass nova-panel"><h2>Account status</h2><div class="nova-setting-line"><span>Sign-in method</span><strong>{{ userProfile.authority || 'Not connected' }}</strong></div><div class="nova-setting-line"><span>Game edition</span><strong>Java Edition</strong></div><div class="nova-setting-line"><span>Account ready</span><strong>{{ signedIn() ? 'Signed in' : 'Not signed in' }}</strong></div></div>
                <div class="nova-glass nova-panel"><h2>Game profiles</h2><p>Each installation keeps its own mods and configuration.</p><button class="nova-button nova-outline" @click="changePage('installations')">View installations ›</button></div>
              </div>
            </div>
          </template>

          <template v-else-if="page === 'mods'">
            <div class="nova-tool-row">
              <form class="nova-mod-search" @submit.prevent="findMods"><input v-model="modSearch" class="nova-glass nova-search" placeholder="Search Minecraft content..." aria-label="Search Minecraft content"/><button class="nova-button nova-purple" :disabled="modLoading" type="submit">{{ modLoading ? 'Searching…' : 'Search' }}</button></form>
              <div class="nova-filter-list"><button v-for="kind in [{id:'mod',name:'Mods'},{id:'modpack',name:'Modpacks'},{id:'shader',name:'Shaders'},{id:'resourcepack',name:'Packs'}]" :key="kind.id" class="nova-filter" :class="{selected:modKind===kind.id}" @click="selectKind(kind.id)">{{ kind.name }}</button></div>
            </div>
            <p v-if="modError" class="nova-error">{{ modError }}</p>
            <p v-if="modLoading" class="nova-note">Searching Minecraft projects…</p>
            <div v-if="modLoaded && !modItems.length" class="nova-glass nova-empty">No matching projects found.</div>
            <div v-if="!modLoaded" class="nova-glass nova-empty">Search for a project or choose a content category to discover mods.</div>
            <div class="nova-mod-grid">
              <div v-for="item in modItems" :key="item.project_id" class="nova-glass nova-mod-card">
                <img v-if="item.icon_url" :src="item.icon_url" :alt="item.title + ' icon'" loading="lazy"/>
                <div><h3>{{ item.title }}</h3><small>by {{ item.author }} · {{ item.downloads.toLocaleString() }} downloads</small><p>{{ item.description }}</p><button class="nova-button nova-outline" @click="viewProject(item)">View project ↗</button></div>
              </div>
            </div>
            <p class="nova-note">Project discovery is live. Installation into XMCL instances is the next integration step, not yet enabled.</p>
          </template>

          <template v-else-if="page === 'servers'">
            <div class="nova-two-column nova-servers-columns">
              <div class="nova-glass nova-panel nova-featured"><small>FEATURED SERVER · PINNED</small><h2>NovaSMP</h2><p>Survival adventures, community events and crossplay.</p><div class="nova-server-spacer"></div><span class="nova-server-chip">JAVA · {{ NOVA_IP }}</span><div class="nova-action-row"><button class="nova-button nova-purple" @click="copyAddress(NOVA_IP)">Copy server IP</button><a class="nova-button nova-outline" href="https://web.novasmp.gg" target="_blank" rel="noopener noreferrer">Website ↗</a></div></div>
              <div class="nova-stack">
                <div class="nova-glass nova-panel"><h2>Saved servers</h2><div class="nova-server-entry"><span>✦ NovaSMP</span><button @click="copyAddress(NOVA_IP)">Copy IP ›</button></div><div v-for="item in servers" :key="item.id" class="nova-server-entry"><span>{{ item.name }}<small>{{ item.address }}</small></span><span><button @click="copyAddress(item.address)">Copy</button><button @click="editServer(item)">Edit</button><button @click="removeServer(item)">×</button></span></div></div>
                <div v-if="serverForm" class="nova-glass nova-panel"><h2>{{ serverEditing ? 'Edit server' : 'Add a server' }}</h2><form class="nova-server-form" @submit.prevent="saveServer"><input v-model="serverName" class="nova-glass" maxlength="50" required placeholder="Server name"/><input v-model="serverIp" class="nova-glass" maxlength="255" required placeholder="address:port"/><div class="nova-action-row"><button class="nova-button nova-purple" type="submit">Save</button><button class="nova-button nova-outline" type="button" @click="serverForm=false">Cancel</button></div></form></div>
                <p v-if="serverError" class="nova-error">{{ serverError }}</p><p v-if="serverInfo" class="nova-note">{{ serverInfo }}</p>
                <div class="nova-glass nova-panel"><h2>Quick connect</h2><p>Copy an address, then paste it into Minecraft multiplayer. Automatic in-game joining is not enabled yet.</p><button class="nova-button nova-outline" @click="editServer()">+ Save another server</button></div>
              </div>
            </div>
          </template>

          <template v-else-if="page === 'settings'">
            <div class="nova-two-column nova-settings-columns">
              <div class="nova-glass nova-panel"><h2>Appearance</h2><div class="nova-setting-line"><span>Theme</span><strong>Nova Lavender Glass</strong></div><div class="nova-setting-line"><div><strong>Glass opacity</strong><small>Controls the transparency of Nova panels</small></div><label class="nova-opacity"><input v-model.number="opacity" type="range" min="35" max="90" step="5" aria-label="Glass opacity"/><span>{{ opacity }}%</span></label></div></div>
              <div class="nova-glass nova-panel"><h2>Launcher</h2><div class="nova-setting-line"><span>Edition</span><strong>Minecraft Java</strong></div><div class="nova-setting-line"><span>Engine</span><strong>XMCL</strong></div><p>Advanced Java, memory and download controls are not wired into this Nova page yet.</p><h2>About &amp; Credits</h2><p>Nova Launcher is an independent project built using X Minecraft Launcher (MIT licensed). Not affiliated with Mojang, Microsoft or XMCL.</p><a href="https://github.com/Voxelum/x-minecraft-launcher" target="_blank" rel="noopener noreferrer">Open-source engine attribution ↗</a></div>
            </div>
          </template>
        </section>
      </main>
    </div>
  </div>
</template>
