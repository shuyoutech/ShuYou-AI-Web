<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Key,
  DataAnalysis,
  Money,
  Document,
  ArrowRight,
  InfoFilled,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const activeTab = ref('')

const menuItems = [
  {
    label: 'API Key管理',
    value: 'apikey',
    icon: Key,
    path: '/settings/apikey',
    color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    desc: '管理您的API密钥',
  },
  {
    label: '用量信息',
    value: 'usage',
    icon: DataAnalysis,
    path: '/settings/usage',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    desc: '查看算力使用情况',
  },
  {
    label: '账单信息',
    value: 'bills',
    icon: Money,
    path: '/settings/bills',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    desc: '查看消费记录',
  },
  {
    label: '发票管理',
    value: 'invoice',
    icon: Document,
    path: '/settings/invoice',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    desc: '管理发票申请和记录',
  },
  {
    label: '关于我们',
    value: 'about',
    icon: InfoFilled,
    path: '/settings/about',
    color: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    desc: '了解我们与联系方式',
  }
]

const handleClick = (item: any) => {
  activeTab.value = item.value
  router.push(item.path)
}

onMounted(() => {
  // 根据当前路由设置激活状态
  const currentPath = route.path
  const currentItem = menuItems.find(item => item.path === currentPath)
  if (currentItem) {
    activeTab.value = currentItem.value
  }
})
</script>

<template>
  <div class="sidebar-container">
    <div class="sidebar-header">
      <h3 class="sidebar-title">个人中心</h3>
      <p class="sidebar-subtitle">管理您的账户信息</p>
    </div>

    <div class="menu-list">
      <div
        v-for="item in menuItems"
        :key="item.value"
        :class="[
          'menu-item',
          { 'menu-item-active': activeTab === item.value }
        ]"
        @click="handleClick(item)"
      >
        <div class="menu-item-content">
          <div
            class="menu-icon"
            :style="{ background: item.color }"
          >
            <el-icon size="18">
              <component :is="item.icon"/>
            </el-icon>
          </div>
          <div class="menu-text">
            <div class="menu-label">{{ item.label }}</div>
            <div class="menu-desc">{{ item.desc }}</div>
          </div>
        </div>
        <div class="menu-arrow">
          <el-icon size="14">
            <ArrowRight />
          </el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar-container {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
  border-radius: 16px;
  padding: 24px;
  height: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.sidebar-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sidebar-subtitle {
  font-size: 0.9rem;
  color: #5a6c7d;
  margin: 0;
  font-weight: 300;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.4);
  position: relative;
  overflow: hidden;
}

.menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.menu-item:hover::before {
  opacity: 1;
}

.menu-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.9);
}

.menu-item-active {
  background: rgba(255, 255, 255, 0.95) !important;
  border-color: rgba(102, 126, 234, 0.3) !important;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2) !important;
}

.menu-item-active::before {
  opacity: 1;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.menu-item-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  position: relative;
  z-index: 2;
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.menu-item:hover .menu-icon {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.menu-text {
  flex: 1;
}

.menu-label {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.menu-desc {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-weight: 400;
}

.menu-arrow {
  color: #bdc3c7;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.menu-item:hover .menu-arrow {
  color: #667eea;
  transform: translateX(4px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar-container {
    padding: 16px;
    border-radius: 12px;
  }

  .sidebar-title {
    font-size: 1.3rem;
  }

  .menu-item {
    padding: 12px 16px;
  }

  .menu-icon {
    width: 36px;
    height: 36px;
  }

  .menu-label {
    font-size: 0.9rem;
  }

  .menu-desc {
    font-size: 0.75rem;
  }
}
</style>
