<script setup>
import {CopyDocument, EditPen, Promotion, RefreshRight, VideoPause} from '@element-plus/icons-vue'
import {fetchEventSource} from '@microsoft/fetch-event-source'
import {ElMessage} from 'element-plus'
import {debounce} from 'lodash-es'
import {defineEmits, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue'
import {useRoute} from 'vue-router'
import {ragAppDetailApi} from '@/api/ai/rag'
import {useUserStore} from '@/store/modules/user'
import MarkdownEventStream from './eventStream.vue'
import Sidebar from "@/views/app/sidebar.vue";

const emits = defineEmits(['chatEnd'])

const tempId = Date.now() + 1
// 用户是否在查看历史消息（距离底部超过100px认为是查看历史）
const isUserScrollingUp = ref(false)
// 是否应该自动滚动到底部
const shouldAutoScroll = ref(true)
// 是否正在处理用户主动滚动（防止滚动事件被误判）
const isUserScrolling = ref(false)
// 最后滚动时间戳，用于防止频繁触发
const lastScrollTime = ref(0)
// 用户最后主动滚动的时间
const lastUserScrollTime = ref(0)

// 初始化消息列表
const messages = reactive([
  // 可以添加一些初始消息
])

// AbortController 用于中断 SSE 连接
let controller = null

const route = useRoute()
const userStore = useUserStore()

// RAG应用信息
const ragAppInfo = ref({
  name: '',
  remark: '',
  icon: '',
  knowledgeBaseName: '',
  modelName: ''
})
const appId = ref()
// 模型名称
const aiModelName = ref('')
const aiModelIcon = ref('')
// 初始化问题输入框的值
const question = ref('')
const answerRef = ref(null)
const answerThinkRef = ref(null)
// 发送问题的函数
// 是否在问答过程中 true 表示不在问答中，false 表示在问答中
const isFinish = ref(true)

// 加载RAG应用信息
async function loadRagAppInfo() {
  try {
    if (appId.value) {
      const res = await ragAppDetailApi(appId.value)
      ragAppInfo.value = {
        name: res.data.name || '',
        remark: res.data.remark || '',
        icon: res.data.icon || '',
        knowledgeBaseName: res.data.knowledge.name || '',
        modelName: res.data.chatModel.name || ''
      }
      aiModelName.value = res.data.chatModel.name || ''
      aiModelIcon.value = res.data.chatModel.providerIcon || ''
    }
  } catch (error) {
    console.error('加载RAG应用信息失败:', error)
  }
}

onMounted(() => {
  appId.value = route.params.id
  // 加载RAG应用信息
  loadRagAppInfo()
})

// 组件销毁时清理资源
onBeforeUnmount(() => {
  // 中断所有正在进行的 SSE 连接
  if (controller) {
    console.warn('onBeforeUnmount - 清理 SSE 连接')
    controller.abort()
    controller = null
  }
})

const chatContainer = ref(null)

// 检查用户是否接近底部
function isNearBottom(threshold = 100) {
  if (!chatContainer.value) {
    return true
  }
  const {scrollTop, scrollHeight, clientHeight} = chatContainer.value
  return scrollHeight - scrollTop - clientHeight < threshold
}

// 监听滚动事件
const handleScroll = debounce(() => {
  if (!chatContainer.value || isUserScrolling.value) {
    return
  }
  const now = Date.now()
  lastUserScrollTime.value = now

  const nearBottom = isNearBottom(100)
  isUserScrollingUp.value = !nearBottom

  // 如果用户滚动到底部附近，重新启用自动滚动
  if (nearBottom) {
    shouldAutoScroll.value = true
  } else {
    // 用户向上滚动查看历史消息时，暂时禁用自动滚动
    shouldAutoScroll.value = false
  }
}, 100)

// 滚动到底部的函数
const scrollToBottom = debounce(() => {
  nextTick(() => {
    if (chatContainer.value && shouldAutoScroll.value) {
      isUserScrolling.value = true
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      // 延迟重置标记，避免滚动事件被误判
      setTimeout(() => {
        isUserScrolling.value = false
      }, 100)
    }
  })
}, 30)

// 手动滚动到底部（用户点击按钮）
function scrollToBottomManually() {
  if (chatContainer.value) {
    isUserScrolling.value = true
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    shouldAutoScroll.value = true
    isUserScrollingUp.value = false
    // 延迟重置标记
    setTimeout(() => {
      isUserScrolling.value = false
    }, 100)
  }
}

// 处理内容更新时的滚动
function handleContentUpdate() {
  const now = Date.now()

  // 防止频繁触发（100ms内最多触发一次）
  if (now - lastScrollTime.value < 100) {
    return
  }

  // 如果用户最近主动滚动过（500ms内），不自动滚动
  // 但如果用户滚动时间被重置为0（重新发送/重新生成），则允许滚动
  if (lastUserScrollTime.value > 0 && now - lastUserScrollTime.value < 500) {
    return
  }

  // 只有当用户接近底部且不在用户滚动过程中时才自动滚动
  if (shouldAutoScroll.value && !isUserScrolling.value) {
    // 再次检查是否真的接近底部
    if (isNearBottom(150)) {
      lastScrollTime.value = now
      scrollToBottom()
    }
  }
}

// 处理鼠标滚轮事件
function handleWheel() {
  const now = Date.now()
  lastUserScrollTime.value = now

  // 用户使用滚轮滚动时，暂时禁用自动滚动
  if (!isNearBottom(100)) {
    shouldAutoScroll.value = false
    isUserScrollingUp.value = true
  }
}

// 处理触摸开始事件
function handleTouchStart() {
  const now = Date.now()
  lastUserScrollTime.value = now

  // 记录触摸开始时的滚动位置
  if (chatContainer.value) {
    const scrollTop = chatContainer.value.scrollTop
    const scrollHeight = chatContainer.value.scrollHeight
    const clientHeight = chatContainer.value.clientHeight

    // 如果不在底部附近，标记为用户主动滚动
    if (scrollHeight - scrollTop - clientHeight > 100) {
      shouldAutoScroll.value = false
      isUserScrollingUp.value = true
    }
  }
}

// 处理触摸结束事件
function handleTouchEnd() {
  // 触摸结束后检查是否回到底部附近
  setTimeout(() => {
    if (isNearBottom(100)) {
      shouldAutoScroll.value = true
      isUserScrollingUp.value = false
    }
  }, 100)
}

// 发送问题
function sendQuestion(question) {
  if (question.trim() === '') {
    return
  }
  // 添加用户的问题到消息列表
  messages.push({
    sender: 'user',
    content: question.trimEnd(),
    editContent: question.trimEnd(),
    isEdit: false,
    id: tempId,
    isHistory: false
  })

  // 用户发送消息时，总是滚动到底部
  shouldAutoScroll.value = true
  isUserScrollingUp.value = false
  isUserScrolling.value = false
  // 强制滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
  // AI 回答
  nextTick(() => {
    handleAnswer(question.trimEnd())
  })
}

// 处理 AI 回答
// 可以根据需要对回答进行格式化或处理
const interfaceFinish = ref(false) // true表示接口返回完成 false未完成
const conversationId = ref('')
const thinkFinish = ref(true) // 整体思考控制 true表示思考完成 false表示思考未完成
const content = ref('')

function handleAnswer(msg, repeat = false, newsId) {
  content.value = ''
  const thinkContent = ref('')
  const baseURL = (import.meta.env.DEV && import.meta.env.VITE_OPEN_PROXY) ? '/proxy/' : import.meta.env.VITE_APP_API_BASEURL
  // 使用解构赋值，将modelIcon属性删除
  const params = {
    appId: appId.value,
    message: question.value ? question.value : msg
  }

  // 如果消息为空，则不发送
  if (params.message === '') {
    return
  }

  // 清空输入框
  question.value = ''
  // 占位消息
  if (!repeat) {
    // thinkFinish: true表示思考完成 false表示思考未完成
    messages.push(reactive({
      sender: 'ai',
      content: content.value,
      id: tempId,
      isHistory: false,
      thinkContent: '',
      thinkFinish: true
    }))
  }
  isFinish.value = false

  // 创建新的 AbortController 用于中断当前请求
  controller = new AbortController()
  const {signal} = controller

  fetchEventSource(`${baseURL}aigc/rag/app/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'satoken': userStore.token,
    },
    body: JSON.stringify(params),
    openWhenHidden: true, // 在调用失败时禁止重复调用
    signal,
    onmessage(event) {
      if (event.event === 'error') {
        const msg = JSON.parse(event.data).msg || '连接出现错误，请重试'
        ElMessage.error(msg)
      }
      if (event.data) {
        const parseData = JSON.parse(event.data)
        if (parseData.content) {
          // 深度思考
          if (event.event === 'reasoning') {
            thinkContent.value += parseData.content
            // 如果不是重新生成，则更新最后一条消息内容
            if (!repeat) {
              thinkFinish.value = false
              // 更新最后一条消息内容
              updateLastMessageThinkContent(thinkContent.value, tempId)
            } else {
              thinkFinish.value = true
              // 如果是重新生成，则更新最后一条消息内容
              updateLastMessageForRefreshThinkContent(thinkContent.value, newsId)
            }
          } else {
            content.value += parseData.content
            // 如果不是重新生成，则更新最后一条消息内容
            if (!repeat) {
              if (thinkFinish.value) {
                // 思考完成 更新最后一条消息内容
                updateLastMessage(content.value, tempId)
              }
            } else {
              if (thinkFinish.value) {
                // 思考完成 如果是重新生成，则更新最后一条消息内容
                updateLastMessageForRefresh(content.value, newsId)
              }
            }
          }
        }
      }
    },
    onclose() {
      interfaceFinish.value = true
      // 中断 SSE 连接
      if (controller) {
        controller.abort()
        controller = null
      }
      console.warn('SSE Connection closed')
    },
    onerror(error) {
      isFinish.value = true
      interfaceFinish.value = true

      // 中断 SSE 连接
      if (controller) {
        controller.abort()
        controller = null
        return // 必须return，否则库会继续重试
      }
      // 如果是用户主动中断连接，不显示错误信息
      if (error.name === 'AbortError') {
        console.warn('SSE Connection aborted by user')
        return // 必须return，否则库会继续重试
      } else {
        controller.abort()
        controller = null
        console.error('SSE Connection error:', error)
        ElMessage.error('连接出现错误，请重试')
        return // 必须return，否则库会继续重试
      }
    },
  })
}

// 暂停回答
function handlePause() {
  console.warn('handlePause - 开始暂停接口')

  // 中断 SSE 连接
  if (controller) {
    console.warn('handlePause - 中断 SSE 连接')
    controller.abort()
    controller = null
  }

  // 停止前端的打字机效果
  if (answerRef.value) {
    const lastIndex = answerRef.value.length - 1
    if (lastIndex >= 0 && answerRef.value[lastIndex]) {
      answerRef.value[lastIndex].clearAllTimers()
      console.warn('handlePause - 停止回答的打字机效果', lastIndex)
    }
  }

  if (answerThinkRef.value) {
    const lastIndex = answerThinkRef.value.length - 1
    if (lastIndex >= 0 && answerThinkRef.value[lastIndex]) {
      answerThinkRef.value[lastIndex].clearAllTimers()
      console.warn('handlePause - 停止思考的打字机效果', lastIndex)
    }
  }

  // 更新状态
  isFinish.value = true
  interfaceFinish.value = true

  console.warn('handlePause - 暂停完成')
}

// 替代每次都map整个数组的方式 替换content
function updateLastMessage(content, tempId) {
  const lastIndex = messages.length - 1
  if (lastIndex >= 0 && messages[lastIndex].id === tempId && messages[lastIndex].sender === 'ai') {
    messages[lastIndex] = Object.assign({}, messages[lastIndex], {content})
  }
}

// 替换thinkContent
function updateLastMessageThinkContent(thinkContent, tempId) {
  // console.log('updateLastMessageThinkContent', thinkContent, tempId, messages)
  const lastIndex = messages.length - 1
  if (lastIndex >= 0 && messages[lastIndex].id === tempId && messages[lastIndex].sender === 'ai') {
    messages[lastIndex] = Object.assign({}, messages[lastIndex], {thinkContent})
  }
}

// 更新最后一条消息内容思考状态
function _updateLastMessageThinkFinish(thinkFinish, tempId) {
  const lastIndex = messages.length - 1
  if (lastIndex >= 0 && messages[lastIndex].id === tempId) {
    messages[lastIndex] = Object.assign({}, messages[lastIndex], {thinkFinish})
  }
}

// 重新生成更新最后一条消息 替换content
function updateLastMessageForRefresh(content, newsId) {
  const lastIndex = messages.length - 1
  if (lastIndex >= 0 && messages[lastIndex].chatId === newsId) {
    messages[lastIndex] = Object.assign({}, messages[lastIndex], {content})
  }
}

// 重新生成更新最后一条消息 替换thinkContent
function updateLastMessageForRefreshThinkContent(thinkContent, newsId) {
  const lastIndex = messages.length - 1
  if (lastIndex >= 0 && messages[lastIndex].chatId === newsId) {
    messages[lastIndex] = Object.assign({}, messages[lastIndex], {thinkContent})
  }
}

// 重新生成更新最后一条消息 替换thinkFinish
function _updateLastMessageForRefreshThinkFinish(thinkFinish, newsId) {
  const lastIndex = messages.length - 1
  if (lastIndex >= 0 && messages[lastIndex].chatId === newsId) {
    messages[lastIndex] = Object.assign({}, messages[lastIndex], {thinkFinish})
  }
}

// 复制发送的消息
function handleCopy(content) {
  navigator.clipboard.writeText(content).then(() => {
    ElMessage.success('复制成功')
  })
}

// 发送的消息编辑
const inputRefs = ref([])

// 设置 refs
function setRefs(el, index) {
  if (el) {
    inputRefs.value[index] = el // 将每个输入框存储到数组中
  }
}

function handleEdit(msg) {
  // 修改当前消息isEdit状态
  const index = messages.findIndex(item => item.chatId === msg.chatId && item.sender === 'user')
  if (index >= 0) {
    messages[index] = Object.assign({}, messages[index], {isEdit: !msg.isEdit, editContent: msg.content})
    if (!msg.isEdit) {
      // 当前隐藏状态，显示后需要focus
      if (inputRefs.value[index]) {
        setTimeout(() => {
          inputRefs.value[index].focus() // 调用 focus 方法
        }, 0)
      }
    }
  }
}

// 重新发送消息处理
function handleReSend(msg) {
  if (msg.editContent.trim() === '' || msg.editContent.trim() === msg.content.trim()) {
    return
  }
  question.value = msg.editContent

  // 重新发送消息时，总是滚动到底部
  shouldAutoScroll.value = true
  isUserScrollingUp.value = false
  // 重置用户滚动时间，确保可以自动滚动
  lastUserScrollTime.value = 0

  sendQuestion(msg.editContent)
  handleEdit(msg)

  // 强制滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
}

// 重新生成消息处理
function handleRefresh() {
  // 先中断当前连接（如果有的话）
  if (controller) {
    controller.abort()
    controller = null
  }
  // 重新生成时，总是滚动到底部
  shouldAutoScroll.value = true
  isUserScrollingUp.value = false
  isUserScrolling.value = false
  // 重置用户滚动时间，确保可以自动滚动
  lastUserScrollTime.value = 0

  // 处理最后一条
  const lastIndex = messages.length - 1
  messages[lastIndex] = {...messages[lastIndex], content: '', thinkContent: '', thinkFinish: true}
  // 重新发送
  const question = messages[lastIndex - 1].content
  handleAnswer(question, true, messages[lastIndex - 1].chatId)

  // 强制滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
}

// 通知回答结束
function noticeFinish() {
  isFinish.value = true
  emits('chatEnd', conversationId.value)
}

// 通知思考结束
function noticeThinkFinish() {
  thinkFinish.value = true
  // 思考完成 如果此时接口已经结束了 则更新最后一条消息内容思考状态
  if (interfaceFinish.value) {
    updateLastMessage(content.value, tempId)
  }

  // 思考完成后，确保滚动条保持在底部
  nextTick(() => {
    // isUserScrolling.value = false
    if (shouldAutoScroll.value && !isUserScrolling.value) {
      scrollToBottom()
    }
  })
}

</script>

<template>
  <div class="rag-app-container">
    <!-- 侧边栏 -->
    <div class="sidebar-section">
      <Sidebar/>
    </div>
    <div class="chat-content">
      <div class="qa-page">
        <!-- 应用信息头部 -->
        <div class="app-header">
          <div class="app-info">
            <div class="app-icon">
              <img v-if="ragAppInfo.icon" :src="ragAppInfo.icon" alt="应用图标" class="icon-img">
              <div v-else class="default-icon">🤖</div>
            </div>
            <div class="app-details">
              <h2 class="app-name">{{ ragAppInfo.name }}</h2>
              <p class="app-description">{{ ragAppInfo.remark }}</p>
              <div class="app-meta">
                <span class="meta-item">
                  <span class="meta-label">知识库：</span>
                  <span class="meta-value">{{ ragAppInfo.knowledgeBaseName }}</span>
                </span>
                <span class="meta-item">
                  <span class="meta-label">模型：</span>
                  <span class="meta-value">{{ ragAppInfo.modelName }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 问题列表 -->
        <div ref="chatContainer" class="question-list" @scroll="handleScroll" @wheel="handleWheel"
             @touchstart="handleTouchStart" @touchend="handleTouchEnd">
          <div v-for="(message, index) in messages" :key="index" class="message"
               :class="[message.sender === 'ai' ? 'ai' : 'user']">
            <div v-show="message.sender === 'ai'" class="sender-ai">
              <div>
                <!-- AI -->
                <!-- <FaIcon name="i-material-symbols:deployed-code-sharp" class="icon" /> -->
                <img v-if="aiModelIcon" :src="aiModelIcon" alt="AI" class="icon">
                <img v-else src="@/assets/images/aichat.png" alt="AI" class="icon">
              </div>
            </div>
            <!-- 用户消息 -->
            <div v-if="message.sender === 'user'" :class="{ 'full-width': message.isEdit }">
              <div class="user-name">
                {{ userStore.nickname }}
              </div>
              <div v-show="!message.isEdit" class="user-message">
                {{ message.content }}
              </div>
              <div v-show="!message.isEdit" class="user-operate">
                <el-icon @click="handleCopy(message.content)">
                  <CopyDocument/>
                </el-icon>
                <el-icon @click="handleEdit(message)">
                  <EditPen/>
                </el-icon>
              </div>
              <div v-show="message.isEdit" class="edit-msg-box">
                <el-input :id="`input-${index}`" :ref="(el) => setRefs(el, index)" v-model="message.editContent"
                          type="textarea" resize="none" :rows="3" class="input-box"/>
                <div class="operate-btn">
                  <el-button type="info" @click="handleEdit(message)">
                    取消
                  </el-button>
                  <el-button type="primary" @click="handleReSend(message)">
                    发送
                  </el-button>
                </div>
              </div>
            </div>

            <!-- AI消息 -->
            <div v-else>
              <div class="ai-name">
                {{ aiModelName }}
              </div>
              <div v-if="message.thinkContent" class="think-content"
                   :class="{ completed: index < messages.length - 1 || thinkFinish }">
                <div v-if="index === messages.length - 1">
                  {{ thinkFinish ? '已深度思考' : '思考中' }}
                </div>
                <div v-else>
                  已深度思考
                </div>
                <MarkdownEventStream v-if="!message.isHistory" ref="answerThinkRef" type="think"
                                     :initial-content="message.thinkContent" :is-typing="true"
                                     @update-height="handleContentUpdate" @notice-stop="noticeThinkFinish"/>
                <MarkdownEventStream v-if="message.isHistory" ref="answerThinkRef" type="think"
                                     :initial-content="message.thinkContent" :is-typing="false"/>
              </div>
              <div v-show="thinkFinish || index < messages.length - 1" class="answer-content">
                <MarkdownEventStream v-if="!message.isHistory" ref="answerRef" type="answer"
                                     :initial-content="message.content" :is-typing="true"
                                     :interface-finish="interfaceFinish" @update-height="handleContentUpdate"
                                     @notice-stop="noticeFinish"/>
                <MarkdownEventStream v-if="message.isHistory" ref="answerRef" type="answer"
                                     :initial-content="message.content" :is-typing="false"/>
                <div v-show="(isFinish && message.content) || index < messages.length - 1"
                     class="user-operate answer-operate">
                  <el-tooltip
                      class="box-item"
                      effect="light"
                      content="复制"
                      placement="top-start"
                  >
                    <el-icon @click="handleCopy(message.content)">
                      <CopyDocument/>
                    </el-icon>
                  </el-tooltip>
                  <el-tooltip
                      class="box-item"
                      effect="light"
                      content="重新生成"
                      placement="top-start"
                  >
                    <el-icon v-show="index === messages.length - 1" @click="handleRefresh()">
                      <RefreshRight/>
                    </el-icon>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div v-show="message.sender === 'user'" class="sender-user">
              <div>
                <img :src="userStore.userInfo.avatar" alt="User" class="icon">
              </div>
            </div>
          </div>
        </div>

        <!-- 滚动到底部按钮 -->
        <div v-show="isUserScrollingUp" class="scroll-to-bottom-btn" @click="scrollToBottomManually">
          <el-tooltip content="回到最新消息" placement="top">
            <el-icon class="scroll-icon">
              <svg viewBox="0 0 1024 1024" width="20" height="20">
                <path
                    d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm32 664c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V456c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v272zm-32-344a48.01 48.01 0 0 1 0-96 48.01 48.01 0 0 1 0 96z"
                    fill="currentColor"/>
              </svg>
            </el-icon>
          </el-tooltip>
        </div>

        <!-- 输入框和发送按钮 -->
        <div class="input-container">
          <el-input
              v-model="question"
              type="textarea"
              placeholder="请输入问题"
              :rows="3"
              resize="none"
              class="chat-input"
              @keyup.enter.prevent="sendQuestion(question)"
          />
          <div class="send-btn-box">
            <div class="left-box">
            </div>
            <el-tooltip
                v-if="isFinish"
                class="box-item"
                effect="light"
                content="发送"
                placement="top-start"
            >
              <el-button
                  v-if="isFinish"
                  v-auth
                  type="primary"
                  :icon="Promotion"
                  circle
                  class="submit-btn"
                  @click="sendQuestion(question)"
              />
            </el-tooltip>
            <el-icon v-else class="stop-icon" @click="handlePause">
              <VideoPause/>
            </el-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

.rag-app-container {
  min-height: calc(100vh - 101px);
  background: #f5f7fa;
  display: flex;
}

.sidebar-section {
  width: 239px;
  min-width: 239px;
  flex-shrink: 0;
  background: white;
  border-right: 1px solid #e9ecef;
  position: fixed;
  left: 0;
  top: 60px;
  height: calc(100% - 60px);
  overflow-y: auto;
  z-index: 100;
}

.chat-content {
  flex: 1;
  margin-left: 239px;
  padding: 20px;
  overflow-y: auto;
  min-height: calc(100vh - 101px);
}

.qa-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  border: none;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 32px;
  flex-shrink: 0;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.default-icon {
  font-size: 24px;
}

.app-details {
  flex: 1;
}

.app-name {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.app-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}

.app-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.meta-label {
  color: #64748b;
  font-weight: 500;
}

.meta-value {
  color: #3b82f6;
  font-weight: 600;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 6px;
}

.question-list {
  height: 100%;
  padding: 32px 32px 180px 32px;
  overflow-y: auto;
  background: #f8fafc;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(226, 232, 240, 0.5);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;

    &:hover {
      background: #94a3b8;
    }
  }
}

.ai {
  justify-content: flex-start;
}

.user {
  justify-content: flex-end;
}

.answer-content {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.think-content {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  margin-bottom: 0;
  font-size: 14px;
  line-height: 1.6;
  position: relative;
  box-shadow: none;
  transition: all 0.3s ease;


  // 思考标题样式
  > div:first-child {
    font-weight: 600;
    color: #667eea;
    margin-bottom: 12px;
    padding-left: 20px;
    font-size: 15px;
    display: flex;
    align-items: center;
    gap: 8px;

    // 思考状态图标
    &::before {
      content: '💭';
      font-size: 16px;
      animation: pulse 2s infinite;
      filter: hue-rotate(0deg) saturate(1.2) brightness(0.8);
    }
  }

  // 思考内容区域
  :deep(.markdown-content) {
    padding-left: 20px;
    color: #4a5568;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 12px;
    padding: 16px;
    border-left: 4px solid #667eea;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  // 悬停效果
  &:hover {
    border-color: #667eea;
    box-shadow: 0 6px 25px rgba(102, 126, 234, 0.15);
    transform: translateY(-2px);
  }
}

// 思考完成状态的样式
.think-content.completed {
  background: transparent;
  border: none;

  > div:first-child {
    color: #8b5cf6;

    &::before {
      content: '✅';
      animation: none;
    }
  }

  :deep(.markdown-content) {
    border-left-color: #8b5cf6;
  }
}

// 动画定义
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.message {
  display: flex;
  width: 100%;
  margin-bottom: 24px;
  font-size: 16px;
  line-height: 1.6;
  animation: fadeInUp 0.5s ease;

  .sender-ai {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    margin-right: 16px;
    background: #f1f5f9;
    border: 2px solid #e2e8f0;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .sender-ai div {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #333;
    border-radius: 50%;
    overflow: hidden;

    .icon {
      width: 80%;
      height: 80%;
      object-fit: cover;
      border-radius: 50%;
    }
  }

  .sender-user {
    flex-shrink: 0;
    width: 42px;
    height: 42px;
    margin-left: 12px;
    background: #f8f9fa;
    border: 2px solid #e9ecef;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;

    div {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: #333;
      border-radius: 50%;
      overflow: hidden;
    }

    .icon {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
  }
}

.user-message {
  padding: 16px 20px;
  margin-left: 64px;
  background: white;
  color: #2c3e50;
  border: 1px solid #e2e8f0;
  border-radius: 20px 4px 20px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  position: relative;
  max-width: 80%;
}

.user-message::before {
  content: '';
  position: absolute;
  top: 20px;
  right: -8px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8px 0 8px 8px;
  border-color: transparent transparent transparent white;
}

.user-operate {
  padding-right: 0;
  margin-top: 8px;
  font-size: 24px;
  color: #8e8e93;
  text-align: right;

  .el-icon {
    margin: 0 8px;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      color: #667eea;
      background: #f0ebff;
      transform: scale(1.1);
    }
  }
}

.answer-operate {
  text-align: left;
  margin-top: 8px;
}

.edit-msg-box {
  box-sizing: border-box;
  width: 100%;
  padding: 16px 20px;
  margin: 8px 0;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  border: 1px solid #e1e8ff;
  border-radius: 12px;
  position: relative;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.08);

  .input-box {
    border: 2px solid #e1e8ff;
    border-radius: 8px;
    transition: all 0.3s ease;
    background: #fff;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);

    :deep(.el-textarea__inner) {
      border: none;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.5;
      color: #2c3e50;
      background: transparent;
      resize: none;
      box-shadow: none;

      &:focus {
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
      }

      &::placeholder {
        color: #a0a9c0;
        font-size: 14px;
      }
    }

    &:focus-within {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }

  .operate-btn {
    margin-top: 16px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    align-items: center;

    .el-button {
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      padding: 8px 20px;
      transition: all 0.3s ease;
      border: none;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s;
      }

      &:hover::before {
        left: 100%;
      }

      &.el-button--info {
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        color: #606266;
        border: 1px solid #d9d9d9;

        &:hover {
          background: linear-gradient(135deg, #e9ecef 0%, #adb5bd 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        &:active {
          transform: translateY(0);
        }
      }

      &.el-button--primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        border: none;

        &:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }
  }
}

.user-name {
  text-align: right;
  color: #666;
  margin-top: 8px;
  margin-bottom: 10px;
}

.ai-name {
  color: #666;
  margin-top: 8px;
  margin-bottom: 10px;
}

.ai-message {
  width: calc(100% - 66px);
  margin-right: 64px;
  background: transparent;
  border-radius: 0;
  padding: 16px 20px;
  overflow: hidden;
  font-size: 16px;
  line-height: 1.6;
  color: #2c3e50;
  max-width: 80%;
  word-wrap: break-word;
  box-shadow: none;
  border: none;
  position: relative;
}

.full-width {
  width: 100%;
}

.input-container {
  box-sizing: border-box;
  width: 100%;
  max-width: 900px;
  padding: 20px;
  margin: auto;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: fixed;
  bottom: 60px;
  left: 320px;
  right: 0;
  z-index: 1000;
}

.chat-input {
  :deep(.el-textarea__inner) {
    background: #ffffff;
    border: 0px solid #e9ecef;
    border-radius: 12px;
    padding: 3px;
    font-size: 15px;
    line-height: 1.6;
    box-shadow: none;
    resize: none;

    &:focus {
      border-color: #8b5cf6;
      box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
    }
  }
}

.send-btn-box {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .left-box {
    display: flex;
    gap: 12px;
    align-items: center;

    .model-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #fff;
      border: 1px solid #e2e8f0;
      padding: 8px 10px;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
      font-weight: 500;

      .btn-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        color: #262729;
        transition: color 0.3s ease;

        &.deep-thinking-icon {
          svg {
            transform: rotate(0deg);
            transition: transform 0.3s ease;
          }
        }

        &.network-search-icon {
          svg {
            transform: scale(1);
            transition: transform 0.3s ease;
          }
        }
      }

      .btn-text {
        color: #374151;
        transition: color 0.3s ease;
      }

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);

        .btn-icon {
          color: #3b82f6;

          &.deep-thinking-icon svg {
            transform: rotate(180deg);
          }

          &.network-search-icon svg {
            transform: scale(1.1);
          }
        }

        .btn-text {
          color: #1e40af;
        }
      }

      &.active {
        background: #f0f9ff;
        border-color: #3b82f6;
        color: #3b82f6;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

        .btn-icon {
          color: #327df7;
        }

        .btn-text {
          color: #327df7;
        }

        &:hover {
          // background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

.send-btn {
  align-self: flex-end;
  background: #3b82f6;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 14px;
  min-width: 80px;
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    transform: none;
    box-shadow: none;
  }
}

.submit-btn {
  align-self: flex-end;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;

  &:hover {
    background: linear-gradient(90deg, #5d77e7 0%, #7345a1 100%);
  }
}

.stop-icon {
  align-self: flex-end;
  font-size: 32px;
  color: #8b5cf6;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: #f0ebff;
    transform: scale(1.1);
  }
}

// 滚动到底部按钮样式
.scroll-to-bottom-btn {
  position: absolute;
  bottom: 180px;
  right: 30px;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  z-index: 10;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  }

  &:active {
    transform: translateY(0);
  }

  .scroll-icon {
    color: #fff;
    font-size: 20px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .qa-page {
    width: 95%;
    border-radius: 12px;
  }

  .question-list {
    padding: 16px 12px;
  }

  .message {
    margin-bottom: 16px;

    .sender-ai, .sender-user {
      width: 36px;
      height: 36px;
    }

    .user-message {
      margin-left: 48px;
      max-width: 85%;
    }

    .ai-message {
      margin-right: 48px;
      max-width: 85%;
    }
  }

  .input-container {
    padding: 16px;
    gap: 12px;
    bottom: 60px;
  }

  .chat-input {
    :deep(.el-textarea__inner) {
      padding: 12px;
      font-size: 14px;
    }
  }

  .send-btn {
    padding: 10px 20px;
    font-size: 13px;
    min-width: 70px;
  }

  .scroll-to-bottom-btn {
    bottom: 160px;
    right: 20px;
    width: 44px;
    height: 44px;

    .scroll-icon {
      font-size: 18px;
    }
  }

  .think-content {
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 16px;

    > div:first-child {
      font-size: 14px;
      margin-bottom: 8px;
    }

    :deep(.markdown-content) {
      padding: 12px;
      font-size: 13px;
    }
  }
}

@media (max-width: 480px) {
  .qa-page {
    width: 100%;
    border-radius: 0;
  }

  .message {
    .user-message, .ai-message {
      max-width: 90%;
      font-size: 14px;
    }
  }

  .input-container {
    padding: 12px;
    gap: 10px;
    bottom: 60px;
  }

  .chat-input {
    :deep(.el-textarea__inner) {
      padding: 10px;
      font-size: 14px;
    }
  }

  .send-btn {
    padding: 8px 16px;
    font-size: 12px;
    min-width: 60px;
  }

  .scroll-to-bottom-btn {
    bottom: 140px;
    right: 16px;
    width: 40px;
    height: 40px;

    .scroll-icon {
      font-size: 16px;
    }
  }

  .answer-content {
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 12px;

    &::before {
      top: 10px;
      left: 10px;
      width: 5px;
      height: 5px;
    }

    :deep(.markdown-content) {
      font-size: 13px;

      h1 {
        font-size: 18px;
        margin-top: 16px;
        margin-bottom: 8px;
      }

      h2 {
        font-size: 16px;
        margin-top: 14px;
        margin-bottom: 6px;
      }

      h3 {
        font-size: 14px;
        margin-top: 12px;
        margin-bottom: 4px;
      }

      p {
        margin-bottom: 12px;
      }

      pre {
        padding: 10px;
        font-size: 12px;
        margin: 12px 0;
      }

      code {
        font-size: 11px;
        padding: 1px 4px;
      }

      blockquote {
        padding: 8px 12px;
        margin: 12px 0;
      }

      ul, ol {
        padding-left: 20px;
        margin-bottom: 12px;

        li {
          margin-bottom: 6px;
        }
      }

      table {
        font-size: 12px;

        th, td {
          padding: 8px 10px;
        }
      }
    }
  }

  .think-content {
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 12px;

    > div:first-child {
      font-size: 13px;
      margin-bottom: 6px;
      padding-left: 16px;
    }

    &::before {
      top: 12px;
      left: 12px;
      width: 6px;
      height: 6px;
    }

    :deep(.markdown-content) {
      padding: 10px;
      font-size: 12px;
      border-radius: 8px;
    }
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计优化 */
@media (max-width: 1200px) {
  .sidebar-section {
    position: static;
    margin-bottom: 20px;
  }

  .chat-content {
    padding: 10px;
  }

  .qa-page {
    border-radius: 16px;
  }

  .input-container {
    left: 0;
  }
}

@media (max-width: 768px) {
  .rag-app-container {
    flex-direction: column;
  }

  .sidebar-section {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .chat-content {
    padding: 10px;
  }

  .qa-page {
    border-radius: 16px;
  }

  .app-header {
    padding: 16px 20px;
  }

  .app-info {
    gap: 12px;
  }

  .app-icon {
    width: 50px;
    height: 50px;
  }

  .app-name {
    font-size: 18px;
  }

  .app-description {
    font-size: 13px;
  }

  .app-meta {
    gap: 12px;
  }

  .meta-item {
    font-size: 12px;
  }

  .question-list {
    padding: 20px;
  }

  .message {
    .sender-ai, .sender-user {
      width: 40px;
      height: 40px;
    }

    .user-message {
      margin-left: 50px;
      max-width: 85%;
    }

    .ai-message {
      margin-right: 50px;
      max-width: 85%;
    }
  }

  .input-container {
    padding: 16px;
    gap: 12px;
    bottom: 60px;
  }

  .send-btn {
    padding: 12px 20px;
    font-size: 14px;
    min-width: 80px;
  }
}
</style>
