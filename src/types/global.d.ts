import type { RouteRecordName, RouteRecordRaw } from 'vue-router'
import type themes from '../../themes'

type RecursiveRequired<T> = {
  [K in keyof T]-?: T[K] extends object | undefined ? RecursiveRequired<T[K]> : T[K]
}
type RecursivePartial<T> = {
  [K in keyof T]?: T[K] extends object | undefined ? RecursivePartial<T[K]> : T[K]
}
type PreferencesBoolean<T> = {
  [K in keyof T]?: boolean
}

declare namespace Settings {
  interface app {
    /**
     * 登录相关配置
     */
    login?: {
      /**
       * 是否开启权限功能
       * @description 控制是否启用权限验证功能
       * @default false
       */
      permission?: boolean
      /**
       * 登录过期模式
       * @description 当登录过期时的处理方式
       * @default 'redirect'
       * @example
       * 'redirect' - 跳转到登录页
       * 'popup' - 弹出登录窗口
       */
      expiredMode?: 'redirect' | 'popup'
    }
    /**
     * 路由模式
     * @description 设置应用的路由模式
     * @default 'hash'
     * @example
     * 'hash' - Hash 模式
     * 'html5' - HTML5 模式
     */
    routeMode?: 'hash' | 'html5'
    /**
     * 路由数据来源
     * @description 指定路由数据的来源方式
     * @default 'frontend'
     * @example
     * 'frontend' - 前端
     * 'backend' - 后端
     * 'filesystem' - 文件系统
     */
    routeBaseOn?: 'frontend' | 'backend' | 'filesystem'
    /**
     * 导航栏数据来源
     * @description 当 app.routeBaseOn 为 'filesystem' 时生效，指定导航栏数据的来源
     * @default 'frontend'
     * @example
     * 'frontend' - 前端
     * 'backend' - 后端
     */
    menuBaseOn?: 'frontend' | 'backend'
    /**
     * 是否开启动态标题
     * @description 控制是否启用动态页面标题功能
     * @default false
     */
    dynamicTitle?: boolean
    /**
     * 是否开启页面水印
     * @description 控制是否在页面上显示水印
     * @default false
     */
    watermark?: boolean
    /**
     * 是否开启反馈
     * @description 控制是否启用用户反馈功能
     * @default false
     */
    feedback?: boolean
    /**
     * 是否开启锁屏
     * @description 控制是否启用锁屏功能
     * @default false
     */
    lockScreen?: boolean
    /**
     * 是否在非开发环境开启错误日志功能
     * @description 控制是否在非开发环境下启用错误日志记录，具体业务代码在 /src/utils/errorLog.ts
     * @default false
     */
    errorLog?: boolean
    /**
     * 是否开启检查更新
     * @description 控制是否启用应用更新检查功能
     * @default false
     */
    checkUpdates?: boolean
    /**
     * 哀悼模式
     * @description 开启后网站将会整体变灰
     * @default false
     */
    rip?: boolean
    /**
     * 移动端适配
     * @description 开启后当页面宽度小于 1024px 时自动切换为移动端展示
     * @default false
     */
    mobile?: boolean
    /**
     * 布局相关配置
     */
    layout?: {
      /**
       * 是否开启居中布局
       * @description 控制是否启用居中布局模式
       * @default false
       */
      center?: boolean
      /**
       * 居中布局作用范围
       * @description 指定居中布局的作用范围
       * @default 'inner'
       * @example
       * 'inner' - 内层
       * 'outer' - 外层
       */
      centerScope?: 'inner' | 'outer'
      /**
       * 居中布局宽度
       * @description 设置居中布局的最大宽度
       * @default 1400
       */
      centerWidth?: number
    }
    /**
     * 主页相关配置
     */
    home?: {
      /**
       * 是否开启主页功能
       * @description 控制是否启用主页功能
       * @default true
       */
      enable?: boolean
      /**
       * 主页标题
       * @description 主页的标题，支持设置 i18n 的 key
       * @default 'app.route.home'
       */
      title?: string
      /**
       * 主页完整路径
       * @description 主页的完整路由路径
       * @default '/'
       */
      fullPath?: string
    }
    /**
     * 版权信息配置
     */
    copyright?: {
      /**
       * 是否开启版权信息显示
       * @description 控制是否显示底部版权信息，同时在路由 meta 对象里可以单独设置某个路由是否显示底部版权信息
       * @default false
       */
      enable?: boolean
      /**
       * 网站运行日期
       * @description 网站开始运行的日期
       * @default ''
       */
      dates?: string
      /**
       * 公司名称
       * @description 版权信息中显示的公司名称
       * @default ''
       */
      company?: string
      /**
       * 网站地址
       * @description 版权信息中显示的网站地址
       * @default ''
       */
      website?: string
      /**
       * 网站备案号
       * @description 版权信息中显示的网站备案号
       * @default ''
       */
      beian?: string
    }
    /**
     * 偏好设置
     * @description 用户偏好设置，可以控制各个功能模块的启用状态
     */
    preferences?: {
      [K in Exclude<keyof Settings.all, 'app'>]?: boolean | PreferencesBoolean<Settings.all[K]>
    }
  }

