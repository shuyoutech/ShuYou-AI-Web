<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const routes = router.options.routes.filter(route => route.meta && route.meta.show)

// 判断当前路由是否激活
function isRouteActive(routePath: string) {
  const currentPath = route.path
  // 如果当前路径以路由路径开头，则认为是激活状态
  return currentPath.startsWith(routePath)
}

// 获取当前激活的路由路径
const activeRoute = computed(() => {
  const currentPath = route.path
  // 找到匹配的路由前缀
  const matchedRoute = routes.find(route => currentPath.startsWith(route.path))
  return matchedRoute ? matchedRoute.path : '/'
})

// 为不同菜单项设置不同的图标颜色
function getIconClass(path: string) {
  const baseClass = 'mr-1 text-base transition-colors duration-200'
  const isActive = isRouteActive(path)

  switch (path) {
    case '/chat':
      return `${baseClass} ${isActive ? 'text-blue-600' : 'text-blue-500 hover:text-blue-600'}`
    case '/image':
      return `${baseClass} ${isActive ? 'text-purple-600' : 'text-purple-500 hover:text-purple-600'}`
    case '/video':
      return `${baseClass} ${isActive ? 'text-red-600' : 'text-red-500 hover:text-red-600'}`
    case '/audio':
      return `${baseClass} ${isActive ? 'text-green-600' : 'text-green-500 hover:text-green-600'}`
    case '/model':
      return `${baseClass} ${isActive ? 'text-indigo-600' : 'text-indigo-500 hover:text-indigo-600'}`
    case '/app':
      return `${baseClass} ${isActive ? 'text-orange-600' : 'text-orange-500 hover:text-orange-600'}`
    case '/settings':
      return `${baseClass} ${isActive ? 'text-gray-600' : 'text-gray-500 hover:text-gray-600'}`
    default:
      return `${baseClass} ${isActive ? 'text-gray-600' : 'text-gray-400 hover:text-gray-500'}`
  }
}
</script>

<template>
  <div class="menu-wrap">
    <el-menu
      router
      :default-active="activeRoute"
      class="el-menu-vertical-demo"
      :collapse="false"
      :collapse-transition="false"
      mode="horizontal"
      :ellipsis="false"
    >
      <template v-for="routeItem in routes" :key="routeItem.name">
        <el-menu-item
          v-if="routeItem.meta && routeItem.meta.show"
          :index="routeItem.path"
          :class="{ 'is-active': isRouteActive(routeItem.path) }"
        >
          <FaIcon
            v-if="routeItem.meta.icon"
            :name="String(routeItem.meta.icon)"
            :class="getIconClass(routeItem.path)"
          />
          <span>{{ routeItem.meta.title }}</span>
        </el-menu-item>
      </template>
    </el-menu>
  </div>
</template>

<style scoped lang="scss">
.menu-wrap {
  background: #fff;
  padding: 0 0 0;
  border-radius: 8px;
  width: 100%;
  overflow: visible;

  .icon-img {
    margin-right: 7px;
  }

  :deep(.el-menu-item) {
    height: 60px;
    line-height: 60px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    visibility: visible;
    opacity: 1;
    min-width: 80px;
    flex-shrink: 0;
    flex-direction: row;
  }

  :deep(.el-sub-menu .el-menu-item) {
    min-width: 160px;
    height: 60px;
    line-height: 60px;
    padding-left: 45px;
    display: block;
    visibility: visible;
    opacity: 1;
  }

  :deep(.el-menu) {
    border-radius: 8px;
    border-right: 0px;
    display: flex;
    flex-wrap: nowrap;
    overflow: visible;
    width: 100%;
  }

  :deep(.el-menu--horizontal) {
    white-space: nowrap;
    overflow: visible;
  }

  :deep(.el-menu--horizontal .el-menu-item) {
    white-space: nowrap;
    flex-shrink: 0;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-direction: row !important;
  }

  :deep(.el-sub-menu__title) {
    height: 60px;
    line-height: 60px;
    display: inline-block;
    visibility: visible;
    opacity: 1;
    min-width: 80px;
    flex-shrink: 0;
  }

  :deep(.el-menu > .el-menu-item.is-active) {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    color: #409eff;
    border-bottom: none;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 3px;
      background: linear-gradient(90deg, #409eff 0%, #3b82f6 100%);
      border-radius: 2px;
    }
  }

  // 激活状态下的图标颜色
  :deep(.el-menu > .el-menu-item.is-active .fa-icon) {
    color: #409eff !important;
    transform: scale(1.1);
  }

  // 悬停效果
  :deep(.el-menu-item:hover .fa-icon) {
    transform: scale(1.1);
  }

  :deep(.el-menu > .el-sub-menu.is-active > .el-sub-menu__title) {
    color: #409eff;
  }

  :deep(.el-menu-item) {
    border-bottom: none !important;
    border: none !important;
  }

  :deep(.el-menu-item::after) {
    display: none !important;
  }

  :deep(.el-menu-item::before) {
    display: none !important;
  }

  :deep(.el-menu) {
    border-bottom: none !important;
  }

  :deep(.el-menu-item[data-index="/event"]) {
    display: inline-block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  :deep(.el-sub-menu[data-index="/event"]) {
    display: inline-block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  :deep(.el-menu--horizontal .el-menu-item) {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-direction: row !important;
    visibility: visible !important;
    opacity: 1 !important;
    width: auto !important;
    min-width: 80px !important;
  }

  :deep(.el-menu--horizontal .el-sub-menu) {
    display: inline-block !important;
    visibility: visible !important;
    opacity: 1 !important;
    width: auto !important;
    min-width: 80px !important;
  }

  :deep(.el-menu--horizontal .el-sub-menu__title) {
    display: inline-block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
}
</style>
