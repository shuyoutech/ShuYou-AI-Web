import type { PluginOption } from 'vite'
import path from 'node:path'
import process from 'node:process'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import vueLegacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import Unocss from 'unocss/vite'
import autoImport from 'unplugin-auto-import/vite'
import TurboConsole from 'unplugin-turbo-console/vite'
import components from 'unplugin-vue-components/vite'
import { loadEnv } from 'vite'
import Archiver from 'vite-plugin-archiver'
import banner from 'vite-plugin-banner'
import { compression } from 'vite-plugin-compression2'
import { envParse, parseLoadedEnv } from 'vite-plugin-env-parse'
import { vitePluginFakeServer } from 'vite-plugin-fake-server'
import Pages from 'vite-plugin-pages'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import VueDevTools from 'vite-plugin-vue-devtools'
import Layouts from 'vite-plugin-vue-meta-layouts'

export default function createVitePlugins(mode: string, isBuild = false) {
  const viteEnv = parseLoadedEnv(loadEnv(mode, process.cwd()))
  const vitePlugins: (PluginOption | PluginOption[])[] = [
    vue(),
    vueJsx(),
    vueLegacy({
      renderLegacyChunks: false,
      modernPolyfills: [
        'es.array.at',
        'es.array.find-last',
        'es.object.has-own',
      ],
    }),

    // https://github.com/vuejs/devtools
    viteEnv.VITE_OPEN_DEVTOOLS && VueDevTools({
      launchEditor: viteEnv.VITE_VUE_DEVTOOLS_LAUNCH_EDITOR ?? 'vscode',
    }),

    envParse({
      dtsPath: 'src/types/env.d.ts',
    }),

    // https://github.com/unplugin/unplugin-auto-import
    autoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
        'vue-i18n',
      ],
      dts: './src/types/auto-imports.d.ts',
      dirs: [
        './src/store/modules/**/*',
        './src/composables/**/*',
        './src/ui/components/FaDrawer/index.ts',
        './src/ui/components/FaModal/index.ts',
        './src/ui/components/FaLoading/index.ts',
        './src/ui/components/FaToast/index.ts',
        './src/ui/components/FaNotification/index.ts',
      ],
    }),

    // https://github.com/unplugin/unplugin-vue-components
    components({
      globs: [
        'src/ui/components/*/index.vue',
        'src/components/*/index.vue',
      ],
      dts: './src/types/components.d.ts',
    }),

    Unocss(),

    // https://github.com/vbenjs/vite-plugin-svg-icons
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), 'src/assets/icons/')],
      symbolId: 'icon-[dir]-[name]',
      svgoOptions: isBuild,
    }),

    // https://github.com/condorheroblog/vite-plugin-fake-server
    vitePluginFakeServer({
      logger: !isBuild,
      include: 'src/mock',
      infixName: false,
      enableProd: isBuild && viteEnv.VITE_BUILD_MOCK,
    }),

    // https://github.com/intlify/vue-i18n
    vueI18n({
      include: path.resolve(process.cwd(), 'src/locales/lang/**'),
    }),

    // https://github.com/dishait/vite-plugin-vue-meta-layouts
    Layouts({
      defaultLayout: 'index',
      metaName: 'layouts',
    }),

    // https://github.com/hannoeru/vite-plugin-pages
    Pages({
      dirs: 'src/views',
      exclude: [
        '**/components/**/*.vue',
      ],
    }),

    // https://github.com/nonzzz/vite-plugin-compression
    viteEnv.VITE_BUILD_COMPRESS && compression({
      exclude: [/\.(br)$/, /\.(gz)$/],
      algorithms: viteEnv.VITE_BUILD_COMPRESS.split(',').map((item: string) => ({
        gzip: 'gzip',
        brotli: 'brotliCompress',
      }[item])),
    }),

    viteEnv.VITE_BUILD_ARCHIVE && Archiver({
      archiveType: viteEnv.VITE_BUILD_ARCHIVE,
    }),

    // https://github.com/unplugin/unplugin-turbo-console
    TurboConsole(),

    // https://github.com/chengpeiquan/vite-plugin-banner
    banner(` https://ai.shuyoutech.com `),

  ]
  return vitePlugins
}
