<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { injectNotificationManager } from '@modrinth/ui'
import { install_project_with_dependencies, run, type ResolveContentRequest } from '@/helpers/instance'
import type { GameInstance } from '@/helpers/types'
import NovaAccounts from './NovaAccounts.vue'
import NovaSettings from './NovaSettings.vue'
import sceneUrl from './cherry-grove.avif?url'
import logoUrl from './nova-logo.svg?url'

type ModHit = {
  project_id: string
  title: string
  description: string
  icon_url?: string
  author: string
  downloads: number
}
type ModKind = 'mod' | 'modpack' | 'shader' | 'resourcepack'
const props = defineProps<{ instances: GameInstance[] }>()
const sceneBroken = ref(false)
const logoBroken = ref(false)
const sceneCss = computed(() => ({
  '--nova-scene-url': sceneBroken.value ? 'none' : 'url("' + sceneUrl + '")',
}))
function validateImage() {
  const image = new Image()
  image.onload = () => { sceneBroken.value = false }
  image.onerror = () => { sceneBroken.value = true }
  image.src = sceneUrl
}
onMounted(() => {
  validateImage()
  try {
    const root = document.documentElement
    const opacity = Number(localStorage.getItem('nova.appearance.opacity.v1'))
    const blur = Number(localStorage.getItem('nova.appearance.blur.v1'))
    if (opacity >= 25 && opacity <= 85) root.style.setProperty('--nova-glass-opacity', String(opacity / 100))
    if (blur >= 0 && blur <= 24) root.style.setProperty('--nova-inner-blur', blur + 'px')
    root.classList.toggle('nova-motion', localStorage.getItem('nova.appearance.motion.v1') !== 'false')
    root.classList.toggle('nova-reduced-motion', localStorage.getItem('nova.appearance.reduced-motion.v1') === 'true')
  } catch { /* The bundled defaults remain available when storage is blocked. */ }
})
const emit = defineEmits<{ create: []; settings: [] }>()
const route = useRoute()
const router = useRouter()
const { handleError } = injectNotificationManager()
const page = computed(() => {
  const id = String(route.query.nova || 'home')
  return ['home', 'installations', 'profiles', 'mods', 'servers', 'settings'].includes(id) ? id : 'home'
})
const selected = ref('')
const launching = ref('')
const modQuery = ref('')
const modHits = ref<ModHit[]>([])
const modLoading = ref(false)
const modError = ref('')
const modLoaded = ref(false)
const modKind = ref<ModKind>('mod')
const modSelected = ref<ModHit | null>(null)
const modInstalling = ref('')
const modStatus = ref('')
const modStatusIsError = ref(false)

// User-chosen server shortcuts only. Nothing is preloaded or featured.
const FAVORITES_KEY = 'nova.launcher.servers.v1'
type FavoriteServer = { id: string; name: string; address: string }
const favoriteServers = ref<FavoriteServer[]>([])
const serverName = ref('')
const serverAddress = ref('')
const serverEditingId = ref('')
const serverFormOpen = ref(false)
const serverError = ref('')
const serverNotice = ref('')
const addressKey = (address: string) => address.trim().toLowerCase()

onMounted(() => {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
    if (!Array.isArray(data)) return
    const seen = new Set<string>()
    favoriteServers.value = data.filter((entry): entry is FavoriteServer => {
      if (!entry || typeof entry !== 'object') return false
      const item = entry as Record<string, unknown>
      if (typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.address !== 'string') return false
      const normalized = addressKey(item.address)
      if (!normalized || seen.has(normalized)) return false
      seen.add(normalized)
      return true
    }).map(item => ({ id: item.id, name: item.name.slice(0, 50), address: item.address.slice(0, 255) }))
  } catch {
    serverError.value = 'Could not read saved servers. Existing storage was not overwritten.'
  }
})
watch(favoriteServers, value => {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(value)) }
  catch { serverError.value = 'Could not save the server list on this device.' }
}, { deep: true })

