<template>
  <section class="app-main">
    <!-- 主要内容 -->
    <div class="app-main-box">
      <router-view v-slot="{ Component, route }">
        <transition name="fade-transform" mode="out-in">
          <keep-alive>
            <div class="main-wrap">
              <component :is="Component" :key="route.path" />
            </div>
          </keep-alive>
        </transition>
      </router-view>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref } from 'vue'
const router = useRouter()
const route = useRoute()

// 菜单列表
let breadList = ref<any>([])
let menuList: any[] = []
let arr: any[] = []

arr = router.options.routes.filter((item: any)=>{
  return item.path == ''
})
arr.forEach((item: any) => {
  item.children && menuList.push(...item.children)
});

// 面包屑列表
function getBreadListFn() {
  breadList.value = []
  function breadChildFn(breadItem: any) {
    breadItem.forEach((item: any) => {
      if (route.fullPath.indexOf(item.name) > -1) {
        let arrItem = {
          path: item.path,
          title: item.meta.title
        }
        breadList.value.push(arrItem)
      }
      if (item.children) {
        breadChildFn(item.children)
      }
    });
  }
  // 根据菜单列表生成面包屑列表
  breadChildFn(menuList)
}
getBreadListFn()
router.afterEach(() => {
  getBreadListFn()
})


</script>

<style  lang="scss">
.app-main {
  border-radius: 0;
  padding: 0;
  margin: 0;
  .main-wrap {
    height: calc(100vh - 101px);
    overflow-y: auto;
    overflow-x: auto;
    padding: 0;
    margin: 0;
  }
  .app-main-box {
    background: transparent;
    padding: 0;
    margin: 0;
  }
  .bread-crumb {
    font-size: 24px;
    color: #909399;
    margin-bottom: 20px;
    .bread-crumb-current .el-breadcrumb__inner {
      color: #2E2E2E;
    }
  }
}
</style>
