<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'
import { onMounted, ref, watch } from 'vue'
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import ChatMenu from './chatMenu.vue'
import ChatIndex from '@/views/chat/chatPlusItem/chat.vue'
import ChatContent from './chatPlusItem/chatContent.vue'
import HistoryList from './chatPlusItem/historyList.vue'

const showContent = ref(false)
const currentChatObj = ref({})
const route = useRoute()
const router = useRouter()

// 控制小程序推广图片的显示
const showPromotion = ref(true)

onMounted(() => {
  // 检查是否已关闭推广图片
  const promotionClosed = localStorage.getItem('miniprogram_promotion_closed')
  if (promotionClosed === 'true') {
    showPromotion.value = false
  }

  if (route.query.id && route.query.id.startsWith('local_')) {
    const localChatObj = localStorage.getItem('local_currentChatObj')
    if (localChatObj) {
      currentChatObj.value = JSON.parse(localChatObj)
      showContent.value = true
    }
  }
  if (route.query.id && !route.query.id.startsWith('local_')) {
    showContent.value = true
  }
})

// 关闭推广图片
function closePromotion() {
  showPromotion.value = false
  localStorage.setItem('miniprogram_promotion_closed', 'true')
}

onMounted(() => {
  if (route.query.id && route.query.id.startsWith('local_')) {
    const localChatObj = localStorage.getItem('local_currentChatObj')
    if (localChatObj) {
      currentChatObj.value = JSON.parse(localChatObj)
      showContent.value = true
    }
  }
  if (route.query.id && !route.query.id.startsWith('local_')) {
    showContent.value = true
  }
})
onBeforeRouteUpdate((to, from) => {
  // 从/chat切换到/chat?type=add
  if (to.query.type && to.query.type === 'add' && from.query === undefined) {
    showContent.value = false
  }
})
watch(() => route.query.id, (newVal, oldVal) => {
  // 用户第一次开启本地对话
  if (newVal && newVal.startsWith('local_')) {
    showContent.value = true
  }
  // 用户第一次本地对话结束切换到具体conversationId
  // 切换历史对话tab
  if (newVal && !newVal.startsWith('local_')) {
    showContent.value = true
  }

  // 历史对话tab，点击新建对话  id由具体id变成undefined
  if (newVal === undefined && oldVal) {
    showContent.value = false
  }
})
// 提交对话
function handleSubmit(chatObj) {
  currentChatObj.value = chatObj
  localStorage.setItem('local_currentChatObj', JSON.stringify(chatObj))
  const timestamp = `local_${Date.now()}`
  router.replace({
    name: 'ChatCompletions',
    query: {
      id: timestamp,
    },
  })
}

// 对话结束
function handleChatEnd(conversationId: string) {
  if (conversationId) {
    currentChatObj.value.conversationId = conversationId
    router.replace({
      name: 'ChatCompletions',
      query: {
        id: conversationId,
      },
    })
  }
}
</script>

<template>
  <div class="chat-page">
    <div class="menu">
      <ChatMenu />
      <HistoryList @submit="handleSubmit" @chat-end="handleChatEnd" />
    </div>
    <el-container class="chat-main">
      <el-main element-loading-background="rgba(122, 122, 122, 0.3)" class="main-wrap">
        <ChatIndex v-if="!showContent" @submit="handleSubmit" />
        <ChatContent v-else :chat-obj="currentChatObj" @chat-end="handleChatEnd" />
      </el-main>
    </el-container>
    <!-- 小程序推广图片 -->
    <div v-show="showPromotion" class="miniprogram-promotion">
      <el-icon class="close-btn" @click="closePromotion">
        <Close />
      </el-icon>
      <div class="promotion-title">
        <div class="title-text">数游AI</div>
      </div>
      <img src="https://www.shuyoutech.com/preview/wxamp-shouyou.jpg" alt="数游AI小程序" class="promotion-image" />
    </div>
  </div>
</template>

<style lang="scss">
.input-container {
  .el-textarea {
    .el-textarea__inner {
      padding-right: 40px;
    }
  }
}
.chat-page {
  min-height: calc(100vh - 165px);
  display: flex;
 .menu {
   width: 240px;
   height: 100%;
   min-height: calc(100vh - 101px);
   background: #fff;
   color: #2c3e50;
   display: flex;
   flex-direction: column;
   overflow-y: auto;
   border-right: 1px solid #e8eaed;
 }
}
.chat-main {
  min-height: calc(100vh - 165px);
  .main-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #fff !important;
  }
 }

// 小程序推广图片样式
.miniprogram-promotion {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 99;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  max-width: 140px;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  .close-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;

    &:hover {
      background: rgba(0, 0, 0, 0.7);
      transform: scale(1.1);
    }
  }

  .promotion-title {
    width: 100%;
    margin-bottom: 10px;
    text-align: center;

    .title-text {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      letter-spacing: 0.5px;
    }
  }

  .promotion-image {
    width: 120px;
    height: auto;
    border-radius: 8px;
    display: block;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .chat-page {
    flex-direction: column;
  }

  .menu {
    width: 100%;
    height: auto;
    max-height: 200px;
    position: relative;
    border-right: none;
    border-bottom: 1px solid #e8eaed;
  }

  .chat-main {
    margin-left: 0;
  }

  .miniprogram-promotion {
    bottom: 16px;
    right: 16px;
    padding: 10px;
    max-width: 120px;

    .close-btn {
      width: 18px;
      height: 18px;
      font-size: 11px;
      top: 3px;
      right: 3px;
    }

    .promotion-title {
      margin-bottom: 8px;

      .title-text {
        font-size: 12px;
      }
    }

    .promotion-image {
      width: 100px;
    }
  }
}

@media (max-width: 480px) {
  .menu {
    .menu-header {
      padding: 16px;
    }

    .menu-section {
      padding: 12px 16px;
    }

    .menu-item {
      padding: 10px 12px;
      font-size: 14px;
    }

    .logo {
      .logo-text {
        .company-name {
          font-size: 14px;
        }

        .company-en {
          font-size: 10px;
        }
      }
    }
  }

  .miniprogram-promotion {
    bottom: 12px;
    right: 12px;
    padding: 8px;
    max-width: 100px;

    .close-btn {
      width: 16px;
      height: 16px;
      font-size: 10px;
      top: 2px;
      right: 2px;
    }

    .promotion-title {
      margin-bottom: 6px;

      .title-text {
        font-size: 11px;
      }
    }

    .promotion-image {
      width: 84px;
    }
  }
}
</style>