function editServer(server?: FavoriteServer) {
  serverName.value = server?.name || ''
  serverAddress.value = server?.address || ''
  serverEditingId.value = server?.id || ''
  serverError.value = ''
  serverNotice.value = ''
  serverFormOpen.value = true
}
function saveServer() {
  const name = serverName.value.trim()
  const address = serverAddress.value.trim()
  serverError.value = ''
  if (!name || name.length > 50) { serverError.value = 'Please enter a name up to 50 characters.'; return }
  if (!/^[a-z0-9.-]+(?::\d{1,5})?$/i.test(address)) { serverError.value = 'Enter a valid Java server hostname, optionally with :port.'; return }
  const port = address.match(/:(\d+)$/)?.[1]
  if (port && (Number(port) < 1 || Number(port) > 65535)) { serverError.value = 'Invalid port number.'; return }
  if (favoriteServers.value.some(x => addressKey(x.address) === addressKey(address) && x.id !== serverEditingId.value)) {
    serverError.value = 'That server is already saved.'
    return
  }
  if (serverEditingId.value) {
    const previous = favoriteServers.value.find(x => x.id === serverEditingId.value)
    if (previous) { previous.name = name; previous.address = address }
  } else favoriteServers.value.push({ id: crypto.randomUUID(), name, address })
  serverFormOpen.value = false
  serverNotice.value = 'Saved in your Nova Launcher favorites.'
}
function removeServer(server: FavoriteServer) {
  if (!window.confirm('Remove ' + server.name + ' from Nova favorites?')) return
  favoriteServers.value = favoriteServers.value.filter(x => x.id !== server.id)
  serverNotice.value = 'Server removed from Nova favorites.'
}
async function copyServer(address: string) {
  try {
    await navigator.clipboard.writeText(address)
    serverError.value = ''
    serverNotice.value = 'Copied ' + address
  } catch {
    serverError.value = 'Clipboard unavailable. Copy the displayed address manually.'
  }
}
watch(() => props.instances, (items) => {
  if (!items.some((item) => item.id === selected.value)) selected.value = items[0]?.id ?? ''
}, { immediate: true })
const current = computed(() => props.instances.find((item) => item.id === selected.value))
function navigate(id: string) {
  void router.push({ path: '/', query: { nova: id } })
}
async function launch(instance?: GameInstance) {
  if (!instance || instance.quarantined || instance.install_stage !== 'installed' || launching.value) return
  launching.value = instance.id
  try {
    await run(instance.id)
  } catch (e) {
    handleError(e instanceof Error ? e : new Error(String(e)))
  } finally {
    launching.value = ''
  }
}
async function searchMods() {
  modLoading.value = true
  modError.value = ''
  modSelected.value = null
  try {
    const url = new URL('https://api.modrinth.com/v2/search')
    url.searchParams.set('query', modQuery.value)
    url.searchParams.set('facets', JSON.stringify([['project_type:' + modKind.value]]))
    url.searchParams.set('limit', '16')
    const response = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } })
    if (!response.ok) throw new Error('Modrinth returned HTTP ' + response.status)
    const result: { hits?: ModHit[] } = await response.json()
    modHits.value = result.hits ?? []
    modLoaded.value = true
  } catch (e) {
    modError.value = e instanceof Error ? e.message : String(e)
  } finally {
    modLoading.value = false
  }
}
watch(page, (id) => {
  if (id === 'mods' && !modLoaded.value && !modLoading.value) void searchMods()
}, { immediate: true })
function selectModKind(kind: ModKind) {
  if (modKind.value === kind) return
  modKind.value = kind
  modHits.value = []
  modLoaded.value = false
  modSelected.value = null
  modStatus.value = ''
  void searchMods()
}
function openMod(hit: ModHit) {
  modSelected.value = hit
  modStatus.value = ''
}
async function installMod(hit: ModHit) {
  modStatus.value = ''
  modStatusIsError.value = false
  const instance = current.value
  if (!instance || instance.install_stage !== 'installed' || instance.quarantined) {
    modStatus.value = 'Choose a fully installed Minecraft profile first.'
    modStatusIsError.value = true
    return
  }
  if (modKind.value === 'modpack') {
    modStatus.value = 'Modpacks need their own installation.'
    modStatusIsError.value = true
    return
  }
  modInstalling.value = hit.project_id
  try {
    const request: ResolveContentRequest = {
      project_id: hit.project_id,
      content_type: modKind.value,
      selected: {
        game_versions: [instance.game_version],
        ...(modKind.value === 'mod' && String(instance.loader).toLowerCase() !== 'vanilla'
          ? { loaders: [String(instance.loader).toLowerCase()] }
          : {}),
      },
    }
    await install_project_with_dependencies(instance.id, request)
    modStatus.value = 'Started installing ' + hit.title + ' into ' + instance.name + '. Check the installation status before playing.'
  } catch (error) {
    modStatusIsError.value = true
    modStatus.value = error instanceof Error ? error.message : String(error)
  } finally {
    modInstalling.value = ''
  }
}
function openSettings() {
  emit('settings')
}
</script>

