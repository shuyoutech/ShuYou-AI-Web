import type { App } from 'vue'
import ElementPlus from 'element-plus'
import en from 'element-plus/es/locale/lang/en'
import zhCN from 'element-plus/es/locale/lang/zh-cn'
import zhTW from 'element-plus/es/locale/lang/zh-tw'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

function install(app: App) {
  app.use(ElementPlus)
}

// 此处的对象属性和 src/locales/index.ts 中的 messages 对象属性一一对应
const locales: Record<string, any> = {
  'zh-cn': zhCN,
  'zh-tw': zhTW,
  'en': en,
}

export default { install }
export { locales }
