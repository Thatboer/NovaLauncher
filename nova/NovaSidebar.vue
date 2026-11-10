<script setup lang="ts">
import { computed, ref } from 'vue'
import logoUrl from './nova-logo.svg?url'
import { useRoute, useRouter } from 'vue-router'
const emit = defineEmits<{ create: []; settings: [] }>()
const logoBroken = ref(false)
const router = useRouter()
const route = useRoute()
const links = [
  { id: 'home', icon: '⌂', title: 'Home' },
  { id: 'installations', icon: '⬡', title: 'Installations' },
  { id: 'profiles', icon: '♙', title: 'Profiles' },
  { id: 'mods', icon: '✧', title: 'Mods' },
  { id: 'servers', icon: '▤', title: 'Servers' },
  { id: 'settings', icon: '⚙', title: 'Settings' },
]
const active = computed(() => route.path === '/' ? String(route.query.nova || 'home') : '')
function navigate(id: string) {
  if (id === 'settings') void router.push({ path: '/', query: { nova: 'settings' } })
  else void router.push({ path: '/', query: { nova: id } })
}
</script>
<template>
  <aside class="nova-sidebar">
    <div class="nova-side-brand"><img v-if="!logoBroken" class="nova-side-logo" :src="logoUrl" alt="" aria-hidden="true" @error="logoBroken = true"/><span v-else class="nova-small-logo-fallback" aria-hidden="true">N</span><span>Nova Launcher</span></div>
    <nav aria-label="Nova navigation">
      <button v-for="link in links" :key="link.id" :class="{ 'nova-active': active === link.id }" @click="navigate(link.id)">
        <span class="nova-nav-icon">{{ link.icon }}</span><span>{{ link.title }}</span>
      </button>
    </nav>
    <div class="nova-sidebar-footer">
      <button @click="emit('create')">+ New installation</button>
      <small>Minecraft Java Edition · Unofficial</small>
    </div>
  </aside>
</template>