  interface theme {
    /**
     * 主题同步
     * @description 当开启时，切换颜色方案将共用一套主题
     * @default true
     */
    sync?: boolean
    /**
     * 亮色主题
     * @description 指定亮色模式下的主题
     * @default 'default'
     */
    light?: keyof typeof themes
    /**
     * 暗色主题
     * @description 指定暗色模式下的主题
     * @default 'default'
     */
    dark?: keyof typeof themes
    /**
     * 颜色方案
     * @description 设置应用的颜色方案
     * @default 'light'
     * @example
     * 'light' - 明亮模式
     * 'dark' - 暗黑模式
     * '' - 跟随系统
     */
    colorScheme?: 'light' | 'dark' | ''
    /**
     * 圆角系数
     * @description 设置界面元素的圆角大小，取值范围 0 到 1
     * @default 0.5
     * @example 0.5 - 中等圆角
     */
    radius?: number
    /**
     * 色弱模式
     * @description 启用色弱友好的颜色方案
     * @default false
     */
    colorAmblyopia?: boolean
  }

  interface menu {
    /**
     * 导航栏模式
     * @description 设置导航栏的显示模式
     * @default 'side'
     * @example
     * 'side' - 侧边栏模式（有主导航）
     * 'head' - 顶部模式
     * 'single' - 侧边栏模式（无主导航）
     * 'only-side' - 侧边栏精简模式
     * 'only-head' - 顶部精简模式
     * 'side-panel' - 侧边栏面板模式
     * 'head-panel' - 顶部面板模式
     */
    mode?: 'side' | 'head' | 'single' | 'only-side' | 'only-head' | 'side-panel' | 'head-panel'
    /**
     * 导航栏风格
     * @description 设置导航栏的视觉风格
     * @default ''
     * @example
     * '' - 默认风格
     * 'arrow' - 箭头风格
     * 'line' - 线条风格
     * 'dot' - 圆点风格
     */
    style?: '' | 'arrow' | 'line' | 'dot'
    /**
     * 暗色模式
     * @description 仅在亮色模式下生效，控制导航栏是否使用暗色主题
     * @default false
     */
    dark?: boolean
    /**
     * 主导航点击模式
     * @description 设置主导航菜单项的点击行为
     * @default 'switch'
     * @example
     * 'switch' - 切换
     * 'jump' - 跳转
     * 'smart' - 智能选择，判断次导航是否只有且只有一个可访问的菜单进行切换或跳转操作
     */
    mainMenuClickMode?: 'switch' | 'jump' | 'smart'
    /**
     * 次导航是否只保持一个子项的展开
     * @description 控制次导航是否只允许同时展开一个子菜单
     * @default true
     */
    subMenuUniqueExpand?: boolean
    /**
     * 次导航是否收起
     * @description 控制次导航的默认收起状态
     * @default false
     */
    subMenuCollapse?: boolean
    /**
     * 次导航是否自动收起
     * @description 控制次导航是否在特定条件下自动收起
     * @default false
     */
    subMenuAutoCollapse?: boolean
    /**
     * 是否开启次导航的展开/收起按钮
     * @description 控制是否显示次导航的展开/收起控制按钮
     * @default false
     */
    subMenuCollapseButton?: boolean
    /**
     * 是否开启快捷键
     * @description 控制是否启用导航相关的快捷键功能
     * @default false
     */
    hotkeys?: boolean
  }