<template>
  <main class="nova-page" :style="sceneCss" :class="{ 'nova-scene-unavailable': sceneBroken }">
    <section v-if="page === 'home'" class="nova-home">
      <div class="nova-home-center">
        <img v-if="!logoBroken" class="nova-home-logo" :src="logoUrl" alt="NOVA" @error="logoBroken = true"/><span v-else class="nova-logo-fallback" aria-label="NOVA">NOVA</span>
        <h1>Nova Launcher</h1>
        <p>A sleek and modern way to play Minecraft.</p>
        <div class="nova-rule"><span>✦</span></div>
        <div class="nova-launch-row">
          <label class="nova-glass nova-install-choice">
            <span class="nova-grass-icon">▣</span>
            <span class="nova-select-content">
              <small>ACTIVE INSTALLATION</small>
              <select v-model="selected" aria-label="Minecraft installation">
                <option v-if="!props.instances.length" value="">No installations yet</option>
                <option v-for="instance in props.instances" :key="instance.id" :value="instance.id">
                  {{ instance.name }} · {{ instance.game_version }} ({{ instance.loader }})
                </option>
              </select>
            </span>
          </label>
          <button class="nova-play" :disabled="!current || current.install_stage !== 'installed' || current.quarantined || !!launching" @click="launch(current)">
            {{ launching ? 'Launching…' : '▶  Play' }}
          </button>
        </div>
        <p v-if="current && current.install_stage !== 'installed'" class="nova-hint">This profile must finish installing before it can launch.</p>
        <button v-if="!props.instances.length" class="nova-button nova-glass nova-first" @click="emit('create')">+ Create an installation</button>
      </div>
      <div class="nova-home-tiles">
        <button class="nova-glass nova-tile" @click="navigate('profiles')"><b>♙</b><span><strong>Profiles</strong><small>Accounts and game profiles</small></span><em>›</em></button>
        <button class="nova-glass nova-tile" @click="navigate('mods')"><b>✧</b><span><strong>Mods</strong><small>Discover Minecraft content</small></span><em>›</em></button>
        <button class="nova-glass nova-tile" @click="navigate('servers')"><b>▤</b><span><strong>Servers</strong><small>Your Minecraft connections</small></span><em>›</em></button>
      </div>
    </section>

    <section v-else class="nova-content">
      <header class="nova-section-head">
        <div>
          <h1>{{ ({ installations: 'Installations', profiles: 'Profiles', mods: 'Mods', servers: 'Servers', settings: 'Settings' } as Record<string,string>)[page] }}</h1>
          <p v-if="page === 'installations'">Manage Minecraft versions and modded instances.</p>
          <p v-else-if="page === 'profiles'">Use your existing Microsoft Minecraft account.</p>
          <p v-else-if="page === 'mods'">Browse mods, modpacks, shaders and resources without leaving Nova.</p>
          <p v-else-if="page === 'servers'">Keep your favorite multiplayer servers ready to join.</p>
          <p v-else>Customize your Minecraft experience.</p>
        </div>
        <button v-if="page === 'installations'" class="nova-button nova-primary" @click="emit('create')">+ New installation</button>
      </header>

      <div v-if="page === 'installations'" class="nova-content-stack">
        <div v-if="!props.instances.length" class="nova-glass nova-empty">No installations yet. Create one to install Minecraft.</div>
        <div v-for="instance in props.instances" :key="instance.id" class="nova-glass nova-instance">
          <div class="nova-instance-icon">▣</div>
          <div class="nova-instance-info"><strong>{{ instance.name }}</strong><small>{{ instance.loader }} · {{ instance.game_version }} · {{ instance.install_stage.replaceAll('_', ' ') }}</small></div>
          <button class="nova-button nova-soft" @click="router.push('/instance/' + encodeURIComponent(instance.id))">Manage</button>
          <button class="nova-button nova-primary" :disabled="instance.quarantined || instance.install_stage !== 'installed' || !!launching" @click="launch(instance)">▶ Play</button>
        </div>
      </div>

      <div v-else-if="page === 'profiles'" class="nova-content-stack">
        <NovaAccounts @installations="navigate('installations')" />
      </div>

      <div v-else-if="page === 'mods'" class="nova-content-stack">
        <div class="nova-kind-switcher" role="group" aria-label="Minecraft content type">
          <button v-for="kind in (['mod', 'modpack', 'shader', 'resourcepack'] as ModKind[])" :key="kind" class="nova-glass nova-kind-tab" :class="{ 'nova-kind-selected': modKind === kind }" @click="selectModKind(kind)">
            {{ ({ mod: 'Mods', modpack: 'Modpacks', shader: 'Shaders', resourcepack: 'Resource Packs' } as Record<ModKind,string>)[kind] }}
          </button>
        </div>
        <form class="nova-mod-search" @submit.prevent="searchMods">
          <input v-model="modQuery" class="nova-glass" placeholder="Find Minecraft mods and other content..." aria-label="Search Minecraft content" />
          <button class="nova-button nova-primary" :disabled="modLoading" type="submit">{{ modLoading ? 'Searching…' : 'Search' }}</button>
        </form>
        <div class="nova-glass nova-mod-install-target">
          <div><span class="nova-mod-target-label">TARGET INSTALLATION</span><small>Mods are installed using the existing Minecraft backend.</small></div>
          <select v-model="selected" aria-label="Target Minecraft installation">
            <option v-if="!props.instances.length" value="">No installations yet</option>
            <option v-for="instance in props.instances" :key="instance.id" :value="instance.id">{{ instance.name }} · {{ instance.game_version }} · {{ instance.loader }}</option>
          </select>
          <button class="nova-button nova-soft" @click="navigate('installations')">Manage</button>
        </div>
        <p v-if="modError" class="nova-error" role="alert">{{ modError }}</p>
        <p v-if="modStatus" :class="modStatusIsError ? 'nova-error' : 'nova-server-notice'" role="status">{{ modStatus }}</p>
        <p v-if="modLoading" class="nova-mod-loading" role="status">Searching Minecraft content…</p>
        <div v-if="modSelected" class="nova-glass nova-mod-focused">
          <img v-if="modSelected.icon_url" :src="modSelected.icon_url" :alt="modSelected.title + ' icon'" class="nova-mod-focused-icon" />
          <div class="nova-mod-focused-details">
            <span class="nova-eyebrow">PROJECT DETAILS</span>
            <h2>{{ modSelected.title }}</h2>
            <p class="nova-mod-author">by {{ modSelected.author }} · {{ modSelected.downloads.toLocaleString() }} downloads</p>
            <p>{{ modSelected.description }}</p>
            <div class="nova-server-buttons">
              <button v-if="modKind !== 'modpack'" class="nova-button nova-primary" :disabled="!!modInstalling || !current || current.install_stage !== 'installed' || current.quarantined" @click="installMod(modSelected)">
                {{ modInstalling === modSelected.project_id ? 'Installing…' : 'Install with dependencies' }}
              </button>
              <span v-else class="nova-modpack-notice">Modpacks need a separate Minecraft installation.</span>
              <button class="nova-button nova-soft" @click="modSelected = null">Close</button>
            </div>
          </div>
        </div>
        <div v-if="modLoaded && !modHits.length && !modLoading" class="nova-glass nova-empty">No matching projects found.</div>
        <div class="nova-mod-grid">
          <article v-for="mod in modHits" :key="mod.project_id" class="nova-glass nova-mod">
            <img v-if="mod.icon_url" :src="mod.icon_url" :alt="mod.title + ' icon'" loading="lazy"/>
            <div class="nova-mod-text">
              <strong>{{ mod.title }}</strong>
              <small>by {{ mod.author }} · {{ mod.downloads.toLocaleString() }} downloads</small>
              <p>{{ mod.description }}</p>
              <button class="nova-button nova-soft" @click="openMod(mod)">View details</button>
            </div>
          </article>
        </div>
      </div>

      <div v-else-if="page === 'servers'" class="nova-content-stack nova-custom-servers">
        <div class="nova-servers-intro nova-glass">
          <span class="nova-overline">YOUR MINECRAFT SERVERS</span>
          <h2>My Servers</h2>
          <p>Save the Java multiplayer servers you actually play. Nothing is added automatically.</p>
          <button class="nova-button nova-primary" @click="editServer()">+ Add server</button>
        </div>
        <p v-if="serverError" class="nova-error" role="alert">{{ serverError }}</p>
        <p v-if="serverNotice" class="nova-server-notice" role="status">{{ serverNotice }}</p>
        <form v-if="serverFormOpen" class="nova-glass nova-server-form" @submit.prevent="saveServer">
          <label>SERVER NAME<input v-model="serverName" class="nova-glass" maxlength="50" placeholder="My Minecraft server" required /></label>
          <label>JAVA ADDRESS<input v-model="serverAddress" class="nova-glass" maxlength="255" placeholder="example.com:25565" required /></label>
          <div class="nova-server-buttons">
            <button class="nova-button nova-primary" type="submit">{{ serverEditingId ? 'Save changes' : 'Save server' }}</button>
            <button class="nova-button nova-soft" type="button" @click="serverFormOpen = false">Cancel</button>
          </div>
        </form>
        <div v-if="!favoriteServers.length && !serverFormOpen" class="nova-glass nova-empty">
          No servers saved yet. Add your first favorite above.
        </div>
        <div v-for="server in favoriteServers" :key="server.id" class="nova-glass nova-server-favorite">
          <div class="nova-favorite-icon" aria-hidden="true">▤</div>
          <div class="nova-favorite-details"><strong>{{ server.name }}</strong><code>{{ server.address }}</code></div>
          <div class="nova-server-buttons">
            <button class="nova-button nova-soft" @click="copyServer(server.address)">Copy IP</button>
            <button class="nova-button nova-soft" @click="editServer(server)">Edit</button>
            <button class="nova-button nova-soft" @click="removeServer(server)">Remove</button>
          </div>
        </div>
        <p class="nova-server-disclaimer">Saved Nova favorites are local to this launcher. Minecraft's in-game server list is not modified.</p>
      </div>

      <div v-else class="nova-content-stack nova-settings-content">
        <NovaSettings @profiles="navigate('profiles')" />
      </div>
    </section>
  </main>
</template>
