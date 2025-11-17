<script setup lang="ts">
import { ChatLineRound, Delete, Edit, Loading, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { defineEmits, defineProps, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chatConversationClearApi, chatConversationDeleteApi, chatConversationPageApi, chatConversationUpdateApi } from '@/api/ai/aigc'
import { useUserStore } from "@/store/modules/user.ts";

// Props
defineProps({
  showSidebar: {
    type: Boolean,
    default: true,
  },
})

// Emits
const emits = defineEmits(['submit', 'chatEnd'])

// 响应式数据
const chatName = ref('')
const chatList = ref([])
const router = useRouter()
const route = useRoute()
const currentChatObj = ref({})

const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const finished = ref(false)

// 生命周期
onMounted(() => {
  if (route.query.id && route.query.id.startsWith('local_')) {
    const localChatObj = localStorage.getItem('local_currentChatObj')
    if (localChatObj) {
      currentChatObj.value = JSON.parse(localChatObj)
    }
  }
  getChatList()
})

// 监听路由变化
watch(() => route.query.id, (newVal, oldVal) => {
  // 用户第一次开启本地对话
  if (newVal && newVal.startsWith('local_')) {
    // 处理本地对话逻辑
  }
  // 用户第一次本地对话结束切换到具体conversationId
  // 切换历史对话tab
  if (newVal && !newVal.startsWith('local_')) {
    pageNum.value = 1
    getChatList()
  }

  // 历史对话tab，点击新建对话  id由具体id变成undefined
  if (newVal === undefined && oldVal) {
    chatList.value.forEach((item: any) => {
      item.isSelected = false
    })
    addNewChatTab()
  }
})

// 对话查询
const userStore = useUserStore()

function getChatList() {
  if (!userStore.isLogin) {
    return
  }
  loading.value = true
  const params = {
    pageNum: pageNum.value.toString(),
    pageSize: pageSize.value.toString(),
    sort: 'createTime',
    order: 'desc',
    query: {
      title: chatName.value,
    },
  }
  chatConversationPageApi(params).then((res) => {
    if (res.code === 0) {
      const newData = res.data.rows || []
      // 如果是第一页，直接替换数据
      if (pageNum.value === 1) {
        chatList.value = newData
      } else {
        // 否则追加数据
        chatList.value = [...chatList.value, ...newData]
      }

      // 判断是否还有更多数据
      if (newData.length < pageSize.value) {
        finished.value = true
      }

      // 更新页码
      if (!finished.value) {
        pageNum.value++
      }
      // 页面在新建对话时，刷新页面，添加新对话tab
      if (route.query.type === 'add') {
        addNewChatTab()
      } else {
        // 添加选中状态
        chatList.value.forEach((item: any) => {
          item.isSelected = item.id === route.query.id
        })
      }
    }
    loading.value = false
  })
}

function addNewChatTab() {
  const firstItem = chatList.value[0]
  if (firstItem && firstItem.title === '新对话') {
    return
  }
  chatList.value.unshift({
    id: `local_${Date.now()}`,
    title: '新对话',
    createTime: new Date().toLocaleString(),
    isSelected: true,
  })
}

function load() {
  if (loading.value || finished.value) {
    return
  }
  getChatList()
}

// 切换对话
function changeChat(item) {
  if (item.id.startsWith('local_')) {
    return false
  } else {
    router.replace({
      name: 'ChatCompletions',
      query: {
        id: item.id,
      },
    })
  }
}

// 新增对话
// function newChat() {
//   router.replace({
//     name: 'ChatCompletions',
//     query: {
//       type: 'add',
//     },
//   })
// }

// 删除对话
function deleteChat(item, event) {
  // 阻止事件冒泡，避免触发切换对话
  event.stopPropagation()

  // 如果是本地对话，直接从列表中移除
  if (item.id.startsWith('local_')) {
    const index = chatList.value.findIndex(chat => chat.id === item.id)
    if (index > -1) {
      chatList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
    return
  }

  // 确认删除对话框
  ElMessageBox.confirm(
    `确定要删除对话"${item.title}"吗？删除后无法恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    },
  ).then(() => {
    // 调用删除API
    chatConversationDeleteApi(item.id).then((res) => {
      if (res.code === 0) {
        // 删除成功，从列表中移除
        const index = chatList.value.findIndex(chat => chat.id === item.id)
        if (index > -1) {
          chatList.value.splice(index, 1)
        }
        ElMessage.success('删除成功')

        // 如果删除的是当前正在查看的对话，跳转到首页
        if (route.query.id === item.id) {
          router.replace({
            name: 'ChatCompletions',
          })
        }
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    }).catch((error) => {
      ElMessage.error(error.msg || '删除失败')
    })
  }).catch(() => {
    // 用户取消删除
  })
}

// 编辑对话标题
function editChatTitle(item, event) {
  // 阻止事件冒泡，避免触发切换对话
  event.stopPropagation()

  // 如果是本地对话，不支持编辑
  if (item.id.startsWith('local_')) {
    ElMessage.warning('本地对话暂不支持修改标题')
    return
  }

  // 显示编辑对话框
  ElMessageBox.prompt('请输入新的对话标题', '修改标题', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: item.title,
    inputValidator: (value) => {
      if (!value || value.trim() === '') {
        return '标题不能为空'
      }
      if (value.length > 50) {
        return '标题长度不能超过50个字符'
      }
      return true
    },
    inputErrorMessage: '请输入有效的标题',
  }).then(({value}) => {
    const newTitle = value.trim()

    // 如果标题没有变化，直接返回
    if (newTitle === item.title) {
      return
    }

    // 调用更新API
    chatConversationUpdateApi(item.id, newTitle).then((res) => {
      if (res.code === 0) {
        // 更新成功，更新列表中的标题
        const index = chatList.value.findIndex(chat => chat.id === item.id)
        if (index > -1) {
          chatList.value[index].title = newTitle
        }
        ElMessage.success('标题修改成功')
      } else {
        ElMessage.error(res.msg || '修改失败')
      }
    }).catch((error) => {
      ElMessage.error(error.msg || '修改失败')
    })
  }).catch(() => {
    // 用户取消编辑
  })
}

// 清除所有对话
function clearAllChats() {
  // 如果没有对话，直接返回
  const hasRealChats = chatList.value.some(item => !item.id.startsWith('local_'))
  if (!hasRealChats) {
    ElMessage.warning('没有可清除的对话')
    return
  }

  // 确认清除对话框
  ElMessageBox.confirm(
    '确定要清除所有对话吗？此操作将删除所有历史对话，且无法恢复。',
    '清除所有对话',
    {
      confirmButtonText: '确定清除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    },
  ).then(() => {
    // 调用清除API
    chatConversationClearApi().then((res) => {
      if (res.code === 0) {
        // 清除成功，重置列表
        pageNum.value = 1
        finished.value = false
        chatList.value = []
        ElMessage.success('清除成功')
        
        // 如果当前正在查看某个对话，跳转到首页
        if (route.query.id && !route.query.id.startsWith('local_')) {
          router.replace({
            name: 'ChatCompletions',
          })
        }
        
        // 重新加载列表（会显示空状态）
        getChatList()
      } else {
        ElMessage.error(res.msg || '清除失败')
      }
    }).catch((error) => {
      ElMessage.error(error.msg || '清除失败')
    })
  }).catch(() => {
    // 用户取消清除
  })
}

// 暴露方法给父组件
defineExpose({
  getChatList,
  addNewChatTab,
})
</script>

<template>
  <div class="media-page">
    <!-- <el-button type="primary" class="newChat" @click="newChat">
      <el-icon style="margin-right: 5px">
        <ChatLineRound />
      </el-icon>
      新建对话
    </el-button> -->

    <div class="search-box">
      <el-input v-model="chatName" placeholder="搜索会话" style="" class="search-input" clearable @change="getChatList">
        <template #prefix>
          <el-icon class="el-input__icon">
            <Search/>
          </el-icon>
        </template>
      </el-input>
    </div>
    <div class="chat-history">
      <div>
        历史对话
      </div>
      <div class="chat-history-actions">
        <el-button 
          type="danger" 
          size="small" 
          text 
          @click="clearAllChats"
          class="clear-all-btn"
        >
          <el-icon class="clear-icon">
            <Delete/>
          </el-icon>
          <span>清除所有</span>
        </el-button>
      </div>
    </div>
    <el-scrollbar>
      <div class="content">
        <div v-if="chatList.length === 0" class="empty-box">
          <el-empty description="暂无数据" :image-size="100"/>
        </div>
        <div v-else v-infinite-scroll="load" class="chat-wrap-box">
          <div
            v-for="(item, i) in chatList"
            :key="(item.id + i)"
            class="chat-item"
            :class="[item.isSelected ? 'chat-item-selected' : '']" @click="changeChat(item)"
          >
            <div class="chat-content">
              <div class="chat-title" :title="item.title">
                {{ item.title }}
              </div>
              <div class="chat-time">
                {{ item.createTime }}
              </div>
            </div>
            <div v-show="!item.id.startsWith('local_')" class="chat-actions">
              <div class="label">{{ item.functionName }}</div>
              <el-icon class="edit-btn" @click="editChatTitle(item, $event)">
                <Edit/>
              </el-icon>
              <el-icon class="delete-btn" @click="deleteChat(item, $event)">
                <Delete/>
              </el-icon>
            </div>
          </div>
          <div v-if="loading" class="loading-item">
            <el-icon class="is-loading">
              <Loading/>
            </el-icon>
            加载中...
          </div>
          <div v-if="finished && chatList.length > 0 && !loading" class="finished-item">
            没有更多对话了
          </div>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss">
.media-page {
  padding: 16px 16px 0 16px;

  .newChat {
    width: 100%;
    border-radius: 8px;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
  }

  .search-input {
    margin-bottom: 10px;
  }
}

.chat-history {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #8a939d;

  .chat-history-actions {
    display: flex;
    align-items: center;
    gap: 8px;

    .clear-all-btn {
      font-size: 12px;
      padding: 6px 12px;
      height: auto;
      border-radius: 6px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 4px;
      color: #8a939d;
      background: transparent;
      
      .clear-icon {
        font-size: 14px;
        transition: all 0.3s ease;
      }
      
      span {
        font-weight: 500;
        transition: all 0.3s ease;
      }
      
      &:hover {
        color: #f56c6c;
        background: rgba(245, 108, 108, 0.08);
        
        .clear-icon {
          transform: scale(1.1);
        }
      }
      
      &:active {
        transform: scale(0.95);
        background: rgba(245, 108, 108, 0.15);
      }
    }
  }
}

.content {
  margin-top: 10px;
}

.chat-wrap-box {
  max-height: calc(100vh - 509px);
  padding-right: 8px;

  .loading-item {
    text-align: center;
    font-size: 12px;
    color: #8a939d;
  }

  .finished-item {
    text-align: center;
    font-size: 12px;
    color: #8a939d;
  }

  .chat-item {
    width: 100%;
    padding: 8px;
    border-radius: 8px;
    margin-bottom: 8px;
    background: #fff;
    border: 1px solid #e8eaed;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;

    &:hover {
      border-color: #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
    }

    .chat-content {
      flex: 1;
      min-width: 0;

      .chat-title {
        width: 100%;
        font-size: 14px;
        color: #2c3e50;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .chat-time {
        font-size: 12px;
        color: #8a939d;
      }
    }

    .chat-actions {
      padding-top: 16px;
      margin-left: 8px;
      flex-shrink: 0;
      display: flex;
      gap: 4px;

      .label {
        position: absolute;
        top: 0;
        right: 0;
        font-size: 12px;
        color: #fff;
        border-radius: 0 6px 0 6px;
        background: linear-gradient(90deg, rgba(200, 129, 235, 1) 0%, rgba(79, 189, 253, 1) 100%);
        padding: 1px 4px;
      }
      .edit-btn {
        transition: all 0.3s ease;
        width: 20px;
        height: 20px;
        color: #409eff;
        cursor: pointer;

        &:hover {
          transform: scale(1.1);
          color: #337ecc;
        }
      }

      .delete-btn {
        transition: all 0.3s ease;
        width: 20px;
        height: 20px;
        color: #f56c6c;
        cursor: pointer;

        &:hover {
          transform: scale(1.1);
          color: #f23030;
        }
      }
    }
  }

  .chat-item-selected {
    background: #e0def8;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
  }
}
</style>