  interface topbar {
    /**
     * 是否开启标签栏
     * @description 控制是否在顶栏显示标签栏
     * @default false
     */
    tabbar?: boolean
    /**
     * 是否开启工具栏
     * @description 控制是否在顶栏显示工具栏
     * @default false
     */
    toolbar?: boolean
    /**
     * 顶栏模式
     * @description 设置顶栏的显示模式
     * @default 'static'
     * @example
     * 'static' - 静止，跟随页面滚动
     * 'fixed' - 固定，不跟随页面滚动，始终固定在顶部
     * 'sticky' - 粘性，页面往下滚动时隐藏，往上滚动时显示
     */
    mode?: 'static' | 'fixed' | 'sticky'
    /**
     * 是否切换显示标签栏和工具栏的显示位置
     * @description 控制标签栏和工具栏的显示顺序
     * @default false
     * @example
     * false - 标签栏在工具栏上面
     * true - 工具栏在标签栏上面
     */
    switchTabbarAndToolbar?: boolean
  }

  interface tabbar {
    /**
     * 标签栏风格
     * @description 设置标签栏的视觉风格
     * @default ''
     * @example
     * '' - 默认风格
     * 'fashion' - 时尚风格
     * 'card' - 卡片风格
     * 'square' - 方块风格
     */
    style?: '' | 'fashion' | 'card' | 'square'
    /**
     * 最小最大宽度
     * @description 设置标签的最小和最大宽度，当设置为 'unset' 时为自适应
     * @default [150, 150]
     * @example
     * [150, 150] - 固定宽度 150px
     * [150, 'unset'] - 最小宽度 150px
     * ['unset', 150] - 最大宽度 150px
     * ['unset', 'unset'] - 跟随文字长度自适应
     */
    minMaxWidth?: readonly [number | 'unset', number | 'unset']
    /**
     * 是否显示图标
     * @description 控制标签是否显示图标
     * @default false
     */
    icon?: boolean
    /**
     * 双击执行动作
     * @description 设置双击标签时执行的动作
     * @default 'close'
     * @example
     * 'reload' - 刷新
     * 'close' - 关闭
     * 'pin' - 固定/取消固定
     * 'maximize' - 最大化
     * 'window' - 新窗口打开
     */
    dblclickAction?: 'reload' | 'close' | 'pin' | 'maximize' | 'window'
    /**
     * 是否开启记忆功能
     * @description 控制是否记住用户的标签操作状态
     * @default false
     */
    memory?: boolean
    /**
     * 是否开启快捷键
     * @description 控制是否启用标签栏相关的快捷键功能
     * @default false
     */
    hotkeys?: boolean
  }

  interface toolbar {
    /**
     * 收藏夹功能
     * @description 控制是否启用收藏夹功能
     * @default false
     */
    favorites?: boolean
    /**
     * 面包屑导航配置
     */
    breadcrumb?: {
      /**
       * 是否启用面包屑导航
       * @description 控制是否显示面包屑导航
       * @default true
       */
      enable?: boolean
      /**
       * 面包屑风格
       * @description 设置面包屑导航的视觉风格
       * @default 'classic'
       * @example
       * 'classic' - 经典风格
       * 'modern' - 现代风格
       */
      style?: 'classic' | 'modern'
      /**
       * 显示主导航
       * @description 控制是否在面包屑中显示主导航信息
       * @default false
       */
      mainMenu?: boolean
    }
    /**
     * 导航搜索配置
     */
    menuSearch?: {
      /**
       * 是否启用导航搜索
       * @description 控制是否启用菜单搜索功能
       * @default true
       */
      enable?: boolean
      /**
       * 是否开启快捷键
       * @description 控制是否启用导航搜索的快捷键
       * @default true
       */
      hotkeys?: boolean
    }
    /**
     * 通知中心
     * @description 控制是否启用通知中心功能
     * @default false
     */
    notification?: boolean
    /**
     * 国际化配置
     */
    i18n?: {
      /**
       * 是否启用国际化
       * @description 控制是否启用多语言切换功能
       * @default false
       */
      enable?: boolean
      /**
       * 默认语言
       * @description 设置应用的默认语言，参考 /src/locales/index.ts 里的语言列表
       * @default ''
       * @example '' - 跟随浏览器语言设置
       */
      defaultLang?: string
    }
    /**
     * 全屏功能
     * @description 控制是否启用全屏切换功能
     * @default false
     */
    fullscreen?: boolean
    /**
     * 页面刷新
     * @description 控制是否启用页面刷新功能
     * @default false
     */
    pageReload?: boolean
    /**
     * 颜色主题切换
     * @description 控制是否启用颜色主题切换功能
     * @default false
     */
    colorScheme?: boolean
    /**
     * 工具栏布局
     * @description 可自定义摆放位置和顺序，其中 '->' 为分隔符，用于分隔左右两侧的工具栏。设置时请确保默认值里的所有值都存在，不可删减。
     * @default ['favorites', 'breadcrumb', '->', 'menuSearch', 'notification', 'i18n', 'fullscreen', 'pageReload', 'colorScheme']
     */
    layout?: (Exclude<keyof toolbar, 'enable' | 'layout'> | '->')[]
  }

