<script setup lang="ts">
import {default as AppMain} from "./component/AppMain.vue"
import {default as AppHeader} from "./component/Header.vue"
import AppFooter from '@/components/AppFooter/index.vue'
import {ref} from 'vue'
import {ElMessage} from 'element-plus'
import Login from '@/views/login.vue'
import Profile from '@/views/user/profile.vue'

const appHeaderRef = ref<any>(null)
const showLoginModal = ref(false)
const showProfileModal = ref(false)

const goToLogin = () => {
  showLoginModal.value = true
}

const goToProfile = () => {
  showProfileModal.value = true
}

const handleLoginSuccess = () => {
  showLoginModal.value = false
  ElMessage.success('登录成功！')
}

const handleLogoutSuccess = () => {
  showLoginModal.value = false
  ElMessage.success('退出成功！')
}

const userStore = useUserStore()
watch(() => userStore.showLoginModal, (newVal) => {
  showLoginModal.value = newVal
  if (newVal) {
    showProfileModal.value = false
  }
})

watch(() => userStore.isLogin, (newVal) => {
  if (newVal) {
    showLoginModal.value = false
  }
})
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header class="layout-header">
        <AppHeader ref="appHeaderRef" @go-to-login="goToLogin" @go-to-profile="goToProfile"/>
      </el-header>
      <el-main>
        <AppMain/>
      </el-main>
      <el-footer>
        <AppFooter/>
      </el-footer>
    </el-container>

    <!-- 会员登录弹窗 -->
    <Login
      v-model:visible="showLoginModal"
      @login-success="handleLoginSuccess"
      @logout-success="handleLogoutSuccess"
    />

    <!-- 个人中心弹窗 -->
    <Profile
      v-model:visible="showProfileModal"
    />

  </div>
</template>

<style lang="scss" scoped>
.common-layout {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;

  .layout-header {
    width: 100%;
    height: 60px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  }

  :deep(.el-footer) {
    height: 41px !important;
  }

  :deep(.el-main) {
    background: transparent;
    padding: 0 !important;
    margin: 0 !important;
  }
}
</style>
