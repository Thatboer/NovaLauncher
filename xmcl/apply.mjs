// Nova Launcher v2 overlay for a pinned X Minecraft Launcher upstream checkout.
// MIT copyright attribution is preserved; existing XMCL services remain intact.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const source = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(process.argv[2] || '')
if (!process.argv[2] || !fs.existsSync(path.join(root, 'xmcl-keystone-ui/src/windows/main/App.vue'))) {
  throw new Error('Usage: node xmcl/apply.mjs <pinned-xmcl-source-directory>')
}
const renderer = path.join(root, 'xmcl-keystone-ui/src')
const mainApp = path.join(renderer, 'windows/main/App.vue')
let app = fs.readFileSync(mainApp, 'utf8')
const scriptStart = app.indexOf('<script lang=ts setup>')
const templateStart = app.indexOf('<template>')
if (templateStart !== 0 || scriptStart < 0 || app.includes('NovaShell')) {
  throw new Error('Unexpected XMCL root layout or Nova already installed; refusing to overwrite')
}
const novaTemplate = `<template>
  <v-app v-if="!showSetup" class="nova-root h-full max-h-screen overflow-hidden">
    <NovaShell />
    <AppNotifier />
    <AppAddInstanceDialog />
    <AppGameExitDialog />
    <AppUnauthenticatedWarningDialog />
    <AppMultiplayerLoginDialog />
    <AppImageDialog />
    <InstanceScreenshots />
    <AppSharedTooltip />
    <UserProfileDialog :value="userProfileDialogShown" @input="userProfileDialogShown = $event" />
    <component :is="lazyDialogComponent" v-if="lazyDialogComponent" />
  </v-app>
  <v-app v-else class="nova-root h-full max-h-screen overflow-hidden">
    <AppSystemBar no-user no-task />
    <Setup @ready="onReady" />
    <UserProfileDialog :value="userProfileDialogShown" @input="userProfileDialogShown = $event" />
    <component :is="lazyDialogComponent" v-if="lazyDialogComponent" />
  </v-app>
</template>

`
app = novaTemplate + app.slice(scriptStart)
const importAnchor = "import '@/assets/common.css'"
if (!app.includes(importAnchor)) throw new Error('Upstream common.css import moved')
app = app.replace(importAnchor, importAnchor +
  "\nimport NovaShell from '@/nova/NovaShell.vue'\nimport '@/nova/nova.css'")
const dest = path.join(renderer, 'nova')
if (fs.existsSync(dest)) throw new Error('Nova directory already exists upstream')
fs.mkdirSync(dest, { recursive: true })
for (const file of ['NovaShell.vue', 'nova.css']) {
  fs.copyFileSync(path.join(source, file), path.join(dest, file))
}
fs.copyFileSync(path.join(source, '..', 'nova', 'cherry-grove.avif'), path.join(dest, 'cherry-grove.avif'))
fs.copyFileSync(mainApp, mainApp + '.nova-original')
fs.writeFileSync(mainApp, app)
const indexHtml = path.join(renderer, 'index.html')
const html = fs.readFileSync(indexHtml, 'utf8')
if (!html.includes('<title>X Minecraft Launcher</title>')) throw new Error('Unexpected XMCL renderer title')
fs.writeFileSync(indexHtml,
  html.replace('<title>X Minecraft Launcher</title>', '<title>Nova Launcher</title>')
    .replace('<img src="./assets/logo.webp" alt="Logo">', '<span style="color:#f6dcff;font:900 62px Inter,sans-serif">N</span>'))
console.log('Nova v2 UI installed on XMCL renderer. XMCL backend/account/instance providers retained.')
