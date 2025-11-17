<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { isEmpty } from '@/utils/common'

const route = useRoute()

const props = defineProps({
  route: {
    type: Object as any,
    required: true,
  },
})

// 判断当前路由是否激活
const isRouteActive = computed(() => {
  const currentPath = route.path
  const routePath = props.route.path

  // 如果当前路径以路由路径开头，则认为是激活状态
  return currentPath.startsWith(routePath)
})

// 判断子路由是否激活
const hasActiveChild = computed(() => {
  if (!props.route.children) return false

  const currentPath = route.path
  return props.route.children.some((child: any) =>
    currentPath.startsWith(child.path)
  )
})
</script>

<template>
  <el-menu-item
    v-if="isEmpty(route.children)"
    :key="route?.path"
    :index="route.path"
    :class="{ 'is-active': isRouteActive }"
  >
    <template #title>
      <span class="iconfont icon-img" :class="route.meta?.icon"></span>
      {{ route?.meta?.title }}
    </template>
  </el-menu-item>
  <el-sub-menu
    v-else
    :key="`sub-${route?.path}`"
    :index="route.path"
    :class="{ 'is-active': hasActiveChild }"
  >
    <template #title>
      <span class="iconfont icon-img" :class="route.meta?.icon"></span>
      <span>{{ route?.meta?.title }}</span>
    </template>
    <menu-item v-for="(sub, i) in route.children" :route="sub" :key="sub.path || i" />
  </el-sub-menu>
</template>
