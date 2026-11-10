<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { get_default_user, login as loginFlow, remove_user, set_default_user, users } from '@/helpers/auth'

type MinecraftAccount = { profile: { id: string; name: string } }
const emit = defineEmits<{ installations: [] }>()
const accounts = ref<MinecraftAccount[]>([])
const selectedId = ref<string | undefined>()
const busy = ref(false)
const errorMessage = ref('')
const selected = computed(() => accounts.value.find(account => account.profile.id === selectedId.value))
const playerImage = computed(() => {
  const id = selected.value?.profile.id
  return id && /^[0-9a-f-]{32,36}$/i.test(id)
    ? 'https://mc-heads.net/avatar/' + encodeURIComponent(id) + '/80'
    : ''
})
async function refresh() {
  const [active, loaded] = await Promise.all([get_default_user(), users()])
  selectedId.value = active
  accounts.value = Array.isArray(loaded) ? loaded : []
  if (accounts.value.length && !selected.value) {
    selectedId.value = accounts.value[0].profile.id
  }
}
async function signIn() {
  if (busy.value) return
  busy.value = true
  errorMessage.value = ''
  try {
    const loggedIn = await loginFlow()
    if (loggedIn?.profile?.id) {
      await set_default_user(loggedIn.profile.id)
      await refresh()
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    busy.value = false
  }
}
async function selectAccount(account: MinecraftAccount) {
  if (busy.value) return
  busy.value = true
  errorMessage.value = ''
  try {
    await set_default_user(account.profile.id)
    await refresh()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    busy.value = false
  }
}
async function removeAccount(account: MinecraftAccount) {
  if (busy.value || !window.confirm('Sign out ' + account.profile.name + ' from Nova Launcher?')) return
  busy.value = true
  errorMessage.value = ''
  try {
    await remove_user(account.profile.id)
    await refresh()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    busy.value = false
  }
}
onMounted(() => {
  void refresh().catch(error => {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  })
})
</script>

<template>
  <div class="nova-profile-layout">
    <div class="nova-profile-head">
      <div><span class="nova-overline">YOUR MINECRAFT IDENTITY</span><p>Microsoft accounts, skins and game profiles.</p></div>
      <button class="nova-button nova-primary" :disabled="busy" @click="signIn">+ Add Microsoft Account</button>
    </div>
    <p v-if="errorMessage" class="nova-error" role="alert">{{ errorMessage }}</p>
    <div class="nova-profile-grid">
      <div class="nova-profile-stack">
        <section class="nova-glass nova-profile-panel nova-account-hero">
          <div class="nova-avatar-frame">
            <img v-if="playerImage" :src="playerImage" alt="Selected Minecraft player avatar"/>
            <span v-else aria-hidden="true">♙</span>
          </div>
          <div class="nova-account-hero-info">
            <small class="nova-overline">SELECTED ACCOUNT</small>
            <h2>{{ selected?.profile.name || 'Not signed in' }}</h2>
            <p>{{ selected ? 'Microsoft account · Minecraft Java Edition' : 'Connect your Microsoft Minecraft account to start playing.' }}</p>
            <button class="nova-button nova-soft" :disabled="busy" @click="signIn">{{ selected ? 'Add or switch account' : 'Sign in to Minecraft' }}</button>
          </div>
        </section>
        <section class="nova-glass nova-profile-panel">
          <h2>Minecraft appearance</h2>
          <div class="nova-setting-line"><span>Player skin</span><strong>{{ selected ? 'Your Minecraft skin' : 'Sign in to view' }}</strong></div>
          <div class="nova-setting-line"><span>Cape</span><strong>{{ selected ? 'Managed by your account' : 'Not signed in' }}</strong></div>
          <div class="nova-setting-line"><span>Customization</span><strong>Official Minecraft profile</strong></div>
          <p class="nova-note">Skin and cape changes are managed through your Microsoft Minecraft profile.</p>
        </section>
      </div>
      <div class="nova-profile-stack">
        <section class="nova-glass nova-profile-panel">
          <h2>Account status</h2>
          <div class="nova-setting-line"><span>Sign-in method</span><strong>{{ selected ? 'Microsoft' : 'Not signed in' }}</strong></div>
          <div class="nova-setting-line"><span>Game edition</span><strong>Java Edition</strong></div>
          <div class="nova-setting-line"><span>Account selected</span><strong>{{ selected ? 'Yes' : 'No' }}</strong></div>
        </section>
        <section class="nova-glass nova-profile-panel">
          <h2>Your accounts</h2>
          <p v-if="!accounts.length">Add a Microsoft account to manage your Minecraft profiles here.</p>
          <div v-for="account in accounts" :key="account.profile.id" class="nova-account-row">
            <button class="nova-account-pick" :disabled="busy" @click="selectAccount(account)">
              <span>{{ account.profile.id === selectedId ? '◉' : '○' }}</span>
              {{ account.profile.name }}
            </button>
            <button class="nova-account-remove" :disabled="busy" :aria-label="'Remove ' + account.profile.name" @click="removeAccount(account)">Remove</button>
          </div>
          <button class="nova-button nova-soft" @click="emit('installations')">View game installations ›</button>
        </section>
      </div>
    </div>
  </div>
</template>
