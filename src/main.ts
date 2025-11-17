import VWave from 'v-wave'
import VxeUI from 'vxe-pc-ui'
import VxeUITable from 'vxe-table'
import App from './App.vue'
import {vAuth} from './directives/auth'
import i18n from './locales'
import router from './router'
import pinia from './store'
import uiProvider from './ui/provider'
import '@/utils/storage'
import '@/utils/baidu'
import 'vxe-table/lib/style.css'
import 'vxe-pc-ui/lib/style.css'
import 'virtual:svg-icons-register'
import '@unocss/reset/tailwind-compat.css'
import 'virtual:uno.css'
import '@/assets/styles/globals.css'

const app = createApp(App)
app.use(VWave, {})
app.use(VxeUI).use(VxeUITable)
app.use(pinia)
app.use(router)
app.use(uiProvider)
app.use(i18n)
app.directive('auth', vAuth)
app.mount('#app')
