<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { get, set, type AppSettings } from '@/helpers/settings'

const emit = defineEmits<{ profiles: [] }>()
type Category = 'general' | 'minecraft' | 'appearance' | 'downloads' | 'accounts' | 'advanced'
const categories: { id: Category; icon: string; title: string }[] = [
  { id: 'general', icon: '⚙', title: 'General' },
  { id: 'minecraft', icon: '▣', title: 'Minecraft' },
  { id: 'appearance', icon: '✿', title: 'Appearance' },
  { id: 'downloads', icon: '↓', title: 'Downloads' },
  { id: 'accounts', icon: '♙', title: 'Accounts' },
  { id: 'advanced', icon: '⚒', title: 'Advanced' },
]
const category = ref<Category>('appearance')
const engine = ref<AppSettings | null>(null)
const pending = ref(false)
const error = ref('')
const notice = ref('')
const glass = ref(55)
const blur = ref(16)
const motion = ref(true)
const reduceMotion = ref(false)
const glassKey = 'nova.appearance.opacity.v1'
const blurKey = 'nova.appearance.blur.v1'
const motionKey = 'nova.appearance.motion.v1'
const reducedKey = 'nova.appearance.reduced-motion.v1'
const constrain = (v: number, low: number, high: number) => Math.max(low, Math.min(high, Math.round(v)))
function applyAppearance() {
  const root = document.documentElement
  root.style.setProperty('--nova-glass-opacity', String(glass.value / 100))
  root.style.setProperty('--nova-inner-blur', blur.value + 'px')
  root.classList.toggle('nova-motion', motion.value && !reduceMotion.value)
  root.classList.toggle('nova-reduced-motion', reduceMotion.value)
}
function saveAppearance() {
  try {
    localStorage.setItem(glassKey, String(glass.value))
    localStorage.setItem(blurKey, String(blur.value))
    localStorage.setItem(motionKey, String(motion.value))
    localStorage.setItem(reducedKey, String(reduceMotion.value))
    applyAppearance()
    error.value = ''
    notice.value = 'Appearance saved on this device.'
  } catch {
    error.value = 'Unable to save appearance preferences.'
  }
}
function resetAppearance() {
  glass.value = 55
  blur.value = 16
  motion.value = true
  reduceMotion.value = false
  saveAppearance()
}
async function loadSettings() {
  error.value = ''
  try { engine.value = await get() }
  catch (e) { error.value = 'Could not load Minecraft settings: ' + String(e) }
}
onMounted(() => {
  try {
    glass.value = constrain(Number(localStorage.getItem(glassKey) || '55') || 55, 25, 85)
    blur.value = constrain(Number(localStorage.getItem(blurKey) || '16') || 16, 0, 24)
    motion.value = localStorage.getItem(motionKey) !== 'false'
    reduceMotion.value = localStorage.getItem(reducedKey) === 'true'
  } catch { /* Private storage may be unavailable; use safe defaults. */ }
  applyAppearance()
  void loadSettings()
})
async function updateEngine(patch: Partial<AppSettings>) {
  if (pending.value || !engine.value) return
  pending.value = true
  notice.value = ''
  error.value = ''
  try {
    // Always read the latest full settings, preserving fields Nova does not expose.
    const fresh = await get()
    const next: AppSettings = { ...fresh, ...patch }
    await set(next)
    engine.value = next
    notice.value = 'Launcher setting saved.'
  } catch (e) {
    error.value = 'Settings could not be saved: ' + String(e)
  } finally {
    pending.value = false
  }
}
function setMemoryMB(value: string) {
  if (!engine.value) return
  const mb = Number(value)
  if (!Number.isFinite(mb) || mb < 1024 || mb > 32768) return
  void updateEngine({ memory: { ...engine.value.memory, maximum: mb } })
}
function setDownloadCount(value: string) {
  const count = Number(value)
  if (!Number.isInteger(count) || count < 1 || count > 32) return
  void updateEngine({ max_concurrent_downloads: count })
}
function setWriteCount(value: string) {
  const count = Number(value)
  if (!Number.isInteger(count) || count < 1 || count > 16) return
  void updateEngine({ max_concurrent_writes: count })
}
</script>