  interface page {
    /**
     * 是否开启快捷键
     * @description 控制是否启用页面相关的快捷键功能
     * @default true
     */
    hotkeys?: boolean
    /**
     * iframe 页面最大缓存数量
     * @description 设置 iframe 页面的最大缓存数量
     * @default 3
     */
    iframeCacheMax?: number
    /**
     * 页面切换动画
     * @description 设置页面切换时的动画效果
     * @default ''
     * @example
     * '' - 无动画
     * 'fade' - 淡入淡出
     * 'slide-left' - 向左滑动
     * 'slide-right' - 向右滑动
     * 'slide-top' - 向上滑动
     * 'slide-bottom' - 向下滑动
     */
    transitionMode?: '' | 'fade' | 'slide-left' | 'slide-right' | 'slide-top' | 'slide-bottom'
    /**
     * 载入进度条
     * @description 控制是否显示页面载入进度条
     * @default true
     */
    progress?: boolean
  }

  interface all {
    /**
     * 应用设置
     * @description 应用级别的全局配置
     */
    app?: app
    /**
     * 主题设置
     * @description 主题和样式相关的配置
     */
    theme?: theme
    /**
     * 导航栏设置
     * @description 导航菜单相关的配置
     */
    menu?: menu
    /**
     * 顶栏设置
     * @description 顶部工具栏相关的配置
     */
    topbar?: topbar
    /**
     * 标签栏设置
     * @description 标签页相关的配置
     */
    tabbar?: tabbar
    /**
     * 工具栏设置
     * @description 工具栏功能相关的配置
     */
    toolbar?: toolbar
    /**
     * 页面设置
     * @description 页面行为和显示相关的配置
     */
    page?: page
  }
}

