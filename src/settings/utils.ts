import type { RecursiveRequired, Settings, SettingsLegacy } from '#/global'
import { createDefu } from 'defu'
import { cloneDeep } from 'es-toolkit'
import settingsDefault from './default'

/** 合并对象 */
const merge = createDefu((obj, key, value) => {
  if (Array.isArray(obj[key]) && Array.isArray(value)) {
    obj[key] = value
    return true
  }
})

/** 合并对象，并移除不存在的属性 */
const mergeWithoutUndefinedProps = createDefu((obj, key, value) => {
  if (obj[key] === undefined) {
    delete obj[key]
    return true
  }
  if (Array.isArray(obj[key]) && Array.isArray(value)) {
    obj[key] = value
    return true
  }
})

function isObject(value: any) {
  return typeof value === 'object' && !Array.isArray(value)
}
/** 比较两个对象，提取出不同的部分 */
function diffTwoObj(originalObj: Record<string, any>, diffObj: Record<string, any>) {
  if (!isObject(originalObj) || !isObject(diffObj)) {
    return diffObj
  }
  const diff: Record<string, any> = {}
  for (const key in diffObj) {
    const originalValue = originalObj[key]
    const diffValue = diffObj[key]
    if (JSON.stringify(originalValue) !== JSON.stringify(diffValue)) {
      if (isObject(originalValue) && isObject(diffValue)) {
        const nestedDiff = diffTwoObj(originalValue, diffValue)
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff
        }
      }
      else {
        diff[key] = diffValue
      }
    }
  }
  return diff
}

function setSettings(settings: Settings.all) {
  return merge(settings, cloneDeep(settingsDefault))
}

