import { setSettings } from './utils'

export default setSettings({
  app: {
    login: {
      permission: true,
    },
    dynamicTitle: true,
    feedback: true,
    lockScreen: true,
    errorLog: true,
    checkUpdates: true,
    mobile: true,
    copyright: {
      enable: true,
      dates: '2025-present',
      company: '苏州数游科技有限公司',
      website: 'https://www.shuyoutech.com/',
    },
    preferences: {
      theme: true,
      menu: true,
      topbar: true,
      tabbar: true,
      toolbar: true,
      page: true,
    },
  },
  menu: {
    style: 'dot',
    subMenuCollapseButton: true,
    hotkeys: true,
  },
  topbar: {
    tabbar: true,
    toolbar: true,
    mode: 'fixed',
  },
  tabbar: {
    style: 'fashion',
    icon: true,
    memory: true,
    hotkeys: true,
  },
  toolbar: {
    favorites: true,
    breadcrumb: {
      style: 'modern',
      mainMenu: true,
    },
    notification: true,
    i18n: {
      enable: true,
    },
    fullscreen: true,
    pageReload: true,
    colorScheme: true,
  },
  page: {
    hotkeys: true,
    iframeCacheMax: 9,
    transitionMode: 'slide-right',
  },
})
