<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const activeTab = ref('')

// 菜单项
const menuItems = [
  {
    label: '提示词',
    value: 'prompt',
    path: '/app/prompt',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    label: '知识库',
    value: 'knowledge',
    path: '/app/knowledge',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    label: 'RAG应用',
    value: 'rag',
    path: '/app/rag',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
]

function handleClick(item: any) {
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
  <!-- 主要功能菜单 -->
  <div class="sidebar-container">
    <div class="menu-section primary-menu">
      <div
        v-for="item in menuItems"
        :key="item.value"
        class="menu-item primary-item"
        :class="{ 'menu-item-active': activeTab === item.value }"
        @click="handleClick(item)"
      >
        <div class="menu-icon">
          <div class="icon-shape" :class="item.value.toLowerCase()" />
        </div>
        <span class="menu-text">{{ item.label }}</span>
        <div v-if="activeTab === item.value" class="active-indicator" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// 菜单区域样式
.sidebar-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  position: relative;
}

.menu-section {
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%);
  position: relative;
  border-radius: 16px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 5px 18px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 6px;
  position: relative;
  border: 1px solid transparent;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.8);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(102, 126, 234, 0.2);
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
    transform: translateY(-2px);

    &::before {
      opacity: 1;
    }

    .menu-icon {
      color: #667eea;
      transform: scale(1.1);
    }

    .menu-text {
      color: #4a5568;
    }
  }

  &.menu-item-active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    transform: translateY(-1px);
    animation: menuItemPulse 2s ease-in-out infinite;

    .menu-icon {
      color: #fff;
      transform: scale(1.05);
    }

    .menu-text {
      color: #fff;
      font-weight: 600;
    }

    &::before {
      opacity: 0;
    }
  }
}

.primary-item {
  font-weight: 500;
  color: #2d3748;
  font-size: 15px;
}

.active-indicator {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
  animation: activePulse 2s ease-in-out infinite;
}

@keyframes activePulse {
  0%, 100% {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
  50% {
    opacity: 0.7;
    transform: translateY(-50%) scale(1.2);
  }
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-right: 14px;
  font-size: 20px;
  color: #a0aec0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.icon-shape {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  position: relative;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* 提示词图标 - 文档/文本图标 */
.prompt.icon-shape::before {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid #667eea;
  border-radius: 4px;
  position: relative;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.prompt.icon-shape::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 2px;
  background: #667eea;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 0 #667eea, 0 4px 0 #667eea;
}

/* 知识库图标 - 数据库图标 */
.knowledge.icon-shape::before {
  content: '';
  width: 18px;
  height: 14px;
  border: 2px solid #667eea;
  border-radius: 50%;
  position: relative;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.knowledge.icon-shape::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 2px;
  background: #667eea;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 1px;
  box-shadow:
    0 2px 0 #667eea,
    0 4px 0 #667eea,
    0 6px 0 #667eea;
}

/* RAG应用图标 - 智能对话图标 */
.rag.icon-shape::before {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid #667eea;
  border-radius: 50%;
  position: relative;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.rag.icon-shape::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border: 2px solid #667eea;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #667eea;
  box-shadow: 0 0 0 1px white;
}

.menu-text {
  flex: 1;
  transition: all 0.3s ease;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.menu-item:hover .icon-shape {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transform: scale(1.05);
}

.menu-item-active .icon-shape {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transform: scale(1.05);
}

@keyframes menuItemPulse {
  0% {
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  }
  50% {
    box-shadow: 0 10px 35px rgba(102, 126, 234, 0.4);
  }
  100% {
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .menu-section {
    padding: 16px 20px 12px;
  }

  .menu-item {
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 4px;
  }

  .menu-icon {
    margin-right: 12px;
    font-size: 18px;
  }

  .menu-text {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .menu-section {
    padding: 12px 16px 10px;
  }

  .menu-item {
    padding: 10px 14px;
    border-radius: 8px;
  }

  .menu-icon {
    margin-right: 10px;
    font-size: 16px;
  }

  .menu-text {
    font-size: 13px;
  }
}
</style>
