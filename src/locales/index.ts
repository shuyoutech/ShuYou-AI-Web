import type { App } from 'vue'
import messages from '@intlify/unplugin-vue-i18n/messages'
import { cloneDeep } from 'es-toolkit'
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  legacy: false,
  flatJson: true,
  fallbackLocale: 'zh-cn',
  messages,
  missingWarn: false,
  fallbackWarn: false,
})

function install(app: App) {
  i18n.global.locale.value = 'zh-cn'
  app.use(i18n)
}

function getLocales() {
  return cloneDeep(messages)
}

const localesInfo: Record<string, { label: string, direction: 'ltr' | 'rtl' }> = {}
for (const key in messages) {
  switch (key) {
    case 'zh-cn':
      localesInfo[key] = { label: '中文(简体)', direction: 'ltr' }
      break
    case 'zh-tw':
      localesInfo[key] = { label: '中文(繁體)', direction: 'ltr' }
      break
    case 'en':
      localesInfo[key] = { label: 'English', direction: 'ltr' }
      break
  }
}

// 用于路由 meta 配置，方便在 VSCode I18n Ally 插件进行显示，无实际作用
function $t(key: string) {
  return key
}

export default { install }

export {
  $t,
  getLocales,
  i18n,
  localesInfo,
}
