// 该文件为系统默认配置，请勿修改！！！

import type { RecursiveRequired, Settings } from '#/global'

const globalSettingsDefault: RecursiveRequired<Settings.all> = {
  app: {
    login: {
      permission: false,
      expiredMode: 'redirect',
    },
    routeMode: 'html5',
    routeBaseOn: 'frontend',
    menuBaseOn: 'frontend',
    dynamicTitle: false,
    watermark: false,
    feedback: false,
    lockScreen: false,
    errorLog: false,
    checkUpdates: false,
    rip: false,
    mobile: false,
    layout: {
      center: false,
      centerScope: 'inner',
      centerWidth: 1400,
    },
    home: {
      enable: false,
      title: 'app.route.home',
      fullPath: '/',
    },
    copyright: {
      enable: true,
      dates: '2025-present',
      company: '苏州数游科技有限公司',
      website: 'https://www.shuyoutech.com/',
      beian: '苏ICP备2025197988号',
    },
    preferences: {
      theme: false,
      menu: false,
      topbar: false,
      tabbar: false,
      toolbar: false,
      page: false,
    },
  },
  theme: {
    sync: true,
    light: 'default',
    dark: 'default',
    colorScheme: 'light',
    radius: 0.5,
    colorAmblyopia: false,
  },
  menu: {
    mode: 'side',
    style: '',
    dark: false,
    mainMenuClickMode: 'switch',
    subMenuUniqueExpand: true,
    subMenuCollapse: false,
    subMenuAutoCollapse: false,
    subMenuCollapseButton: false,
    hotkeys: false,
  },
  topbar: {
    tabbar: false,
    toolbar: false,
    mode: 'static',
    switchTabbarAndToolbar: false,
  },
  tabbar: {
    style: '',
    minMaxWidth: [150, 150],
    icon: false,
    dblclickAction: 'close',
    memory: false,
    hotkeys: false,
  },
  toolbar: {
    favorites: false,
    breadcrumb: {
      enable: true,
      style: 'classic',
      mainMenu: false,
    },
    menuSearch: {
      enable: true,
      hotkeys: true,
    },
    notification: false,
    i18n: {
      enable: false,
      defaultLang: '',
    },
    fullscreen: false,
    pageReload: false,
    colorScheme: false,
    layout: ['favorites', 'breadcrumb', '->', 'menuSearch', 'notification', 'i18n', 'fullscreen', 'pageReload', 'colorScheme'],
  },
  page: {
    hotkeys: true,
    iframeCacheMax: 3,
    transitionMode: '',
    progress: true,
  },
}

export default globalSettingsDefault
