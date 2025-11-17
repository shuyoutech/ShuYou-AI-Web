<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'
import ChatMenu from './chatMenu.vue'
import ChatIndex from '@/views/chat/chatPlusItem/chat.vue'
import ChatContent from './chatPlusItem/chatContent.vue'
import HistoryList from './chatPlusItem/historyList.vue'

const showContent = ref(false)
const currentChatObj = ref({})
const route = useRoute()
const router = useRouter()

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
}
</style>