declare namespace SettingsLegacy {
  interface app {
    /**
     * 主题同步，当开启时，切换颜色方案将共用一套主题
     * @默认值 `true`
     */
    themeSync?: boolean
    /**
     * 亮色主题
     * @默认值 `'default'`
     */
    lightTheme?: keyof typeof themes
    /**
     * 暗色主题
     * @默认值 `'default'`
     */
    darkTheme?: keyof typeof themes
    /**
     * 颜色方案
     * @默认值 `'light'` 明亮模式
     * @可选值 `'dark'` 暗黑模式
     * @可选值 `''` 跟随系统
     */
    colorScheme?: 'light' | 'dark' | ''
    /**
     * 圆角系数
     * @默认值 `0.5`
     * @可选值 `0到1区间的任意值`
     */
    radius?: number
    /**
     * 是否开启哀悼模式
     * @默认值 `false`
     */
    enableMournMode?: boolean
    /**
     * 是否开启色弱模式
     * @默认值 `false`
     */
    enableColorAmblyopiaMode?: boolean
    /**
     * 默认语言
     * @默认值 `''` 跟随浏览器语言设置
     * @可选值 参考 `/src/locales/index.ts` 里的语言列表
     */
    defaultLang?: string
    /**
     * 是否开启权限功能
     * @默认值 `false`
     */
    enablePermission?: boolean
    /**
     * 是否开启载入进度条
     * @默认值 `true`
     */
    enableProgress?: boolean
    /**
     * 是否开启动态标题
     * @默认值 `false`
     */
    enableDynamicTitle?: boolean
    /**
     * 是否开启页面水印
     * @默认值 `false`
     */
    enableWatermark?: boolean
    /**
     * 是否开启反馈
     * @默认值 `false`
     */
    enableFeedback?: boolean
    /**
     * 是否在非开发环境开启错误日志功能，具体业务代码在 `/src/utils/errorLog.ts`
     * @默认值 `false`
     */
    enableErrorLog?: boolean
    /**
     * 登录过期模式
     * @默认值 `'redirect'` 跳转到登录页
     * @可选值 `'popup'` 弹出登录窗口
     */
    loginExpiredMode?: 'redirect' | 'popup'
    /**
     * 是否开启检查更新
     * @默认值 `false`
     */
    enableCheckUpdates?: boolean
    /**
     * 路由数据来源
     * @默认值 `'frontend'` 前端
     * @可选值 `'backend'` 后端
     * @可选值 `'filesystem'` 文件系统
     */
    routeBaseOn?: 'frontend' | 'backend' | 'filesystem'
    /**
     * 文字方向
     * @默认值 `'ltr'` 从左到右
     * @可选值 `'rtl'` 从右到左
     */
    direction?: 'ltr' | 'rtl'
  }
  interface userPreferences {
    /**
     * 是否开启用户偏好设置
     * @默认值 `false`
     */
    enable?: boolean
    /**
     * 存储位置
     * @默认值 `'local'` 本地存储
     * @可选值 `'server'` 服务器存储
     */
    storageTo?: 'local' | 'server'
  }
  interface home {
    /**
     * 是否开启主页
     * @默认值 `true`
     */
    enable?: boolean
    /**
     * 主页名称，可直接设置名称，也可设置为 i18n 的 key
     * @默认值 `'app.route.home'`
     */
    title?: string
    /**
     * 主页完整路径
     * @默认值 `'/'`
     */
    fullPath?: string
  }
  interface layout {
    /**
     * 页宽模式，当设置为 `'center'` 时，可以去 /src/assets/styles/globals.css 里设置 `--g-app-width` 宽度变量
     * @默认值 `'adaption'` 自适应
     * @可选值 `'center'` 定宽居中
     */
    widthMode?: 'adaption' | 'center'
    /**
     * 页宽模式作用范围，仅在页宽模式为 `'center'` 时生效
     * @默认值 `'outer'` 外层
     * @可选值 `'inner'` 内层
     */
    widthModeScope?: 'outer' | 'inner'
    /**
     * 是否开启移动端适配，开启后当页面宽度小于 1024px 时自动切换为移动端展示
     * @默认值 `false`
     */
    enableMobileAdaptation?: boolean
  }
  interface menu {
    /**
     * 导航栏数据来源，当 `app.routeBaseOn: 'filesystem'` 时生效
     * @默认值 `'frontend'` 前端
     * @可选值 `'backend'` 后端
     */
    baseOn?: 'frontend' | 'backend'
    /**
     * 导航栏模式
     * @默认值 `'side'` 侧边栏模式（有主导航）
     * @可选值 `'head'` 顶部模式
     * @可选值 `'single'` 侧边栏模式（无主导航）
     * @可选值 `'only-side'` 侧边栏精简模式
     * @可选值 `'only-head'` 顶部精简模式
     * @可选值 `'side-panel'` 侧边栏面板模式
     * @可选值 `'head-panel'` 顶部面板模式
     */
    mode?: 'side' | 'head' | 'single' | 'only-side' | 'only-head' | 'side-panel' | 'head-panel'
    /**
     * 导航栏风格
     * @默认值 `''`
     * @可选值 `'arrow'` 箭头
     * @可选值 `'line'` 线条
     * @可选值 `'dot'` 圆点
     */
    style?: '' | 'arrow' | 'line' | 'dot'
    /**
     * 是否开启暗色模式，仅在亮色模式下生效
     * @默认值 `false`
     */
    enableDark?: boolean
    /**
     * 主导航点击模式
     * @默认值 `'switch'` 切换
     * @可选值 `'jump'` 跳转
     * @可选值 `'smart'` 智能选择，判断次导航是否只有且只有一个可访问的菜单进行切换或跳转操作
     */
    mainMenuClickMode?: 'switch' | 'jump' | 'smart'
    /**
     * 次导航是否只保持一个子项的展开
     * @默认值 `true`
     */
    subMenuUniqueOpened?: boolean
    /**
     * 次导航是否收起
     * @默认值 `false`
     */
    subMenuCollapse?: boolean
    /**
     * 次导航是否自动收起
     * @默认值 `false`
     */
    subMenuAutoCollapse?: boolean
    /**
     * 是否开启次导航的展开/收起按钮
     * @默认值 `false`
     */
    enableSubMenuCollapseButton?: boolean
    /**
     * 是否开启主导航切换快捷键
     * @默认值 `false`
     */
    enableHotkeys?: boolean
  }
  interface topbar {
    /**
     * 模式
     * @默认值 `'static'` 静止，跟随页面滚动
     * @可选值 `'fixed'` 固定，不跟随页面滚动，始终固定在顶部
     * @可选值 `'sticky'` 粘性，页面往下滚动时隐藏，往上滚动时显示
     */
    mode?: 'static' | 'fixed' | 'sticky'
    /**
     * 是否切换显示标签栏和工具栏的显示位置
     * @默认值 `false` 标签栏在工具栏上面
     * @可选值 `true` 工具栏在标签栏上面
     */
    switchTabbarAndToolbar?: boolean
  }
  interface tabbar {
    /**
     * 是否开启标签栏
     * @默认值 `false`
     */
    enable?: boolean
    /**
     * 标签栏风格
     * @默认值 `''` 默认
     * @可选值 `'fashion'` 时尚
     * @可选值 `'card'` 卡片
     * @可选值 `'square'` 方块
     */
    style?: '' | 'fashion' | 'card' | 'square'
    /**
     * 是否开启标签栏图标显示
     * @默认值 `false`
     */
    enableIcon?: boolean
    /**
     * 标签栏双击执行动作
     * @默认值 `'close'` 关闭
     * @可选值 `'reload'` 刷新
     * @可选值 `'pin'` 固定/取消固定
     * @可选值 `'maximize'` 最大化
     * @可选值 `'window'` 新窗口打开
     */
    dblclickAction?: 'reload' | 'close' | 'pin' | 'maximize' | 'window'
    /**
     * 是否开启标签栏记忆功能
     * @默认值 `false`
     */
    enableMemory?: boolean
    /**
     * 是否开启标签栏快捷键
     * @默认值 `false`
     */
    enableHotkeys?: boolean
    /**
     * 固定标签页存储位置
     * @默认值 `'local'` 本地存储
     * @可选值 `'server'` 服务器存储
     */
    storageTo?: 'local' | 'server'
  }
  interface toolbar {
    /**
     * 是否开启工具栏
     * @默认值 `true`
     */
    enable?: boolean
    /**
     * 是否开启收藏夹
     * @默认值 `false`
     */
    favorites?: boolean
    /**
     * 是否开启面包屑导航
     * @默认值 `true`
     */
    breadcrumb?: boolean
    /**
     * 是否开启导航搜索
     * @默认值 `true`
     */
    navSearch?: boolean
    /**
     * 是否开启通知中心
     * @默认值 `false`
     */
    notification?: boolean
    /**
     * 是否开启国际化
     * @默认值 `false`
     */
    i18n?: boolean
    /**
     * 是否开启全屏
     * @默认值 `false`
     */
    fullscreen?: boolean
    /**
     * 是否开启页面刷新
     * @默认值 `false`
     */
    pageReload?: boolean
    /**
     * 是否开启颜色主题
     * @默认值 `false`
     */
    colorScheme?: boolean
    /**
     * 布局设置，可自定义摆放位置和顺序，其中 `->` 为分隔符，用于分隔左右两侧的工具栏。修改时请确保默认值里的所有值都存在，不可删减。
     * @默认值 `['favorites', 'breadcrumb', '->', 'navSearch', 'notification', 'i18n', 'fullscreen', 'pageReload', 'colorScheme']`
     */
    layout?: (Exclude<keyof toolbar, 'enable' | 'layout'> | '->')[]
  }
  interface favorites {
    /**
     * 存储位置
     * @默认值 `'local'` 本地存储
     * @可选值 `'server'` 服务器存储
     */
    storageTo?: 'local' | 'server'
  }
  interface breadcrumb {
    /**
     * 面包屑导航风格
     * @默认值 `''` 默认
     * @可选值 `'modern'` 现代
     */
    style?: '' | 'modern'
    /**
     * 是否在面包屑导航里显示主导航
     * @默认值 `false`
     */
    enableMainMenu?: boolean
  }
  interface mainPage {
    /**
     * 是否开启页面快捷键
     * @默认值 `true`
     */
    enableHotkeys?: boolean
    /**
     * iframe 页面最大缓存数量
     * @默认值 `3`
     */
    iframeCacheMax?: number
    /**
     * 是否开启页面切换动画
     * @默认值 `true`
     */
    enableTransition?: boolean
    /**
     * 页面切换动画
     * @默认值 `'fade'` 淡入淡出
     * @可选值 `'slide-left'` 向左滑动
     * @可选值 `'slide-right'` 向右滑动
     * @可选值 `'slide-top'` 向上滑动
     * @可选值 `'slide-bottom'` 向下滑动
     */
    transitionMode?: 'fade' | 'slide-left' | 'slide-right' | 'slide-top' | 'slide-bottom'
  }
  interface navSearch {
    /**
     * 是否开启导航搜索快捷键
     * @默认值 `true`
     */
    enableHotkeys?: boolean
  }
  interface copyright {
    /**
     * 是否开启底部版权，同时在路由 meta 对象里可以单独设置某个路由是否显示底部版权信息
     * @默认值 `false`
     */
    enable?: boolean
    /**
     * 网站运行日期
     * @默认值 `''`
     */
    dates?: string
    /**
     * 公司名称
     * @默认值 `''`
     */
    company?: string
    /**
     * 网站地址
     * @默认值 `''`
     */
    website?: string
    /**
     * 网站备案号
     * @默认值 `''`
     */
    beian?: string
  }
  interface all {
    /** 应用设置 */
    app?: app
    /** 用户偏好设置 */
    userPreferences?: userPreferences
    /** 主页设置 */
    home?: home
    /** 布局设置 */
    layout?: layout
    /** 导航栏设置 */
    menu?: menu
    /** 顶栏设置 */
    topbar?: topbar
    /** 标签栏设置 */
    tabbar?: tabbar
    /** 工具栏设置 */
    toolbar?: toolbar
    /** 收藏夹设置 */
    favorites?: favorites
    /** 面包屑导航设置 */
    breadcrumb?: breadcrumb
    /** 页面设置 */
    mainPage?: mainPage
    /** 导航搜索设置 */
    navSearch?: navSearch
    /** 底部版权设置 */
    copyright?: copyright
  }
}

