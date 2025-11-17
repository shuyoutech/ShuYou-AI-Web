<script setup lang="ts">
import { ElMessage } from 'element-plus'

const router = useRouter()
// 菜单相关状态
const activeMenu = ref('chat')
const showMoreSubmenu = ref(false)
const submenuRef = ref(null)
const moreMenuRef = ref(null)
const menuItems = ref([
  {
    id: 'chat',
    title: '新对话',
    icon: 'i-ic:outline-mark-chat-unread',
    type: 'primary',
    path: '/chat/completions',
  },
  {
    id: 'ai-translate',
    title: 'AI翻译',
    icon: 'i-ic:round-g-translate',
    type: 'secondary',
    path: '/chat/translation',
  },
  {
    id: 'ai-write',
    title: 'AI写作',
    icon: 'i-ic:outline-edit-note',
    type: 'secondary',
    path: '/chat/writing',
  },
  {
    id: 'ai-coding',
    title: 'AI编程',
    icon: 'i-ic:outline-computer',
    type: 'secondary',
    path: '/chat/coder',
  },
  {
    id: 'multi-model',
    title: '多模型对话',
    icon: 'i-ic:outline-psychology',
    type: 'secondary',
    path: '/chat/multi-model',
  },

 /*

  {
    id: 'more',
    title: '更多',
    icon: 'i-ic:outline-apps',
    type: 'secondary',
    hasSubmenu: true,
  },*/
])

// 更多菜单的子菜单项
const moreSubmenuItems = ref([
  {
    id: 'ai-math',
    title: 'AI数学',
    icon: 'i-ic:outline-menu-book',
    type: 'secondary',
    path: '/chat/math',
  },
  {
    id: 'ai-reading',
    title: 'AI阅读',
    icon: 'i-ic:outline-menu-book',
    path: '/chat/reading',
  },
  {
    id: 'ai-agent',
    title: 'AI搜索',
    icon: 'i-ic:outline-psychology',
    path: '/chat/agent',
  },
])

// 菜单点击处理
function handleMenuClick(menuId) {
  switch (menuId) {
    case 'chat':
      router.push('/chat/completions')
      break
    case 'ai-painting':
      ElMessage.info('AI绘画功能开发中...')
      break
    case 'ai-video':
      ElMessage.info('AI视频功能开发中...')
      break
    case 'ai-write':
      router.push('/chat/writing')
      break
    case 'ai-translate':
      router.push('/chat/translation')
      break
    case 'multi-model':
      router.push('/chat/multi-model')
      break
    case 'ai-coding':
      router.push('/chat/coder')
      break
    case 'more':
      showMoreSubmenu.value = !showMoreSubmenu.value
      break
    default:
      break
  }
  // activeMenu.value = menuId
}

// 子菜单点击处理
function handleSubmenuClick(item) {
  switch (item.id) {
    case 'ai-math':
      router.push('/chat/math')
      break
    case 'ai-reading':
      ElMessage.info('AI 阅读功能开发中...')
      break
    case 'voice-call':
      ElMessage.info('语音通话功能开发中...')
      break
    case 'ai-agent':
      ElMessage.info('AI 智能体功能开发中...')
      break
    default:
      break
  }
  showMoreSubmenu.value = false
}

onMounted(() => {
  activeMenu.value = menuItems.value.find(item => item.path === router.currentRoute.value.path)?.id
})
</script>

<template>
  <!-- 主要功能菜单 -->
  <div class="menu-section primary-menu">
    <div
      v-for="item in menuItems"
      :key="item.id"
      :ref="item.id === 'more' ? 'moreMenuRef' : null"
      class="menu-item primary-item"
      :class="{
        active: activeMenu === item.id || (item.id === 'more' && showMoreSubmenu),
        hasSubmenu: item.hasSubmenu,
      }"
      @click="handleMenuClick(item.id)"
    >
      <FaIcon :name="item.icon" class="menu-icon size-5" />
      <span class="menu-text">{{ item.title }}</span>
      <!-- 更多菜单的箭头图标 -->
      <FaIcon
        v-if="item.hasSubmenu"
        name="i-ic:outline-chevron-right"
        class="submenu-arrow"
        :class="{ rotated: showMoreSubmenu }"
      />
      <div v-if="activeMenu === item.id && !item.hasSubmenu" class="active-indicator" />
    </div>

    <!-- 更多菜单的子菜单 -->
    <div
      v-if="showMoreSubmenu"
      ref="submenuRef"
      class="submenu-container"
    >
      <div class="submenu">
        <div
          v-for="subItem in moreSubmenuItems"
          :key="subItem.id"
          class="submenu-item"
          @click="handleSubmenuClick(subItem)"
        >
          <FaIcon :name="subItem.icon" class="submenu-icon" />
          <span class="submenu-text">{{ subItem.title }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 分割线 -->
  <div class="menu-divider" />
</template>

<style scoped lang="scss">
// 菜单区域样式
.menu-section {
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
}

.menu-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #e8eaed 20%, #e8eaed 80%, transparent 100%);
  margin: 0 24px 8px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 3px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 2px;
    opacity: 0.6;
  }
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 18px;
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

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    transform: translateY(-1px);
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