<template>
  <div class="nova-settings-shell">
    <nav class="nova-settings-nav nova-glass" aria-label="Nova settings sections">
      <button v-for="item in categories" :key="item.id" class="nova-settings-category"
        :class="{ selected: category === item.id }" @click="category = item.id">
        <span aria-hidden="true">{{ item.icon }}</span>{{ item.title }}
      </button>
    </nav>

    <section class="nova-glass nova-settings-panel">
      <div class="nova-settings-top">
        <div><span class="nova-overline">NOVA LAUNCHER</span><h2>{{ categories.find(c => c.id === category)?.title }}</h2></div>
        <button v-if="category === 'appearance'" class="nova-button nova-soft" @click="resetAppearance">Reset appearance</button>
      </div>
      <p v-if="error" class="nova-error" role="alert">{{ error }}</p>
      <p v-if="notice" class="nova-settings-notice" role="status">{{ notice }}</p>

      <template v-if="category === 'appearance'">
        <div class="nova-setting-row">
          <div><strong>Theme</strong><small>NOVA Lavender Glass · Design #5</small></div>
          <span class="nova-setting-value">NOVA Lavender ▾</span>
        </div>
        <div class="nova-setting-row">
          <div><strong>Glass transparency</strong><small>How much of the Minecraft scenery shows through cards</small></div>
          <label class="nova-slider"><input v-model.number="glass" type="range" min="25" max="85" step="5" @change="saveAppearance"/><span>{{ glass }}%</span></label>
        </div>
        <div class="nova-setting-row">
          <div><strong>Background softness</strong><small>Home stays sharp; interior pages use frosted blur</small></div>
          <label class="nova-slider"><input v-model.number="blur" type="range" min="0" max="24" step="2" @change="saveAppearance"/><span>{{ blur }}px</span></label>
        </div>
        <div class="nova-setting-row">
          <div><strong>Background animation</strong><small>Gentle floating sakura petals</small></div>
          <label class="nova-switch"><input v-model="motion" type="checkbox" @change="saveAppearance"/><span/></label>
        </div>
        <div class="nova-setting-row">
          <div><strong>Reduce motion</strong><small>Disable decorative movement for a calmer UI</small></div>
          <label class="nova-switch"><input v-model="reduceMotion" type="checkbox" @change="saveAppearance"/><span/></label>
        </div>
      </template>

      <template v-else-if="category === 'general'">
        <p class="nova-settings-copy">Choose what NOVA does when you play Minecraft.</p>
        <div class="nova-setting-row">
          <div><strong>Minimize while Minecraft runs</strong><small>Keep NOVA out of the way once the game starts</small></div>
          <label class="nova-switch"><input type="checkbox" :checked="!!engine?.hide_on_process_start" :disabled="pending || !engine" @change="updateEngine({hide_on_process_start: !engine?.hide_on_process_start})"/><span/></label>
        </div>
        <div class="nova-setting-row">
          <div><strong>Return after Minecraft closes</strong><small>Bring the launcher back into focus</small></div>
          <label class="nova-switch"><input type="checkbox" :checked="!!engine?.refocus_on_game_close" :disabled="pending || !engine" @change="updateEngine({refocus_on_game_close: !engine?.refocus_on_game_close})"/><span/></label>
        </div>
        <div class="nova-setting-row">
          <div><strong>Show play time</strong><small>Display time spent in your installations</small></div>
          <label class="nova-switch"><input type="checkbox" :checked="!!engine?.show_play_time" :disabled="pending || !engine" @change="updateEngine({show_play_time: !engine?.show_play_time})"/><span/></label>
        </div>
      </template>

      <template v-else-if="category === 'minecraft'">
        <p class="nova-settings-copy">Default settings for your Minecraft Java installations.</p>
        <div class="nova-setting-row">
          <div><strong>Minecraft memory</strong><small>Maximum RAM available to the game</small></div>
          <select class="nova-settings-select" :value="engine?.memory.maximum || 4096" :disabled="pending || !engine" @change="setMemoryMB(($event.target as HTMLSelectElement).value)">
            <option v-for="mb in [1024,2048,3072,4096,6144,8192,12288,16384,24576,32768]" :key="mb" :value="mb">{{ mb / 1024 }} GB</option>
          </select>
        </div>
        <div class="nova-setting-row">
          <div><strong>Start Minecraft in fullscreen</strong><small>Use fullscreen when launching the game</small></div>
          <label class="nova-switch"><input type="checkbox" :checked="!!engine?.force_fullscreen" :disabled="pending || !engine" @change="updateEngine({force_fullscreen: !engine?.force_fullscreen})"/><span/></label>
        </div>
        <p class="nova-settings-copy">Installations can override these defaults individually.</p>
      </template>

      <template v-else-if="category === 'downloads'">
        <p class="nova-settings-copy">Control how many files NOVA downloads at once.</p>
        <div class="nova-setting-row">
          <div><strong>Simultaneous downloads</strong><small>Higher numbers may use more network bandwidth</small></div>
          <select class="nova-settings-select" :value="engine?.max_concurrent_downloads || 4" :disabled="pending || !engine" @change="setDownloadCount(($event.target as HTMLSelectElement).value)">
            <option v-for="n in [1,2,4,6,8,12,16,24,32]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <div class="nova-setting-row">
          <div><strong>Simultaneous file writes</strong><small>How many downloaded files NOVA saves at once</small></div>
          <select class="nova-settings-select" :value="engine?.max_concurrent_writes || 2" :disabled="pending || !engine" @change="setWriteCount(($event.target as HTMLSelectElement).value)">
            <option v-for="n in [1,2,4,6,8,12,16]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
      </template>

      <template v-else-if="category === 'accounts'">
        <div class="nova-settings-account">
          <div class="nova-settings-profile-symbol">♙</div>
          <div><h3>Minecraft accounts</h3><p>Sign in securely with Microsoft and manage your Java accounts on the Profiles page.</p>
          <button class="nova-button nova-primary" @click="emit('profiles')">Manage Minecraft accounts ›</button></div>
        </div>
      </template>

      <template v-else>
        <div class="nova-setting-row"><div><strong>NOVA Launcher</strong><small>Design #5 · Experimental build</small></div><span class="nova-setting-value">Test 0.6</span></div>
        <div class="nova-setting-row"><div><strong>Minecraft version</strong><small>Minecraft Java Edition</small></div><span>Java</span></div>
        <p class="nova-settings-copy">NOVA is independent and unofficial. Minecraft and Microsoft account systems are provided by their respective owners. Required upstream open-source credits and licenses are available with the source code.</p>
        <a class="nova-button nova-soft nova-settings-link" href="https://github.com/Thatboer/NovaLauncher/tree/modrinth-design5" target="_blank" rel="noopener noreferrer">View NOVA source and licenses ↗</a>
      </template>
    </section>
  </div>
</template>