interface RouteMetaRaw {
  /**
   * 权限池
   * @description 对路由本身无实际作用，通常用于角色管理模块，展示路由可配置权限
   * @default undefined
   * @example
   * [
   *   { name: '新闻管理(浏览)', value: 'news:view' },
   *   { name: '新闻管理(编辑)', value: 'news:edit' }
   * ]
   */
  auths?: {
    name: string
    value: string
  }[]
  /**
   * 权限
   * @description 路由访问权限，配置为数组时，只需满足一个即可进入
   * @default undefined
   * @example
   * 'news:view' - 访问该路由时，需要具备 news:view 权限
   * ['news:view', 'news:edit'] - 访问该路由时，需要具备 news:view 或 news:edit 权限
   */
  auth?: string | string[]
  /**
   * 是否为单个一级导航
   * @description 该配置用于简化只想展示一级，没有二级导航的路由配置。
   * @default false
   */
  singleMenu?: boolean
  /**
   * 标题
   * @description 标题会在导航、标签页、面包屑等需要的展示位置显示
   * @default undefined
   * @example
   * '新闻管理' - 标题为新闻管理
   */
  title?: string | (() => string)
  /**
   * 路由 query 参数
   * @description 点击导航时进行路由跳转时，携带的参数
   * @default undefined
   * @example
   * { id: 1, name: 'test' } - 点击导航时，携带 id 参数为 1，name 参数为 test
   */
  query?: Record<string, T>
  /**
   * 图标
   * @description 如果配置为数组，则第一个为默认图标，第二个为激活图标
   * @default undefined
   * @example
   * 'i-ep:lock' - 默认显示 i-ep:lock 图标
   * ['i-ep:lock', 'i-ep:unlock'] - 默认显示 i-ep:lock 图标，激活时显示 i-ep:unlock 图标
   */
  icon?: string | [string, string]
  /**
   * 是否在导航中显示
   * @description 当子导航里没有可展示的导航时，会直接显示父导航
   * @default true
   */
  menu?: boolean
  /**
   * 高亮导航
   * @description 需要设置完整路由地址
   * @default undefined
   * @example '/news/list'
   */
  activeMenu?: string
  /**
   * 是否默认展开
   * @description 如果配置为数组，则第一个为默认展开状态，第二个是否始终展开
   * @default undefined
   * @example
   * true - 默认展开
   * [true, true] - 默认展开，且不允许收起
   */
  expand?: boolean | [boolean, boolean]
  /**
   * 徽章
   * @description 如果配置为数组，则第一个为徽章内容，第二个为徽章颜色
   * @default undefined
   * @example
   * 'PRO' - 显示徽章，内容为 PRO
   * [true, 'destructive'] - 显示徽章，内容为圆点，颜色为 'destructive'
   */
  badge?:
    boolean | string | number | (() => boolean | string | number)
    | [
      boolean | string | number | (() => boolean | string | number),
      'default' | 'secondary' | 'destructive' | (() => 'default' | 'secondary' | 'destructive'),
    ]
  /**
   * 导航排序
   * @description 数字越大越靠前
   * @default 0
   */
  sort?: number
  /**
   * 是否在面包屑中显示
   * @description 是否在面包屑导航中显示
   * @default true
   */
  breadcrumb?: boolean
  /**
   * 是否常驻标签页
   * @description 请勿在带有参数的路由上设置该特性
   * @default false
   */
  tabPermanent?: boolean
  /**
   * 标签页合并
   * @description 根据规则合并标签页
   * @default undefined
   * @example
   * 'routeName' - 根据路由名称合并
   * 'activeMenu' - 根据 activeMenu 属性合并
   */
  tabMerge?: 'routeName' | 'activeMenu'
  /**
   * 缓存
   * @description 根据规则缓存当前路由页面
   * @default undefined
   * @example
   * true - 始终缓存
   * 'news' - 访问路由name为news的页面时缓存
   * ['news', 'user'] - 访问路由name为news或user的页面时缓存
   */
  cache?: boolean | string | string[]
  /**
   * 不缓存
   * @description 根据规则不缓存当前路由页面
   * @default undefined
   * @example
   * 'news' - 访问路由name为news的页面时不缓存
   * ['news', 'user'] - 访问路由name为news或user的页面时不缓存
   */
  noCache?: string | string[]
  /**
   * 最大化
   * @description 如果配置为数组，则第一个为是否开启最大化，第二个为是否允许手动退出最大化
   * @default undefined
   * @example
   * true - 开启最大化
   * [true, false] - 开启最大化，允许手动退出最大化
   * [true, true] - 开启最大化，不允许手动退出最大化
   */
  maximize?: boolean | [boolean, boolean]
  /**
   * 新窗口
   * @description 是否在新窗口打开
   * @default false
   */
  newWindow?: boolean
  /**
   * iframe
   * @description 是否在iframe中打开
   * @default undefined
   * @example
   * 'https://fantastic-admin.hurui.me' - 在iframe中打开 Fantastic-admin 官网
   * true - 获取路由query中的iframe属性，并在iframe中打开
   */
  iframe?: string | boolean
  /**
   * 外部链接
   * @description 会在浏览器新窗口访问该链接
   * @default undefined
   * @example
   * 'https://fantastic-admin.hurui.me' - 在浏览器新窗口打开 Fantastic-admin 官网
   */
  link?: string
  /**
   * 布局
   */
  layout?: {
    /**
     * 是否居中
     * @description 如果不设置，则使用全局配置
     * @default undefined
     */
    center?: boolean
    /**
     * 作用范围
     * @description 如果不设置，则使用全局配置
     * @default undefined
     */
    centerScope?: 'inner' | 'outer'
    /**
     * 宽度
     * @description 如果不设置，则使用全局配置
     * @default undefined
     */
    centerWidth?: number
  }
  /**
   * 是否显示版权
   * @description 如果不设置，则使用全局配置
   * @default undefined
   */
  copyright?: boolean
  /**
   * 免登白名单
   * @description 开启后无需登录即可访问，仅支持在固定路由上生效
   * @default false
   */
  whiteList?: boolean
}

