<script setup lang="ts">
import { useUserStore } from '@/store/modules/user'
import MenuModule from './MenuModule.vue'

interface Emits {
  (e: 'goToLogin'): void

  (e: 'goToProfile'): void
}

const emit = defineEmits<Emits>()
const title = import.meta.env.VITE_APP_TITLE
const userStore = useUserStore()

// 监听登录状态变化
watch(() => userStore.isLogin, (isLogin) => {
  if (isLogin) {
    console.log('用户' + userStore.nickname + '登录')
  }
  else {
    console.log('用户退出')
  }
})

onMounted(() => {
  // 组件挂载时检查登录状态

})

// 登录处理
function goToLogin() {
  emit('goToLogin')
}

// 个人资料处理
function goToProfile() {
  emit('goToProfile')
}
</script>

<template>
  <div class="bbs-header">
    <div class="header-content">
      <div class="logo">
        <img src="@/assets/images/logo.svg" alt="BBS Logo" class="logo-img">
        <span class="logo-text">{{ title }}</span>
      </div>
      <div class="nav-menu">
        <MenuModule />
      </div>
      <div class="user-section">
        <div v-if="!userStore.isLogin" class="login-buttons">
          <button class="btn btn-primary" @click="goToLogin">
            登录
          </button>
        </div>
        <div v-else class="user-info">
          <img v-if="userStore.avatar" :src="userStore.avatar" :alt="userStore.nickname" class="user-avatar" @click="goToProfile">
          <img v-else src="@/assets/images/avatar.png" alt="User" class="user-avatar" @click="goToProfile">
          <span class="user-name" @click="goToProfile">{{ userStore.nickname }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 顶部导航栏样式 */
.bbs-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 0;
  color: #333;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.bbs-header .header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 100%;
  height: 60px;
  padding: 0 20px;
  margin: 0 auto;
  overflow: visible;
  position: relative;
}

.bbs-header .logo {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-left: 20px;
}

.bbs-header .logo-img {
  width: 32px;
  height: 32px;
}

.bbs-header .logo-text {
  font-size: 20px;
  font-weight: bold;
}

.bbs-header .nav-menu {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: auto;
  max-width: 60%;
  display: flex;
  justify-content: center;
  overflow: visible;
  min-width: 300px;
}

.bbs-header .nav-item {
  padding: 8px 16px;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.bbs-header .nav-item:hover,
.bbs-header .nav-item.active {
  color: #000;
  background-color: rgb(0 0 0 / 10%);
}

.bbs-header .user-section {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
  min-width: 120px;
  justify-content: flex-end;
}

.bbs-header .login-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.bbs-header .btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.bbs-header .btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.bbs-header .btn:hover::before {
  left: 100%;
}

.bbs-header .btn-primary {
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bbs-header .btn-primary:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.bbs-header .btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.bbs-header .user-info {
  display: flex;
  gap: 10px;
  align-items: center;
}

.bbs-header .user-avatar {
  width: 32px;
  height: 32px;
  cursor: pointer;
  object-fit: contain;
  border-radius: 50%;
  transition: all 0.3s ease;
  background-color: #f5f5f5;
  padding: 2px;
}

.bbs-header .user-avatar:hover {
  box-shadow: 0 0 10px rgb(0 0 0 / 20%);
  transform: scale(1.1);
}

.bbs-header .user-name {
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
}

.bbs-header .user-name:hover {
  color: #000;
}

/* 响应式设计 */

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .bbs-header .header-content {
    padding: 0 20px;
  }

  .bbs-header .logo {
    margin-left: 20px;
  }
}

/* 中等屏幕 */
@media (max-width: 1199px) and (min-width: 769px) {
  .bbs-header .header-content {
    padding: 0 15px;
  }

  .bbs-header .logo {
    margin-left: 20px;
  }

  .bbs-header .nav-menu {
    max-width: 50%;
    min-width: 250px;
  }

  .bbs-header .user-section {
    min-width: 120px;
    flex-shrink: 0;
  }
}

/* 小屏幕 */
@media (width <= 768px) {
  .bbs-header .header-content {
    padding: 0 10px;
    justify-content: space-between;
  }

  .bbs-header .logo {
    margin-left: 0;
    flex-shrink: 0;
  }

  .bbs-header .nav-menu {
    display: none;
  }

  .bbs-header .user-section {
    flex-shrink: 0;
    min-width: 100px;
  }

  .bbs-header .user-name {
    display: none;
  }

  .bbs-header .user-avatar {
    width: 28px;
    height: 28px;
  }
}

/* 超小屏幕 */
@media (width <= 480px) {
  .bbs-header .header-content {
    padding: 0 8px;
  }

  .bbs-header .logo-text {
    font-size: 16px;
  }

  .bbs-header .logo-img {
    width: 28px;
    height: 28px;
  }

  .bbs-header .user-section {
    min-width: 80px;
  }

  .bbs-header .user-avatar {
    width: 24px;
    height: 24px;
  }

  .bbs-header .btn {
    padding: 8px 16px;
    font-size: 13px;
  }
}
</style>
