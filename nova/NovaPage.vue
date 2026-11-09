<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { injectNotificationManager } from '@modrinth/ui'
import { run } from '@/helpers/instance'
import type { GameInstance } from '@/helpers/types'
import AccountsCard from '@/features/minecraft-accounts/accounts-card.vue'

type ModHit = {
  project_id: string
  title: string
  description: string
  icon_url?: string
  author: string
  downloads: number
}
const props = defineProps<{ instances: GameInstance[] }>()
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
  try {
    const url = new URL('https://api.modrinth.com/v2/search')
    url.searchParams.set('query', modQuery.value)
    url.searchParams.set('facets', '[["project_type:mod"]]')
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
function browse(type: string) {
  void router.push('/browse/' + type)
}
function openMod(hit: ModHit) {
  void router.push('/project/' + encodeURIComponent(hit.project_id))
}
function openSettings() {
  emit('settings')
}
</script>

<template>
  <main class="nova-page">
    <section v-if="page === 'home'" class="nova-home">
      <div class="nova-home-center">
        <div class="nova-star">✧</div>
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
        <button class="nova-glass nova-tile" @click="navigate('mods')"><b>✧</b><span><strong>Mods</strong><small>Browse real Modrinth projects</small></span><em>›</em></button>
        <button class="nova-glass nova-tile" @click="navigate('servers')"><b>▤</b><span><strong>Servers</strong><small>Your Minecraft connections</small></span><em>›</em></button>
      </div>
    </section>

    <section v-else class="nova-content">
      <header class="nova-section-head">
        <div>
          <h1>{{ ({ installations: 'Installations', profiles: 'Profiles', mods: 'Mods', servers: 'Servers', settings: 'Settings' } as Record<string,string>)[page] }}</h1>
          <p v-if="page === 'installations'">Manage Minecraft versions and modded instances.</p>
          <p v-else-if="page === 'profiles'">Use your existing Microsoft Minecraft account.</p>
          <p v-else-if="page === 'mods'">Real mod icons, descriptions, authors and download counts from Modrinth.</p>
          <p v-else-if="page === 'servers'">Favorite servers and the NovaSMP community.</p>
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
        <div class="nova-glass nova-detail">
          <h2>Minecraft account</h2>
          <p>Sign in or switch accounts using the existing secure Minecraft account manager.</p>
          <AccountsCard />
        </div>
        <div class="nova-glass nova-detail">
          <h2>Game profiles</h2>
          <p>Each Minecraft installation keeps its own mods and configuration. Manage them under Installations.</p>
          <button class="nova-button nova-primary" @click="navigate('installations')">View installations</button>
        </div>
      </div>

      <div v-else-if="page === 'mods'" class="nova-content-stack">
        <form class="nova-mod-search" @submit.prevent="searchMods">
          <input v-model="modQuery" class="nova-glass" placeholder="Search Minecraft mods..." aria-label="Search Minecraft mods" />
          <button class="nova-button nova-primary" :disabled="modLoading" type="submit">{{ modLoading ? 'Searching…' : 'Search' }}</button>
          <button class="nova-button nova-soft" type="button" @click="browse('modpack')">Modpacks</button>
          <button class="nova-button nova-soft" type="button" @click="browse('shader')">Shaders</button>
        </form>
        <p v-if="modError" class="nova-error">{{ modError }}</p>
        <div class="nova-mod-grid">
          <button v-for="mod in modHits" :key="mod.project_id" class="nova-glass nova-mod" @click="openMod(mod)">
            <img v-if="mod.icon_url" :src="mod.icon_url" :alt="mod.title + ' icon'" loading="lazy"/>
            <div class="nova-mod-text"><strong>{{ mod.title }}</strong><small>by {{ mod.author }} · {{ mod.downloads.toLocaleString() }} downloads</small><p>{{ mod.description }}</p><span>View details and install ↗</span></div>
          </button>
        </div>
      </div>

      <div v-else-if="page === 'servers'" class="nova-content-stack">
        <div class="nova-glass nova-detail">
          <h2>NovaSMP</h2>
          <p>Server connection and status will be connected to the official NovaSMP information. No invented player counts or server address.</p>
          <a class="nova-button nova-primary nova-inline-link" href="https://web.novasmp.gg" target="_blank" rel="noopener noreferrer">NovaSMP website ↗</a>
        </div>
        <div class="nova-glass nova-detail">
          <h2>Other servers</h2>
          <p>Use your Minecraft multiplayer screen to connect to other servers. A managed favorite-server list is planned for Nova.</p>
        </div>
      </div>

      <div v-else class="nova-content-stack">
        <div class="nova-glass nova-detail">
          <h2>Launcher settings</h2>
          <p>Memory, Java, download options, appearance, and account preferences use the established settings underneath the Nova interface.</p>
          <button class="nova-button nova-primary" @click="openSettings">Open launcher settings</button>
        </div>
        <div class="nova-glass nova-detail"><h2>Appearance</h2><p>Cherry Grove Glass · Lavender · Frosted panels · Reduced-motion friendly</p></div>
      </div>
    </section>
  </main>
</template>