declare module 'vue-router' {
  interface RouteMeta extends RouteMetaRaw {}
}

declare namespace Route {
  interface recordMainRaw {
    meta?: Pick<RouteMetaRaw, 'auths' | 'auth' | 'title' | 'icon' | 'badge' | 'sort'>
    children: RouteRecordRaw[]
  }
}

declare namespace Menu {
  /** 原始 */
  interface recordRaw {
    path?: string
    meta?: Pick<RouteMetaRaw, 'auth' | 'title' | 'query' | 'icon' | 'menu' | 'expand' | 'badge' | 'newWindow' | 'link'>
    children?: recordRaw[]
  }
  /** 主导航 */
  interface recordMainRaw {
    meta?: Pick<RouteMetaRaw, 'auth' | 'title' | 'icon' | 'badge'>
    children: recordRaw[]
  }
}

declare namespace Tabbar {
  interface recordRaw extends Pick<RouteMetaRaw, 'title' | 'icon' | 'activeMenu' | 'tabPermanent' | 'tabMerge' | 'iframe'> {
    tabId: string
    fullPath: string
    routeName?: RouteRecordName | null
    name: string[]
    customTitleList: {
      fullPath: string
      title: string
    }[]
    isPin: boolean
  }
}

declare namespace Favorites {
  interface recordRaw {
    fullPath: string
    title?: string | (() => string)
    icon?: string
  }
}

declare namespace Iframe {
  interface recordRaw {
    path: string
    src: string
    title?: string | (() => string)
    isOpen: boolean
    isLoading: boolean
  }
}