/** 旧版配置，兼容 v5.x 版本 */
function setSettingsLegacy(settingsLegacy: SettingsLegacy.all) {
  const settingsDefaultLegacy: RecursiveRequired<SettingsLegacy.all> = {
    app: {
      themeSync: true,
      lightTheme: 'default',
      darkTheme: 'default',
      colorScheme: 'light',
      radius: 0.5,
      enableMournMode: false,
      enableColorAmblyopiaMode: false,
      defaultLang: '',
      enablePermission: false,
      enableProgress: true,
      enableDynamicTitle: false,
      enableWatermark: false,
      enableFeedback: false,
      enableErrorLog: false,
      loginExpiredMode: 'redirect',
      enableCheckUpdates: false,
      routeBaseOn: 'frontend',
      direction: 'ltr',
    },
    userPreferences: {
      enable: false,
      storageTo: 'local',
    },
    home: {
      enable: true,
      title: 'app.route.home',
      fullPath: '/',
    },
    layout: {
      widthMode: 'adaption',
      widthModeScope: 'outer',
      enableMobileAdaptation: false,
    },
    menu: {
      baseOn: 'frontend',
      mode: 'side',
      style: '',
      enableDark: false,
      mainMenuClickMode: 'switch',
      subMenuUniqueOpened: true,
      subMenuCollapse: false,
      subMenuAutoCollapse: false,
      enableSubMenuCollapseButton: false,
      enableHotkeys: false,
    },
    topbar: {
      mode: 'static',
      switchTabbarAndToolbar: false,
    },
    tabbar: {
      enable: false,
      style: '',
      enableIcon: false,
      dblclickAction: 'close',
      enableMemory: false,
      enableHotkeys: false,
      storageTo: 'local',
    },
    toolbar: {
      enable: true,
      favorites: false,
      breadcrumb: true,
      navSearch: true,
      notification: false,
      i18n: false,
      fullscreen: false,
      pageReload: false,
      colorScheme: false,
      layout: ['favorites', 'breadcrumb', '->', 'navSearch', 'notification', 'i18n', 'fullscreen', 'pageReload', 'colorScheme'],
    },
    favorites: {
      storageTo: 'local',
    },
    breadcrumb: {
      style: '',
      enableMainMenu: false,
    },
    mainPage: {
      enableHotkeys: true,
      iframeCacheMax: 3,
      enableTransition: true,
      transitionMode: 'fade',
    },
    navSearch: {
      enableHotkeys: true,
    },
    copyright: {
      enable: false,
      dates: '',
      company: '',
      website: '',
      beian: '',
    },
  }
  settingsLegacy = merge(settingsLegacy, cloneDeep(settingsDefaultLegacy))
  // 转换旧版配置到新版格式
  const settings: Settings.all = {
    app: {
      login: {
        permission: settingsLegacy.app?.enablePermission,
        expiredMode: settingsLegacy.app?.loginExpiredMode,
      },
      routeBaseOn: settingsLegacy.app?.routeBaseOn,
      menuBaseOn: settingsLegacy.menu?.baseOn,
      dynamicTitle: settingsLegacy.app?.enableDynamicTitle,
      watermark: settingsLegacy.app?.enableWatermark,
      feedback: settingsLegacy.app?.enableFeedback,
      errorLog: settingsLegacy.app?.enableErrorLog,
      checkUpdates: settingsLegacy.app?.enableCheckUpdates,
      rip: settingsLegacy.app?.enableMournMode,
      mobile: settingsLegacy.layout?.enableMobileAdaptation,
      layout: {
        center: settingsLegacy.layout?.widthMode === 'center',
        centerScope: settingsLegacy.layout?.widthModeScope,
      },
      home: {
        enable: settingsLegacy.home?.enable,
        title: settingsLegacy.home?.title,
        fullPath: settingsLegacy.home?.fullPath,
      },
      copyright: {
        enable: settingsLegacy.copyright?.enable,
        dates: settingsLegacy.copyright?.dates,
        company: settingsLegacy.copyright?.company,
        website: settingsLegacy.copyright?.website,
        beian: settingsLegacy.copyright?.beian,
      },
    },
    theme: {
      sync: settingsLegacy.app?.themeSync,
      light: settingsLegacy.app?.lightTheme,
      dark: settingsLegacy.app?.darkTheme,
      colorScheme: settingsLegacy.app?.colorScheme,
      radius: settingsLegacy.app?.radius,
      colorAmblyopia: settingsLegacy.app?.enableColorAmblyopiaMode,
    },
    menu: {
      mode: settingsLegacy.menu?.mode,
      style: settingsLegacy.menu?.style,
      dark: settingsLegacy.menu?.enableDark,
      mainMenuClickMode: settingsLegacy.menu?.mainMenuClickMode,
      subMenuUniqueExpand: settingsLegacy.menu?.subMenuUniqueOpened,
      subMenuCollapse: settingsLegacy.menu?.subMenuCollapse,
      subMenuAutoCollapse: settingsLegacy.menu?.subMenuAutoCollapse,
      subMenuCollapseButton: settingsLegacy.menu?.enableSubMenuCollapseButton,
      hotkeys: settingsLegacy.menu?.enableHotkeys,
    },
    topbar: {
      tabbar: settingsLegacy.tabbar?.enable,
      toolbar: settingsLegacy.toolbar?.enable,
      mode: settingsLegacy.topbar?.mode,
      switchTabbarAndToolbar: settingsLegacy.topbar?.switchTabbarAndToolbar,
    },
    tabbar: {
      style: settingsLegacy.tabbar?.style,
      icon: settingsLegacy.tabbar?.enableIcon,
      dblclickAction: settingsLegacy.tabbar?.dblclickAction,
      memory: settingsLegacy.tabbar?.enableMemory,
      hotkeys: settingsLegacy.tabbar?.enableHotkeys,
    },
    toolbar: {
      favorites: settingsLegacy.toolbar?.favorites,
      breadcrumb: {
        enable: settingsLegacy.toolbar?.breadcrumb,
        style: settingsLegacy.breadcrumb?.style === '' ? 'classic' : 'modern',
        mainMenu: settingsLegacy.breadcrumb?.enableMainMenu,
      },
      menuSearch: {
        enable: settingsLegacy.toolbar?.navSearch,
        hotkeys: settingsLegacy.navSearch?.enableHotkeys,
      },
      notification: settingsLegacy.toolbar?.notification,
      i18n: {
        enable: settingsLegacy.toolbar?.i18n,
        defaultLang: settingsLegacy.app?.defaultLang,
      },
      fullscreen: settingsLegacy.toolbar?.fullscreen,
      pageReload: settingsLegacy.toolbar?.pageReload,
      colorScheme: settingsLegacy.toolbar?.colorScheme,
      layout: settingsLegacy.toolbar?.layout?.map((item) => {
        if (item === 'navSearch') {
          return 'menuSearch'
        }
        return item
      }),
    },
    page: {
      hotkeys: settingsLegacy.mainPage?.enableHotkeys,
      iframeCacheMax: settingsLegacy.mainPage?.iframeCacheMax,
      transitionMode: settingsLegacy.mainPage?.transitionMode,
      progress: settingsLegacy.app?.enableProgress,
    },
  }
  const result = merge(settings, cloneDeep(settingsDefault))
  console.warn(
    '当前正在使用 v5.x 版本的配置，请尽快复制下方 v6.x 配置到 src/settings/index.ts 中替换\n',
    JSON.stringify(diffTwoObj(settingsDefault, result), null, 2),
  )
  return result
}

export {
  diffTwoObj,
  merge,
  mergeWithoutUndefinedProps,
  setSettings,
  setSettingsLegacy,
}
