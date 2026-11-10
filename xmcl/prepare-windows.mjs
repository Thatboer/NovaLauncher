// Customize the pinned XMCL Windows packaging for an independent, unsigned Nova preview.
// This intentionally does not import XMCL's signing credentials or update endpoints.
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || '')
if (!process.argv[2]) throw new Error('Provide the XMCL source directory')
function transform(relative, modify) {
  const full = path.join(root, relative)
  const initial = fs.readFileSync(full, 'utf8')
  const changed = modify(initial)
  if (changed === initial) throw new Error('No packaging changes in ' + relative)
  fs.writeFileSync(full, changed)
}
function replaceExactly(source, search, replacement, description) {
  if (source.split(search).length !== 2) throw new Error('Expected exactly one ' + description)
  return source.replace(search, replacement)
}
transform('xmcl-electron-app/build/electron-builder.config.ts', source => {
  source = replaceExactly(source, "productName: 'XMCL'", "productName: 'Nova Launcher'", 'product name')
  source = replaceExactly(source, "appId: 'xmcl'", "appId: 'gg.novasmp.nova-launcher'", 'app ID')
  const start = source.indexOf("  publish: [{")
  const end = source.indexOf("  }],", start)
  if (start < 0 || end < start) throw new Error('Could not isolate upstream publisher')
  source = source.slice(0, start) + "  publish: []," + source.slice(end + "  }],".length)
  source = replaceExactly(source, "artifactName: 'xmcl-${version}-${platform}-${arch}.${ext}'",
    "artifactName: 'NovaLauncher-v2-${version}-${platform}-${arch}.${ext}'", 'artifact name')
  return source
})
transform('xmcl-electron-app/build.ts', source => {
  const anchor = '    ...electronBuilderConfig,'
  return replaceExactly(source, anchor,
    anchor + "\n    publish: [],\n    win: { ...electronBuilderConfig.win, target: [{ target: 'zip', arch: ['x64'] }] },",
    'electron-builder configuration')
})
transform('xmcl-electron-app/main/defaultApp.ts', source =>
  replaceExactly(source, "name: 'KeyStone Launcher'", "name: 'Nova Launcher'", 'launcher UI name')
    .replace("description: 'The default launcher UI'", "description: 'Nova Launcher for Minecraft Java Edition'")
    .replace("backgroundColor: '0x424242'", "backgroundColor: '0x785d99'"))
transform('xmcl-runtime/constant.ts', source =>
  replaceExactly(source, "LAUNCHER_NAME = 'xmcl'", "LAUNCHER_NAME = 'nova-launcher'", 'launcher data identity'))
const updatePlugin = path.join(root, 'xmcl-electron-app/main/pluginAutoUpdate.ts')
if (!fs.readFileSync(updatePlugin, 'utf8').includes('export const pluginAutoUpdate: LauncherAppPlugin')) {
  throw new Error('Unexpected upstream updater plugin')
}
fs.writeFileSync(updatePlugin, `// Nova preview deliberately does not check XMCL release/update channels.
import type { LauncherAppPlugin } from '@xmcl/runtime/app'
import { autoUpdater } from 'electron-updater'
export const pluginAutoUpdate: LauncherAppPlugin = async () => {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
}
`)
console.log('Prepared unsigned Nova Windows ZIP with separate identity and disabled upstream auto-updates.')
