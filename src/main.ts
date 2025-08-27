import VWave from 'v-wave'
import VxeUI from 'vxe-pc-ui'
import VxeUITable from 'vxe-table'

// 加载 iconify 图标
import {downloadAndInstall} from '@/iconify'
import icons from '@/iconify/index.json'
// 自定义指令
import directive from '@/utils/directive'
// 错误日志上报
import errorLog from '@/utils/errorLog'

import App from './App.vue'
import router from './router'
import pinia from './stores'
import '@/utils/storage'
import '@/utils/systemCopyright'

import '@/utils/baidu'

import 'vxe-table/lib/style.css'
import 'vxe-pc-ui/lib/style.css'

// 加载 svg 图标
import 'virtual:svg-icons-register'
// UnoCSS
import '@unocss/reset/tailwind-compat.css'
import 'virtual:uno.css'
// 全局样式
import '@/assets/styles/globals.css'

const app = createApp(App)
app.use(VWave, {})
app.use(VxeUI).use(VxeUITable)
app.use(pinia)
app.use(router)
directive(app)
errorLog(app)
if (icons.isOfflineUse) {
  for (const info of icons.collections) {
    downloadAndInstall(info)
  }
}

app.mount('#app')
