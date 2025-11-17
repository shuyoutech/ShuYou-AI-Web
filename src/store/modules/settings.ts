import type { Settings } from '#/global'
import type { RouteLocationNormalized, RouteMeta } from 'vue-router'
import { cloneDeep } from 'es-toolkit'
import { getLocales, localesInfo } from '@/locales'
import settingsDefault from '@/settings'
import { merge } from '@/settings/utils.ts'

export const useAppSettingsStore = defineStore(
  // 唯一ID
  'appSettings',
  () => {
    const settings = ref(cloneDeep(settingsDefault))

    const prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)')
    watch(() => settings.value.theme.colorScheme, (val) => {
      if (val === '') {
        prefersColorScheme.addEventListener('change', updateTheme)
      }
      else {
        prefersColorScheme.removeEventListener('change', updateTheme)
      }
    }, {
      immediate: true,
    })

    const currentColorScheme = ref<Exclude<Settings.theme['colorScheme'], ''>>()
    watch([
      () => settings.value.theme.colorScheme,
      () => settings.value.theme.light,
      () => settings.value.theme.dark,
      () => settings.value.theme.sync,
    ], updateTheme, {
      immediate: true,
    })
    function updateTheme() {
      let colorScheme = settings.value.theme.colorScheme
      if (colorScheme === '') {
        colorScheme = prefersColorScheme.matches ? 'dark' : 'light'
      }
      currentColorScheme.value = colorScheme
      switch (colorScheme) {
        case 'light':
          document.documentElement.classList.remove('dark')
          document.body.setAttribute('data-theme', settings.value.theme.light)
          if (settings.value.theme.sync) {
            settings.value.theme.dark = settings.value.theme.light
          }
          break
        case 'dark':
          document.documentElement.classList.add('dark')
          document.body.setAttribute('data-theme', settings.value.theme.dark)
          if (settings.value.theme.sync) {
            settings.value.theme.light = settings.value.theme.dark
          }
          break
      }
    }

    watch(() => settings.value.theme.radius, (val) => {
      document.documentElement.style.removeProperty('--radius')
      document.documentElement.style.setProperty('--radius', `${val}rem`)
    }, {
      immediate: true,
    })
    watch([
      () => settings.value.app.rip,
      () => settings.value.theme.colorAmblyopia,
    ], (val) => {
      document.documentElement.style.removeProperty('filter')
      if (val[0] && val[1]) {
        document.documentElement.style.setProperty('filter', 'grayscale(100%) invert(80%)')
      }
      else if (val[0]) {
        document.documentElement.style.setProperty('filter', 'grayscale(100%)')
      }
      else if (val[1]) {
        document.documentElement.style.setProperty('filter', 'invert(80%)')
      }
    }, {
      immediate: true,
    })

    watch(() => settings.value.menu.subMenuAutoCollapse, (val) => {
      if (val) {
        settings.value.menu.subMenuCollapse = true
      }
    })
    watch(() => settings.value.menu.subMenuCollapse, (val) => {
      if (!val) {
        settings.value.menu.subMenuAutoCollapse = false
      }
    })

    watch(() => settings.value.menu.mode, (val) => {
      document.body.setAttribute('data-menu-mode', val)
    }, {
      immediate: true,
    })

    // 操作系统
    const os = ref<'mac' | 'windows' | 'linux' | 'other'>('other')
    const agent = navigator.userAgent.toLowerCase()
    switch (true) {
      case agent.includes('mac os'):
        os.value = 'mac'
        break
      case agent.includes('windows'):
        os.value = 'windows'
        break
      case agent.includes('linux'):
        os.value = 'linux'
        break
    }

    // 页面是否刷新
    const isReloading = ref(false)
    // 切换当前页面是否刷新
    function setIsReloading(value?: boolean) {
      isReloading.value = value ?? !isReloading.value
    }

    // 页面标题
    const title = ref<RouteMeta['title']>()
    // 记录页面标题
    function setTitle(_title: RouteMeta['title']) {
      title.value = _title
    }
    // 自定义标题
    const customTitleList = ref<{
      fullPath: RouteLocationNormalized['fullPath']
      title: string
    }[]>([])
    // 设置自定义标题
    function setCustomTitle(fullPath: RouteLocationNormalized['fullPath'], title: string) {
      const index = customTitleList.value.findIndex(item => item.fullPath === fullPath)
      if (index > -1) {
        customTitleList.value[index].title = title
      }
      else {
        customTitleList.value.push({
          fullPath,
          title,
        })
      }
    }
    // 重置自定义标题
    function resetCustomTitle(fullPath: RouteLocationNormalized['fullPath']) {
      const index = customTitleList.value.findIndex(item => item.fullPath === fullPath)
      if (index > -1) {
        customTitleList.value.splice(index, 1)
      }
    }

    // 显示模式
    const mode = ref<'pc' | 'mobile'>('pc')
    // 设置显示模式
    function setMode(width: number) {
      if (settings.value.app.mobile) {
        // 先判断 UA 是否为移动端设备（手机&平板）
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          mode.value = 'mobile'
        }
        else {
          // 如果是桌面设备，则根据页面宽度判断是否需要切换为移动端展示
          mode.value = width < 1024 ? 'mobile' : 'pc'
        }
      }
      else {
        mode.value = 'pc'
      }
    }

    // 切换侧边栏导航展开/收起
    function toggleSidebarCollapse() {
      settings.value.menu.subMenuCollapse = !settings.value.menu.subMenuCollapse
    }
    // 次导航是否收起（用于记录 pc 模式下最后的状态）
    const subMenuCollapseLastStatus = ref(settingsDefault.menu.subMenuCollapse)
    watch(() => settings.value.menu.subMenuCollapse, (val) => {
      if (mode.value === 'pc') {
        subMenuCollapseLastStatus.value = val
      }
    })
    watch(mode, (val) => {
      switch (val) {
        case 'pc':
          settings.value.menu.subMenuCollapse = subMenuCollapseLastStatus.value
          break
        case 'mobile':
          settings.value.menu.subMenuCollapse = true
          break
      }
      document.body.setAttribute('data-mode', val)
    }, {
      immediate: true,
    })

    // 切换侧边栏导航自动收起
    function toggleSidebarAutoCollapse() {
      settings.value.menu.subMenuAutoCollapse = !settings.value.menu.subMenuAutoCollapse
      if (settings.value.menu.subMenuAutoCollapse && !settings.value.menu.subMenuCollapse) {
        settings.value.menu.subMenuCollapse = true
      }
      if (!settings.value.menu.subMenuAutoCollapse && settings.value.menu.subMenuCollapse) {
        settings.value.menu.subMenuCollapse = false
      }
    }

    // 当前语言
    const lang = computed(() => {
      // 如果没设置默认语言，则返回当前浏览器语言设置默认语言
      if (settings.value.toolbar.i18n.defaultLang === '') {
        const lang = navigator.language.toLowerCase()
        const locales = getLocales()
        if (locales?.[lang]) {
          return lang
        }
      }
      return settings.value.toolbar.i18n.defaultLang
    })
    // 设置默认语言
    function setDefaultLang(lang: string) {
      settings.value.toolbar.i18n.defaultLang = lang
    }
    // 当前语言文本方向
    const langDirection = computed(() => localesInfo[lang.value].direction ?? 'ltr')
    watch(langDirection, (val) => {
      document.documentElement.setAttribute('dir', val)
    }, {
      immediate: true,
    })

    // 设置主题颜色模式
    function setColorScheme(color: Required<Settings.theme>['colorScheme']) {
      settings.value.theme.colorScheme = color
    }

    // 主页面是否最大化
    const mainPageMaximizeStatus = ref(false)
    // 切换当前主页面最大化
    function setMainPageMaximize(value?: boolean) {
      mainPageMaximizeStatus.value = value ?? !mainPageMaximizeStatus.value
    }

    // 更新应用配置
    function updateSettings(data: Settings.all, fromBase = false) {
      settings.value = merge(data, fromBase ? cloneDeep(settingsDefault) : settings.value)
    }

    return {
      settings,
      currentColorScheme,
      os,
      isReloading,
      setIsReloading,
      title,
      setTitle,
      customTitleList,
      setCustomTitle,
      resetCustomTitle,
      mode,
      setMode,
      subMenuCollapseLastStatus,
      toggleSidebarCollapse,
      toggleSidebarAutoCollapse,
      lang,
      setDefaultLang,
      langDirection,
      setColorScheme,
      mainPageMaximizeStatus,
      setMainPageMaximize,
      updateSettings,
    }
  },
)
