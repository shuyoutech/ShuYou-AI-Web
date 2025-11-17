<script setup>
import {CopyDocument, EditPen, InfoFilled, Loading, Promotion, RefreshRight, VideoPause} from '@element-plus/icons-vue'
import {fetchEventSource} from '@microsoft/fetch-event-source'
import {ElMessage} from 'element-plus'
import {debounce} from 'lodash-es'
import {defineEmits, defineProps, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue'
import {useRoute} from 'vue-router'
import {chatConversationDetailApi, chatMessagePageApi} from '@/api/ai/aigc'
import {modelPageApi} from '@/api/ai/model'
import {useUserStore} from '@/store/modules/user'
import MarkdownEventStream from './eventStream.vue'

const props = defineProps({
  chatObj: Object,
})
const emits = defineEmits(['chatEnd'])

// 控制深度思考和网络搜索按钮的显示
const showDeepBtn = ref(true)
const showNetBtn = ref(true)
const showModelConfig = ref(false)

const isDeepSeek = ref((localStorage.getItem('isDeepSeek') && localStorage.getItem('isDeepSeek') === 'true') || false)
const isLinkNet = ref((localStorage.getItem('isLinkNet') && localStorage.getItem('isLinkNet') === 'true') || false)

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

// 模型配置数据
const modelConfig = reactive({
  systemPrompt: '',
  maxMessageCount: 0,
  temperature: null,
  topP: null,
  maxOutputTokens: 0,
})

const conversationId = ref('')
const chatId = ref(route.query.id)
const isLoadingHistory = ref(false) // 是否正在加载历史消息
const chatParams = reactive({
  conversationId: chatId.value.startsWith('local_') ? '' : chatId.value,
  provider: '',
  model: '',
  function: '',
  params: {
    message: question.value,
    enableThinking: isDeepSeek.value,
    enableSearch: isLinkNet.value,
    prompt: modelConfig.systemPrompt,
    temperature: modelConfig.temperature,
    topP: modelConfig.topP,
    maxTokens: modelConfig.maxOutputTokens,
    messageCount: modelConfig.maxMessageCount,
  },
})

function initChat() {
  if (chatId.value && chatId.value.startsWith('local_')) {
    const localChatObj = localStorage.getItem('local_currentChatObj')
    if (localChatObj) {
      const chatObj = JSON.parse(localChatObj)
      aiModelIcon.value = chatObj.modelIcon
      aiModelName.value = chatObj.model
      showDeepBtn.value = chatObj.modelEnableThinking !== undefined ? chatObj.modelEnableThinking : false
      showNetBtn.value = chatObj.modelEnableSearch !== undefined ? chatObj.modelEnableSearch : false
      isDeepSeek.value = chatObj.params.enableThinking !== undefined ? chatObj.params.enableThinking : false
      isLinkNet.value = chatObj.params.enableSearch !== undefined ? chatObj.params.enableSearch : false
      modelConfig.systemPrompt = chatObj.params.prompt
      modelConfig.maxMessageCount = chatObj.params.messageCount
      modelConfig.temperature = chatObj.params.temperature
      modelConfig.topP = chatObj.params.topP
      modelConfig.maxOutputTokens = chatObj.params.maxTokens

      chatParams.function = chatObj.function
      chatParams.provider = chatObj.provider
      chatParams.model = chatObj.model
      question.value = chatObj.params.message
      chatParams.params.message = chatObj.params.message
      chatParams.params.fileIds = chatObj.params.fileIds
      chatParams.params.imageIds = chatObj.params.imageIds
      chatParams.params.sourceLang = chatObj.params.sourceLang
      chatParams.params.targetLang = chatObj.params.targetLang
      sendQuestion(question.value)
    }
  } else if (chatId.value) {
    messages.splice(0, messages.length)

    chatConversationDetailApi(chatId.value).then((res) => {
      if (res.code === 0) {
        chatParams.function = res.data.function
        chatParams.provider = res.data.provider
        chatParams.model = res.data.modelName
        chatParams.conversationId = res.data.conversationId
        conversationId.value = res.data.conversationId

        const paramsObj = JSON.parse(res.data.params)
        chatParams.params.enableThinking = paramsObj.enableThinking
        chatParams.params.enableSearch = paramsObj.enableSearch
        chatParams.params.sourceLang = paramsObj.sourceLang
        chatParams.params.targetLang = paramsObj.targetLang
        isDeepSeek.value = paramsObj.enableThinking
        isLinkNet.value = paramsObj.enableSearch
        modelConfig.systemPrompt = paramsObj.prompt
        modelConfig.maxMessageCount = paramsObj.messageCount
        modelConfig.temperature = paramsObj.temperature
        modelConfig.topP = paramsObj.topP
        modelConfig.maxOutputTokens = paramsObj.maxTokens
      }
    })

    getChatNewsList(chatId.value)
  } else {
    console.warn('initChat - chatId is undefined or empty')
  }
}

onMounted(() => {
  // 初始化聊天
  nextTick(() => {
    initChat()
  })
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

// 监听路由变化 切换历史会话用
watch(() => route.query.id, (newId, oldId) => {
  chatId.value = newId || ''
  if (newId && newId !== oldId && oldId && !oldId.startsWith('local_')) {
    initChat()
  }
}, {immediate: true, deep: true})
watch(() => route.query.type, (newVal, oldVal) => {
  // 从新建对话切换到历史对话
  if (newVal === undefined && oldVal === 'add') {
    initChat()
  }
}, {immediate: true})

// 获取聊天历史消息列表
function getChatNewsList(chatId) {
  if (!chatId) {
    return
  }
  isLoadingHistory.value = true
  messages.value = []
  const params = {
    pageNum: '1',
    pageSize: '1000',
    sort: '',
    order: '',
    query: {
      conversationId: chatId,
    },
  }
  chatMessagePageApi(params).then((res) => {
    if (res.code === 0) {
      const newsList = ref([])
      const reverseList = res.data.rows.reverse()
      // 获取ai名称和图标
      if (reverseList[0].modelName && reverseList[0].provider) {
        aiModelName.value = reverseList[0].modelName ? reverseList[0].modelName : ''
        getModelIcon(reverseList[0].provider, reverseList[0].modelName)
      }
      reverseList.forEach((item) => {
        // id是整个会话id，chatId是一回消息的id
        const userObj = {
          sender: 'user',
          content: item.userMessage,
          editContent: item.userMessage,
          isEdit: false,
          id: item.conversationId,
          isHistory: true,
          chatId: item.id,
        }
        const index = newsList.value.findIndex(item => item.chatId === userObj.chatId && item.sender === userObj.sender)
        if (index === -1) {
          newsList.value.push(userObj)
        }
        const aiObj = {
          sender: 'ai',
          content: item.assistantMessage,
          id: item.conversationId,
          isHistory: true,
          chatId: item.id,
          thinkContent: '',
          thinkFinish: true,
        }
        const index1 = newsList.value.findIndex(item => item.chatId === aiObj.chatId && item.sender === aiObj.sender)
        if (index1 === -1) {
          newsList.value.push(aiObj)
        }
      })
      newsList.value.forEach((ele) => {
        messages.push({...ele})
      })
    }
    isLoadingHistory.value = false
  }).catch((error) => {
    console.error('获取聊天历史失败:', error)
    isLoadingHistory.value = false
  })
}

// 根据模型供应商和模型名称获取模型的图标 是否可以深度思考和联网搜索
function getModelIcon(provider, modelName) {
  const params = {
    pageNum: '1',
    pageSize: '10',
    query: {
      provider,
      modelType: '',
      name: modelName,
      beenHot: null,
      modelTag: '',
    },
  }
  modelPageApi(params).then((res) => {
    if (res.code === 0) {
      aiModelIcon.value = res.data.rows[0] ? res.data.rows[0].providerIcon : ''
      showDeepBtn.value = res.data.rows[0] ? (res.data.rows[0].enableThinking !== undefined ? res.data.rows[0].enableThinking : false) : false
      showNetBtn.value = res.data.rows[0] ? (res.data.rows[0].enableSearch !== undefined ? res.data.rows[0].enableSearch : false) : false
    }
  })
}

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
    isHistory: false,
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
const thinkFinish = ref(true) // 整体思考控制 true表示思考完成 false表示思考未完成
const content = ref('')
const isWaitingForResponse = ref(false) // 是否正在等待AI回答

function handleAnswer(msg, repeat = false, newsId) {
  content.value = ''
  const thinkContent = ref('')
  const baseURL = (import.meta.env.DEV && import.meta.env.VITE_OPEN_PROXY) ? '/proxy/' : import.meta.env.VITE_APP_API_BASEURL

  // 发送消息之前再次更新参数，防止用户输入框有内容，但是发送消息时没有更新参数
  chatParams.conversationId = chatId.value.startsWith('local_') ? '' : chatId.value
  chatParams.params.message = msg.trim()
  chatParams.params.prompt = modelConfig.systemPrompt
  chatParams.params.messageCount = modelConfig.maxMessageCount
  chatParams.params.temperature = modelConfig.temperature
  chatParams.params.topP = modelConfig.topP
  chatParams.params.maxTokens = modelConfig.maxOutputTokens
  chatParams.params.enableThinking = isDeepSeek.value
  chatParams.params.enableSearch = isLinkNet.value

  if (chatParams.params.message === '') {
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
      thinkFinish: true,
    }))
  }
  isFinish.value = false
  interfaceFinish.value = false
  isWaitingForResponse.value = true

  // 创建新的 AbortController 用于中断当前请求
  controller = new AbortController()
  const { signal } = controller

  // 智能超时判断机制
  let lastContentUpdate = Date.now() // 记录最后内容更新时间
  let lastContentLength = 0 // 记录最后内容长度
  let timeoutCheckInterval = null

  // 智能超时检查函数
  const checkConnectionTimeout = () => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastContentUpdate

    // 如果30秒内没有内容更新，判断为连接超时
    if (timeSinceLastUpdate > 30000) {
      console.warn('SSE Connection timeout: no content update for', timeSinceLastUpdate, 'ms')
      ElMessage.warning('连接超时，请刷新页面重试')
      if (controller) {
        controller.abort()
        controller = null
      }
      return true
    }

    return false
  }

  // 启动智能超时检查，每10秒检查一次
  timeoutCheckInterval = setInterval(() => {
    if (checkConnectionTimeout()) {
      clearInterval(timeoutCheckInterval)
      timeoutCheckInterval = null
    }
  }, 10000)

  fetchEventSource(`${baseURL}v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'satoken': userStore.token,
    },
    body: JSON.stringify(chatParams),
    openWhenHidden: true, // 在调用失败时禁止重复调用
    signal,
    onmessage(event) {
      // 更新内容变化时间戳
      lastContentUpdate = Date.now()

      if (event.event === 'error') {
        const msg = JSON.parse(event.data).msg || '连接出现错误，请重试'
        ElMessage.error(msg)
        if (JSON.parse(event.data).code === 401) {
          userStore.requestLogout()
          userStore.showLoginModal = true
        }
      }
      if (event.data) {
        const parseData = JSON.parse(event.data)
        if (parseData.content) {
          // AI开始回答，取消等待状态
          isWaitingForResponse.value = false

          // 检查内容长度变化，判断是否有实际内容更新
          const currentContentLength = (thinkContent.value + content.value).length
          if (currentContentLength > lastContentLength) {
            lastContentLength = currentContentLength
            lastContentUpdate = Date.now() // 重置超时计时器
          }

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
        if (parseData.conversationId) {
          chatParams.conversationId = parseData.conversationId
          conversationId.value = parseData.conversationId
        }
        // 处理流结束标记
        if (event.event === 'end') {
          interfaceFinish.value = true
          isWaitingForResponse.value = false
          // 不立即设置isFinish，让打字效果完成后自然触发
        }
      }
    },
    onclose() {
      interfaceFinish.value = true
      isWaitingForResponse.value = false

      // 清除超时检查定时器
      if (timeoutCheckInterval) {
        clearInterval(timeoutCheckInterval)
        timeoutCheckInterval = null
      }

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
      isWaitingForResponse.value = false

      // 清除超时检查定时器
      if (timeoutCheckInterval) {
        clearInterval(timeoutCheckInterval)
        timeoutCheckInterval = null
      }

      // 中断 SSE 连接
      if (controller) {
        controller.abort()
        controller = null
        throw error // 必须return，否则库会继续重试
      }
      // 如果是用户主动中断连接，不显示错误信息
      if (error.name === 'AbortError') {
        console.warn('SSE Connection aborted by user')
        throw error // 必须return，否则库会继续重试
      } else {
        controller.abort()
        controller = null
        console.error('SSE Connection error:', error)
        ElMessage.error('连接出现错误，请重试')
        throw error // 必须return，否则库会继续重试
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
  isWaitingForResponse.value = false

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

// 处理编辑消息时的回车键
function handleEnterKey(event, message) {
  event.preventDefault()
  if (message.editContent.trim() !== '' && message.editContent.trim() !== message.content.trim()) {
    handleReSend(message)
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
  messages[lastIndex] = { ...messages[lastIndex], content: '', thinkContent: '', thinkFinish: true, isHistory: false }
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

function handleDeepSeek() {
  isDeepSeek.value = !isDeepSeek.value
  localStorage.setItem('isDeepSeek', isDeepSeek.value)
}

function handleLinkNet() {
  isLinkNet.value = !isLinkNet.value
  localStorage.setItem('isLinkNet', isLinkNet.value)
}
</script>

<template>
  <div class="chat-content">
    <div class="qa-page">
      <!-- 问题列表 -->
      <div ref="chatContainer" class="question-list" @scroll="handleScroll" @wheel="handleWheel"
           @touchstart="handleTouchStart" @touchend="handleTouchEnd">
        <!-- 历史消息加载动画 -->
        <div v-if="isLoadingHistory" class="history-loading">
          <div class="loading-content">
            <el-icon class="is-loading">
              <Loading/>
            </el-icon>
            <span>加载中...</span>
          </div>
        </div>
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
          <div :class="{ 'ai-message': message.sender === 'ai', 'full-width': message.isEdit }">
            <div v-if="message.sender === 'user'">
              <!-- 用户昵称显示 -->
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
                          type="textarea" resize="none" :rows="3" class="input-box" @keydown.enter="handleEnterKey($event, message)"/>
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
            <div v-else>
              <!-- ai名称 -->
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
                <!-- 等待AI回答动画 -->
                <div v-if="index === messages.length - 1 && isWaitingForResponse && !message.content" class="waiting-animation">
                  <div class="waiting-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <!-- <div class="waiting-text">AI正在思考中...</div> -->
                </div>
                <MarkdownEventStream
                  v-if="!message.isHistory" ref="answerRef" type="answer"
                  :initial-content="message.content" :is-typing="true"
                  :interface-finish="interfaceFinish" @update-height="handleContentUpdate"
                  @notice-stop="noticeFinish"
                />
                <MarkdownEventStream
                  v-if="message.isHistory" ref="answerRef" type="answer"
                  :initial-content="message.content" :is-typing="false"
                />
                <div
                  v-show="(isFinish && message.content) || index < messages.length - 1"
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
          </div>
          <div v-show="message.sender === 'user'" class="sender-user">
            <div>
              <img v-if="userStore.userInfo.avatar" :src="userStore.userInfo.avatar" alt="User" class="icon">
              <img v-else src="@/assets/images/avatar.png" alt="User" class="icon">
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
        <!-- <el-button
          v-if="isFinish"
          v-auth
          type="primary"
          class="send-btn"
          @click="sendQuestion(question)"
        >
          发送
        </el-button> -->
        <div class="send-btn-box">
          <div class="left-box">
            <div v-if="showDeepBtn" class="model-btn" :class="{ active: isDeepSeek }" @click="handleDeepSeek">
              <div class="btn-icon deep-thinking-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M7.06431 5.93348C7.68763 5.93348 8.19307 6.4391 8.19322 7.06239C8.19322 7.68579 7.68772 8.19129 7.06431 8.19129C6.44099 8.19119 5.9354 7.68573 5.9354 7.06239C5.93555 6.43917 6.44108 5.93359 7.06431 5.93348Z"
                    fill="currentColor"></path>
                  <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M8.6815 0.963754C10.1169 0.44708 11.6266 0.37489 12.5633 1.31141C13.5 2.24812 13.4277 3.75782 12.911 5.19325C12.7126 5.74437 12.4386 6.31802 12.0965 6.89735C12.4969 7.54645 12.8141 8.19024 13.036 8.80653C13.5527 10.242 13.6251 11.7516 12.6883 12.6884C11.7516 13.6251 10.242 13.5527 8.8065 13.036C8.19022 12.8141 7.54641 12.4969 6.89732 12.0966C6.31797 12.4386 5.74435 12.7126 5.19322 12.911C3.75777 13.4277 2.2481 13.5001 1.31138 12.5634C0.374859 11.6266 0.447049 10.1169 0.963724 8.68153C1.17185 8.10345 1.46321 7.50069 1.82896 6.89247C1.52182 6.35717 1.27235 5.82832 1.08872 5.31825C0.572068 3.88284 0.499714 2.37312 1.43638 1.43641C2.37308 0.499716 3.8828 0.572105 5.31822 1.08875C5.82828 1.27238 6.35715 1.52186 6.89243 1.82899C7.50066 1.46324 8.10341 1.17187 8.6815 0.963754ZM11.3573 8.01161C10.9083 8.62259 10.3901 9.22879 9.80943 9.80946C9.22877 10.3901 8.62255 10.9084 8.01158 11.3573C8.4257 11.5841 8.8287 11.7688 9.21275 11.9071C10.5456 12.3869 11.4246 12.2548 11.8397 11.8397C12.2548 11.4247 12.3869 10.5456 11.9071 9.21278C11.7688 8.82872 11.5841 8.42574 11.3573 8.01161ZM2.56529 8.02918C2.37344 8.39328 2.21495 8.74802 2.09263 9.08778C1.61291 10.4204 1.74512 11.2996 2.16001 11.7147C2.57505 12.1298 3.45415 12.2619 4.78697 11.7821C5.11057 11.6656 5.44786 11.5164 5.7938 11.3368C5.249 10.9223 4.70922 10.4534 4.19029 9.93446C3.57578 9.31993 3.03169 8.67639 2.56529 8.02918ZM6.90708 3.24696C6.24065 3.70485 5.5646 4.26327 4.91392 4.91395C4.26325 5.56462 3.70482 6.24069 3.24693 6.90711C3.72674 7.63331 4.32777 8.37465 5.03892 9.08582C5.64943 9.69633 6.28183 10.2265 6.90806 10.6679C7.59368 10.2026 8.2908 9.63082 8.96079 8.96082C9.6308 8.29082 10.2025 7.59372 10.6678 6.90809C10.2265 6.28186 9.69631 5.64946 9.08579 5.03895C8.37462 4.32779 7.63328 3.72678 6.90708 3.24696ZM11.7147 2.16004C11.2996 1.74515 10.4204 1.61294 9.08775 2.09266C8.74835 2.21485 8.39382 2.37277 8.03013 2.56434C8.67728 3.03071 9.31995 3.57586 9.93443 4.19032C10.4534 4.70926 10.9223 5.24902 11.3368 5.79383C11.5164 5.44791 11.6656 5.11058 11.7821 4.787C12.2618 3.45422 12.1297 2.57508 11.7147 2.16004ZM4.91197 2.21766C3.57922 1.73794 2.70004 1.87001 2.28501 2.28504C1.87001 2.70009 1.73791 3.57926 2.21763 4.912C2.31709 5.18828 2.44112 5.47433 2.58677 5.76747C3.01931 5.18876 3.51474 4.61586 4.06529 4.06532C4.61584 3.51477 5.18872 3.01934 5.76743 2.5868C5.47431 2.44116 5.18824 2.31712 4.91197 2.21766Z"
                        fill="currentColor"></path>
                </svg>
              </div>
              <span class="btn-text">深度思考</span>
            </div>
            <div v-if="showNetBtn" class="model-btn" :class="{ active: isLinkNet }" @click="handleLinkNet">
              <div class="btn-icon network-search-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M7.00003 0.150452C10.7832 0.150452 13.8496 3.21691 13.8496 7.00006C13.8496 10.7832 10.7832 13.8497 7.00003 13.8497C3.21688 13.8497 0.150421 10.7832 0.150421 7.00006C0.150421 3.21691 3.21688 0.150452 7.00003 0.150452ZM5.37796 7.59967C5.4267 9.0321 5.64754 10.2966 5.97366 11.2198C6.15996 11.7471 6.36946 12.1302 6.57327 12.3702C6.77751 12.6106 6.92343 12.6505 7.00003 12.6505C7.07663 12.6505 7.22255 12.6106 7.42679 12.3702C7.6306 12.1302 7.8401 11.7471 8.0264 11.2198C8.35252 10.2966 8.57336 9.0321 8.6221 7.59967H5.37796ZM1.38187 7.59967C1.61456 9.80498 3.11593 11.6305 5.14261 12.336C5.03268 12.1129 4.93227 11.8725 4.8428 11.6192C4.46342 10.5452 4.22775 9.13994 4.17874 7.59967H1.38187ZM9.82132 7.59967C9.77232 9.13994 9.53664 10.5452 9.15726 11.6192C9.06774 11.8726 8.96648 12.1127 8.85648 12.336C10.8836 11.6307 12.3855 9.8053 12.6182 7.59967H9.82132ZM7.00003 1.34967C6.92343 1.34967 6.77751 1.38955 6.57327 1.62994C6.36946 1.86994 6.15996 2.25297 5.97366 2.78033C5.64754 3.70357 5.4267 4.96802 5.37796 6.40045H8.6221C8.57336 4.96802 8.35252 3.70357 8.0264 2.78033C7.8401 2.25297 7.6306 1.86994 7.42679 1.62994C7.22255 1.38955 7.07663 1.34967 7.00003 1.34967ZM8.85648 1.66315C8.96663 1.88662 9.06763 2.12721 9.15726 2.38092C9.53664 3.45494 9.77232 4.86018 9.82132 6.40045H12.6182C12.3855 4.19471 10.8837 2.36834 8.85648 1.66315ZM5.14261 1.66315C3.11578 2.36856 1.61457 4.19503 1.38187 6.40045H4.17874C4.22775 4.86018 4.46342 3.45494 4.8428 2.38092C4.93237 2.12736 5.03253 1.88651 5.14261 1.66315Z"
                        fill="currentColor"></path>
                </svg>
              </div>
              <span class="btn-text">联网搜索</span>
            </div>
            <div class="model-btn" @click="showModelConfig = true">
              <div class="btn-icon config-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- 第一条线 -->
                  <line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" stroke-width="1.5"
                        stroke-linecap="round"/>
                  <circle cx="7" cy="3" r="1.5" fill="currentColor"/>
                  <!-- 第二条线 -->
                  <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" stroke-width="1.5"
                        stroke-linecap="round"/>
                  <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
                  <!-- 第三条线 -->
                  <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" stroke-width="1.5"
                        stroke-linecap="round"/>
                  <circle cx="7" cy="11" r="1.5" fill="currentColor"/>
                </svg>
              </div>
              <span class="btn-text">模型配置</span>
            </div>
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
    <el-dialog
      v-model="showModelConfig"
      title=""
      width="520px"
      :close-on-click-modal="false"
      class="model-config-dialog"
      :show-close="false"
      :style="{
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
      }"
    >
      <template #header>
        <div class="dialog-header" :style="{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative'
        }">
          <div class="header-content" :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative',
            zIndex: 1
          }">
            <div class="header-icon" :style="{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L3 7L10 12L17 7L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                <path d="M3 12L10 17L17 12" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="header-text">
              <h2 class="dialog-title" :style="{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: 'white',
                lineHeight: 1.2
              }">模型配置</h2>
            </div>
          </div>
          <button class="close-btn" @click="showModelConfig = false" :style="{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            zIndex: 1
          }">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </template>

      <div class="config-content" :style="{
        padding: '16px',
        background: 'white'
      }">
        <!-- 系统提示词 -->
        <div class="config-section" :style="{
          marginBottom: '16px'
        }">
          <div class="section-header" :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '8px',
            paddingBottom: '6px',
            borderBottom: '1px solid #f1f5f9'
          }">
            <h3 class="section-title" :style="{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: '#1e293b',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }">
              系统提示词
              <el-tooltip
                content="系统提示词用于指导AI的行为和回答风格，例如：'你是一个专业的编程助手'或'请用简洁的语言回答'"
                placement="top">
                <el-icon class="info-icon" :style="{
                  color: '#64748b',
                  cursor: 'help',
                  transition: 'color 0.3s ease',
                  fontSize: '14px'
                }">
                  <InfoFilled/>
                </el-icon>
              </el-tooltip>
            </h3>
          </div>
          <div class="section-content">
            <el-input
              v-model="modelConfig.systemPrompt"
              type="textarea"
              :rows="3"
              placeholder="输入系统提示词..."
              class="system-prompt-input"
              maxlength="1000"
              show-word-limit
              :style="{
                '--el-input-border-color': '#e2e8f0',
                '--el-input-border-radius': '6px',
                '--el-input-bg-color': '#fafbfc',
                '--el-input-focus-border-color': '#6366f1',
                '--el-input-focus-bg-color': '#ffffff'
              }"
            />
          </div>
        </div>

        <!-- 模型参数设置 -->
        <div class="config-section" :style="{
          marginBottom: '16px'
        }">
          <div class="section-content">
            <div class="config-list" :style="{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }">
              <!-- 最大消息数量 -->
              <div class="config-item">
                <div class="config-label" :style="{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px'
                }">
                  <span class="label-text" :style="{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }">
                    最大消息数量
                    <el-tooltip content="控制对话历史中保留的最大消息数量，影响AI对上下文的理解" placement="top">
                      <el-icon class="info-icon" :style="{
                        color: '#9ca3af',
                        cursor: 'help',
                        transition: 'color 0.3s ease',
                        fontSize: '12px'
                      }">
                        <InfoFilled/>
                      </el-icon>
                    </el-tooltip>
                  </span>
                </div>
                <div class="config-control" :style="{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'nowrap'
                }">
                  <el-slider
                    v-model="modelConfig.maxMessageCount"
                    :min="0"
                    :max="100"
                    :step="1"
                    class="config-slider"
                    :show-tooltip="false"
                    :style="{ flex: 1 }"
                  />
                  <el-input-number
                    v-model="modelConfig.maxMessageCount"
                    :min="0"
                    :max="100"
                    :step="1"
                    controls-position="right"
                    :style="{ width: '120px', flexShrink: 0 }"
                  />
                </div>
              </div>

              <!-- 温度 -->
              <div class="config-item">
                <div class="config-label">
                  <span class="label-text">
                    Temperature
                    <el-tooltip content="控制回答的随机性，值越高越随机和创造性，值越低越确定和保守" placement="top">
                      <el-icon class="info-icon">
                        <InfoFilled/>
                      </el-icon>
                    </el-tooltip>
                  </span>
                </div>
                <div class="config-control" :style="{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'nowrap'
                }">
                  <el-slider
                    v-model="modelConfig.temperature"
                    :min="0"
                    :max="2"
                    :step="0.01"
                    class="config-slider"
                    :show-tooltip="false"
                    :style="{ flex: 1 }"
                  />
                  <el-input-number
                    v-model="modelConfig.temperature"
                    :min="0"
                    :max="2"
                    :step="0.01"
                    controls-position="right"
                    :style="{ width: '120px', flexShrink: 0 }"
                  />
                </div>
              </div>

              <!-- Top P -->
              <div class="config-item">
                <div class="config-label">
                  <span class="label-text">
                    Top P
                    <el-tooltip content="控制词汇选择的多样性，值越高词汇选择越多样，值越低越集中在最可能的词汇"
                                placement="top">
                      <el-icon class="info-icon">
                        <InfoFilled/>
                      </el-icon>
                    </el-tooltip>
                  </span>
                </div>
                <div class="config-control" :style="{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'nowrap'
                }">
                  <el-slider
                    v-model="modelConfig.topP"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    class="config-slider"
                    :show-tooltip="false"
                    :style="{ flex: 1 }"
                  />
                  <el-input-number
                    v-model="modelConfig.topP"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    controls-position="right"
                    :style="{ width: '120px', flexShrink: 0 }"
                  />
                </div>
              </div>

              <!-- 最大输出Token -->
              <div class="config-item">
                <div class="config-label">
                  <span class="label-text">
                    最大输出Token
                    <el-tooltip content="限制AI回答的最大长度，Token数量越多回答越详细，但消耗更多资源" placement="top">
                      <el-icon class="info-icon">
                        <InfoFilled/>
                      </el-icon>
                    </el-tooltip>
                  </span>
                </div>
                <div class="config-control" :style="{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'nowrap'
                }">
                  <el-slider
                    v-model="modelConfig.maxOutputTokens"
                    :min="0"
                    :max="1000000"
                    :step="100"
                    class="config-slider"
                    :show-tooltip="false"
                    :style="{ flex: 1 }"
                  />
                  <el-input-number
                    v-model="modelConfig.maxOutputTokens"
                    :min="0"
                    :max="1000000"
                    :step="100"
                    controls-position="right"
                    :style="{ width: '120px', flexShrink: 0 }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.chat-content {
  width: 100%;
  height: 100%;
  // background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.qa-page {
  display: flex;
  flex-direction: column;
  width: 85%;
  max-width: 900px;
  height: 100%;
  margin: auto;
  background: #fff;
  border-radius: 16px;
  //box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.question-list {
  height: 100%;
  padding: 24px 20px;
  overflow-y: auto;
  //background: #fafbfc;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(102, 126, 234, 0.5);
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
  // background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e1e7ef;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  position: relative;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  // 悬停效果
  &:hover {
    border-color: #8b5cf6;
    box-shadow: 0 6px 25px rgba(72, 187, 120, 0.15);
    transform: translateY(-1px);
  }
}

/* 等待AI回答动画 */
.waiting-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 60px;
}

.waiting-dots {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.waiting-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: waiting-bounce 1.4s ease-in-out infinite both;
}

.waiting-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.waiting-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.waiting-dots span:nth-child(3) {
  animation-delay: 0s;
}

@keyframes waiting-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.waiting-text {
  color: #667eea;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  animation: waiting-pulse 2s ease-in-out infinite;
}

@keyframes waiting-pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* 历史消息加载动画 */
.history-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  margin: 20px;
  position: relative;
  overflow: hidden;
}

.history-loading .loading-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #899beb;
  font-weight: 600;
}

.history-loading .el-icon {
  font-size: 18px;
  color: #667eea;
}

.think-content {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
  border: 2px solid #e1e8ff;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 24px;
  font-size: 14px;
  line-height: 1.6;
  position: relative;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.08);
  transition: all 0.3s ease;

  // 思考状态指示器
  &::before {
    content: '';
    position: absolute;
    top: 16px;
    left: 16px;
    width: 8px;
    height: 8px;
    background: #667eea;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

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
  background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
  border-color: #8b5cf6;

  &::before {
    background: #8b5cf6;
    animation: none;
  }

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
  margin-bottom: 20px;
  font-size: 15px;
  line-height: 1.6;

  .sender-ai {
    flex-shrink: 0;
    width: 42px;
    height: 42px;
    margin-right: 12px;
    background: #f8f9fa;
    border: 2px solid #e9ecef;
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
  padding: 12px 20px;
  margin-left: 54px;
  background: #fff;
  color: #2c3e50;
  border: 1px solid #e9ecef;
  border-radius: 16px 4px 16px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
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
  // padding: 12px 20px;
  margin-right: 54px;
  background: #fff;
  overflow: hidden;
  font-size: 15px;
  line-height: 1.6;
  color: #2c3e50;
  max-width: 80%;
  word-wrap: break-word;
}

.full-width {
  width: 100%;
}

.input-container {
  box-sizing: border-box;
  width: 100%;
  max-width: 900px;
  padding: 16px;
  margin: auto;
  border: 1px solid rgba(86, 86, 95, .322);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 14px;
  min-width: 80px;

  &:hover {
    background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
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
  flex-shrink: 0;

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

  // 模型配置弹框样式
  :deep(.model-config-dialog) {
    .el-dialog {
      border-radius: 16px !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
      overflow: hidden !important;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
    }

    .el-dialog__header {
      padding: 0 !important;
      border-bottom: none !important;
    }

    .el-dialog__body {
      padding: 0 !important;
    }

    .el-dialog__footer {
      padding: 0 !important;
      border-top: none !important;
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    position: relative;

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
      z-index: 1;

      .header-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);

        svg {
          color: white;
        }
      }

      .header-text {
        .dialog-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: white;
          line-height: 1.2;
        }
      }
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      z-index: 1;

      svg {
        color: white;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }

  .config-content {
    padding: 16px;
    background: white;
  }

  .config-section {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #f1f5f9;

      .section-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        flex: 1;
        display: flex;
        align-items: center;
        gap: 6px;

        .info-icon {
          color: #64748b;
          cursor: help;
          transition: color 0.3s ease;
          font-size: 14px;

          &:hover {
            color: #6366f1;
          }
        }
      }
    }

    .section-content {
      .system-prompt-input {
        :deep(.el-textarea__inner) {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px;
          font-size: 13px;
          line-height: 1.4;
          background: #fafbfc;
          transition: all 0.3s ease;
          resize: vertical;
          min-height: 60px;

          &:focus {
            border-color: #6366f1;
            background: white;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
          }

          &::placeholder {
            color: #94a3b8;
          }
        }

        :deep(.el-input__count) {
          color: #64748b;
          font-size: 12px;
          background: rgba(255, 255, 255, 0.8);
          padding: 2px 6px;
          border-radius: 4px;
          backdrop-filter: blur(10px);
        }
      }
    }
  }

  .config-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .config-item {
      .config-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;

        .label-text {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 4px;

          .info-icon {
            color: #9ca3af;
            cursor: help;
            transition: color 0.3s ease;
            font-size: 12px;

            &:hover {
              color: #6366f1;
            }
          }
        }
      }

      .config-control {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: nowrap;

        .config-slider {
          flex: 1;

          :deep(.el-slider__runway) {
            background: #e5e7eb;
            height: 4px;
            border-radius: 2px;
          }

          :deep(.el-slider__bar) {
            background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 2px;
          }

          :deep(.el-slider__button) {
            width: 16px;
            height: 16px;
            background: white;
            border: 2px solid #6366f1;
            box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
            transition: all 0.3s ease;

            &:hover {
              transform: scale(1.1);
              box-shadow: 0 3px 8px rgba(99, 102, 241, 0.4);
            }
          }

          :deep(.el-slider__stop) {
            background: #d1d5db;
            width: 4px;
            height: 4px;
            border-radius: 50%;
          }
        }

        .el-input-number {
          width: 120px;
          flex-shrink: 0;

          :deep(.el-input__wrapper) {
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            box-shadow: none;
            padding: 0 4px 0 8px;
            height: 32px;

            &:hover {
              border-color: #6366f1;
            }

            &.is-focus {
              border-color: #6366f1;
              box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
            }
          }

          :deep(.el-input__inner) {
            font-size: 13px;
            text-align: center;
            padding: 0;
            height: 30px;
            line-height: 30px;
          }

          :deep(.el-input-number__increase),
          :deep(.el-input-number__decrease) {
            width: 24px;
            height: 15px;
            border-radius: 3px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            line-height: 1;

            &:hover {
              background: #6366f1;
              border-color: #6366f1;
              color: white;
            }

            &:active {
              transform: scale(0.95);
            }
          }

          :deep(.el-input-number__increase) {
            border-bottom: none;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
          }

          :deep(.el-input-number__decrease) {
            border-top: none;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
          }
        }
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    :deep(.model-config-dialog) {
      .el-dialog {
        width: 95% !important;
        margin: 0 auto;
      }
    }

    .dialog-header {
      padding: 12px 16px;

      .header-content {
        gap: 8px;

        .header-icon {
          width: 28px;
          height: 28px;
        }

        .header-text {
          .dialog-title {
            font-size: 16px;
          }
        }
      }

      .close-btn {
        width: 28px;
        height: 28px;
      }
    }

    .config-content {
      padding: 16px;
    }

    .config-section {
      margin-bottom: 16px;

      .section-header {
        margin-bottom: 10px;
        padding-bottom: 6px;

        .section-title {
          font-size: 15px;
        }
      }
    }

    .config-list {
      gap: 12px;
    }
  }

  @media (max-width: 480px) {
    .dialog-header {
      padding: 10px 12px;

      .header-content {
        .header-text {
          .dialog-title {
            font-size: 15px;
          }
        }
      }
    }

    .config-content {
      padding: 12px;
    }

    .config-section {
      margin-bottom: 12px;

      .section-header {
        margin-bottom: 8px;
        padding-bottom: 4px;

        .section-title {
          font-size: 14px;
        }
      }
    }

    .config-list {
      gap: 10px;

      .config-item {
        .config-label {
          margin-bottom: 6px;

          .label-text {
            font-size: 13px;
          }
        }
      }
    }
  }
}
</style>

<style lang="scss">
// 全局样式，用于覆盖Element Plus弹框样式
.el-overlay-dialog .model-config-dialog {
  border-radius: 16px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  overflow: hidden !important;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
}

.el-overlay-dialog .model-config-dialog .el-dialog__header {
  padding: 0 !important;
  border-bottom: none !important;
}

.el-overlay-dialog .model-config-dialog .el-dialog__body {
  padding: 0 !important;
}

.el-overlay-dialog .model-config-dialog .el-dialog__footer {
  padding: 0 !important;
  border-top: none !important;
}

// 更具体的选择器来确保样式生效
body .el-overlay .el-overlay-dialog .model-config-dialog {
  border-radius: 16px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  overflow: hidden !important;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
}

body .el-overlay .el-overlay-dialog .model-config-dialog .el-dialog__header {
  padding: 0 !important;
  border-bottom: none !important;
}

body .el-overlay .el-overlay-dialog .model-config-dialog .el-dialog__body {
  padding: 0 !important;
}

body .el-overlay .el-overlay-dialog .model-config-dialog .el-dialog__footer {
  padding: 0 !important;
  border-top: none !important;
}

// 响应式设计
@media (max-width: 768px) {
  .el-overlay-dialog .model-config-dialog {
    width: 95% !important;
    margin: 0 auto;
  }

  body .el-overlay .el-overlay-dialog .model-config-dialog {
    width: 95% !important;
    margin: 0 auto;
  }
}

// 确保滑块和输入框在同一行显示
.model-config-dialog .config-control {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  flex-wrap: nowrap !important;
}

.model-config-dialog .config-slider {
  flex: 1 !important;
}

.model-config-dialog .el-input-number {
  width: 120px !important;
  flex-shrink: 0 !important;
}
</style>