// 更多菜单项的特殊样式
.menu-item.hasSubmenu {
  .submenu-arrow {
    margin-left: auto;
    margin-right: 0;
    font-size: 16px;
    color: #a0aec0;
    transition: transform 0.3s ease;

    &.rotated {
      transform: rotate(90deg);
    }
  }

  &.active {
    background: rgba(107, 126, 234, 0.1);
    border-color: rgba(107, 126, 234, 0.2);
    .menu-icon {
      color: #667eea;
    }
    .menu-text {
      color: #667eea;
    }
    .submenu-arrow {
      color: #667eea;
    }
  }
}

.primary-item {
  font-weight: 500;
  color: #2d3748;
  font-size: 15px;
}

.secondary-item {
  font-size: 14px;
  color: #718096;
  justify-content: space-between;

  .menu-count {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
    color: #4a5568;
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 12px;
    min-width: 18px;
    text-align: center;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

.menu-icon {
  margin-right: 14px;
  font-size: 20px;
  color: #a0aec0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.menu-text {
  flex: 1;
  transition: all 0.3s ease;
  font-weight: 500;
  letter-spacing: 0.3px;
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

// 添加微妙的动画效果
@keyframes menuItemPulse {
  0% {
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
  }
  50% {
    box-shadow: 0 6px 25px rgba(102, 126, 234, 0.25);
  }
  100% {
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
  }
}

.menu-item.active {
  animation: menuItemPulse 2s ease-in-out infinite;
}

// 响应式设计
@media (max-width: 768px) {
  .menu-header {
    padding: 20px 20px 16px;

    .logo-icon {
      width: 36px;
      height: 36px;

      .el-icon {
        font-size: 18px;
      }
    }

    .company-name {
      font-size: 15px;
    }

    .company-en {
      font-size: 11px;
    }
  }

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

  .section-title {
    margin-bottom: 12px;

    span {
      font-size: 11px;
    }
  }
}

@media (max-width: 480px) {
  .menu-header {
    padding: 16px 16px 14px;

    .logo-icon {
      width: 32px;
      height: 32px;

      .el-icon {
        font-size: 16px;
      }
    }

    .company-name {
      font-size: 14px;
    }

    .company-en {
      font-size: 10px;
    }
  }

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

  .section-title {
    margin-bottom: 10px;

    span {
      font-size: 10px;
    }
  }
}

// 子菜单样式
.submenu-container {
  position: fixed;
  z-index: 9999;
}

.submenu {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 8px 0;
  min-width: 200px;
  backdrop-filter: blur(10px);
  animation: submenuSlideIn 0.3s ease-out;
}

@keyframes submenuSlideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.submenu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;

  &:hover {
    background: rgba(107, 126, 234, 0.08);
    color: #667eea;

    .submenu-icon {
      color: #667eea;
      transform: scale(1.1);
    }
  }

  .submenu-icon {
    margin-right: 12px;
    font-size: 18px;
    color: #6b7280;
    transition: all 0.2s ease;
  }

  .submenu-text {
    font-size: 14px;
    font-weight: 500;
    flex: 1;
  }
}

.submenu-footer {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  margin-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  color: #9ca3af;
  font-size: 12px;

  .footer-icon {
    margin-right: 8px;
    font-size: 14px;
  }

  .footer-text {
    font-weight: 400;
  }
}

// 响应式设计中的子菜单
// @media (max-width: 768px) {
//   .submenu-container {
//     position: fixed;
//     left: 50%;
//     top: 50%;
//     transform: translate(-50%, -50%);
//     margin-left: 0;
//   }

//   .submenu {
//     min-width: 280px;
//     max-width: 90vw;
//   }
// }
</style>
