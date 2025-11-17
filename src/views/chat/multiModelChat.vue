<script setup lang="ts">
import {ref, onMounted, nextTick, watch, reactive} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {Promotion, Plus, Delete, Search, Loading, Warning, InfoFilled} from '@element-plus/icons-vue'
import {modelPageApi} from '@/api/ai/model'
import type {ModelVo} from '@/api/ai/model/types'
import ChatMenu from './chatMenu.vue'
import {chatApi} from "@/api/ai/aigc";
import type {AigcModelChatMsg, ChatModelBo} from "@/api/ai/aigc/types.ts";
import {useUserStore} from '@/store/modules/user'
import type {ProviderVo} from "@/api/ai/provider/types.ts";
import {providerPageApi} from "@/api/ai/provider";
import MarkdownEventStream from './chatPlusItem/eventStream.vue'

const userStore = useUserStore()
const inputMessage = ref('')
const isLoading = ref(false)
const showModelSelector = ref(false)
const showModelConfig = ref(false)
const messagesContainer = ref<HTMLElement>()
const messageList = ref<AigcModelChatMsg[]>([])
const modelSearchKeyword = ref('')
const selectedProvider = ref('')
const activeTabs = reactive<Record<string, string>>({})
const requestStatus = reactive<Record<string, 'pending' | 'success' | 'error' | 'timeout'>>({})
const requestProgress = ref<Record<string, number>>({})
const enableThinking = ref(false)
const enableSearch = ref(false)
const userMessages = ref<Array<{ id: string, content: string, timestamp: string }>>([])

// 模型配置数据
const modelConfig = reactive({
  systemPrompt: '',
  maxMessageCount: 0,
  temperature: null,
  topP: null,
  maxOutputTokens: 0,
})

// 监听搜索关键词变化，实时查询
watch(modelSearchKeyword, () => {
  loadModels()
})

// 监听供应商选择变化，实时查询
watch(selectedProvider, () => {
  loadModels()
})

function isModelSelected(model: ModelVo): boolean {
  return selectedModels.value.some(selected =>
      selected.provider === model.provider && selected.name === model.name
  )
}

function toggleModelSelection(model: ModelVo) {
  const existingIndex = selectedModels.value.findIndex(selected =>
      selected.provider === model.provider && selected.name === model.name
  )
  if (existingIndex > -1) {
    selectedModels.value.splice(existingIndex, 1)
  } else {
    selectedModels.value.push(model)
  }
}

function confirmModelSelection() {
  if (selectedModels.value.length === 0) {
    ElMessage.warning('请至少选择一个模型')
    return
  }
  showModelSelector.value = false
  ElMessage.success(`已选择 ${selectedModels.value.length} 个模型`)
}

function removeModel(index: number) {
  const model = selectedModels.value[index]
  selectedModels.value.splice(index, 1)
  ElMessage.success(`已移除模型：${model.name}`)
}

function toggleThinking() {
  enableThinking.value = !enableThinking.value
}

function toggleSearch() {
  enableSearch.value = !enableSearch.value
}

function saveModelConfig() {
  showModelConfig.value = false
  ElMessage.success('配置已保存')
}

function resetModelConfig() {
  modelConfig.systemPrompt = ''
  modelConfig.maxMessageCount = 0
  modelConfig.temperature = null
  modelConfig.topP = null
  modelConfig.maxOutputTokens = 0
}

function getResponsesForMessage(messageId: string) {
  return messageList.value.filter(response => response.messageId === messageId)
}

function getActiveTabForMessage(messageId: string): string {
  return activeTabs[messageId] || ''
}

function setActiveTabForMessage(messageId: string, modelId: string) {
  activeTabs[messageId] = modelId
}

async function sendMessage() {
  if (!inputMessage.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }

  if (selectedModels.value.length === 0) {
    ElMessage.warning('请先选择至少一个模型')
    return
  }

  const message = inputMessage.value.trim()
  const messageId = Date.now().toString()

  // 添加用户消息
  userMessages.value.push({
    id: messageId,
    content: message,
    timestamp: new Date().toISOString()
  })

  inputMessage.value = ''

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 发送多模型请求
  await sendMultiModelRequest(message, messageId)
}

async function sendMultiModelRequest(message: string, messageId: string) {
  isLoading.value = true

  try {
    // 并发请求到多个模型
    const promises = selectedModels.value.map(async (model) => {
      const modelId = `${model.provider}-${model.name}-${messageId}`
      requestStatus[modelId] = 'pending'
      try {
        let data: ChatModelBo = {
          provider: model.provider,
          model: model.name,
          function: 'chat',
          params: {
            message: message,
            stream: false,
            enableThinking: enableThinking.value,
            enableSearch: enableSearch.value,
            prompt: modelConfig.systemPrompt,
            temperature: modelConfig.temperature,
            topP: modelConfig.topP,
            maxTokens: modelConfig.maxOutputTokens,
            messageCount: modelConfig.maxMessageCount
          }
        }
        const response = await chatApi(data)

        // 检查响应是否成功
        if (response.code === 0 && response.data) {
          requestStatus[modelId] = 'success'

          const responseData = response.data

          const modelResponse: AigcModelChatMsg = {
            provider: model.provider,
            model: model.name,
            content: responseData.content || '无内容',
            durationSeconds: responseData.durationSeconds || 0,
            inputTokens: responseData.inputTokens || 0,
            outputTokens: responseData.outputTokens || 0,
            reasoningTokens: responseData.reasoningTokens || 0,
            messageId: messageId,
            modelId: modelId,
            providerIcon: model.providerIcon
          }
          return modelResponse
        } else {
          console.log('API调用失败，code:', response.code, 'msg:', response.msg)
          requestStatus[modelId] = 'error'
          return {
            provider: model.provider,
            model: model.name,
            content: '',
            errorMessage: response.msg || '请求失败',
            durationSeconds: 0,
            inputTokens: 0,
            outputTokens: 0,
            reasoningTokens: 0,
            messageId: messageId,
            modelId: modelId,
            providerIcon: model.providerIcon
          }
        }
      } catch (error) {
        requestStatus[modelId] = 'error'
        return {
          provider: model.provider,
          model: model.name,
          content: '',
          errorMessage: error instanceof Error ? error.message : '请求失败',
          durationSeconds: 0,
          inputTokens: 0,
          outputTokens: 0,
          reasoningTokens: 0,
          messageId: messageId,
          modelId: modelId,
          providerIcon: model.providerIcon
        }
      }
    })

    // 等待所有请求完成
    const responses = await Promise.allSettled(promises)
    // 将响应添加到消息列表（包括成功和失败）
    for (const result of responses) {
      if (result.status === 'fulfilled') {
        messageList.value.push(result.value)
      } else if (result.status === 'rejected') {
        // 处理失败的请求，创建一个错误响应对象
        const errorResponse: AigcModelChatMsg = {
          provider: 'unknown',
          model: 'unknown',
          content: '',
          errorMessage: result.reason?.message || '请求失败',
          durationSeconds: 0,
          inputTokens: 0,
          outputTokens: 0,
          reasoningTokens: 0,
          messageId: messageId,
          modelId: 'error-' + Date.now(),
          providerIcon: ''
        }
        messageList.value.push(errorResponse)
      }
    }

    // 强制触发响应式更新
    await nextTick()

    // 设置第一个tab为活跃状态
    if (responses.length > 0 && responses[0].status === 'fulfilled') {
      setActiveTabForMessage(messageId, responses[0].value?.modelId || '')
    }

    // 滚动到底部
    await nextTick()
    scrollToBottom()

  } catch (error) {
    console.error('发送多模型请求失败:', error)
    ElMessage.error('发送请求失败')
  } finally {
    isLoading.value = false
    // 清理进度状态，但保留请求状态用于显示
    Object.keys(requestProgress.value).forEach(key => delete requestProgress.value[key])
  }
}


function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString()
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

async function clearChat() {
  try {
    await ElMessageBox.confirm('确定要清空所有对话吗？', '确认清空', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    messageList.value = []
    userMessages.value = []
    // 清理状态
    Object.keys(requestStatus).forEach(key => delete requestStatus[key])
    Object.keys(requestProgress.value).forEach(key => delete requestProgress.value[key])
    Object.keys(activeTabs).forEach(key => delete activeTabs[key])

    ElMessage.success('对话已清空')
  } catch {
    // 用户取消
  }
}

// 生命周期
onMounted(() => {
  initData()
})

// 初始化数据
const initData = () => {
  loadProviderList()
  loadModels()
}

// 供应商选项
const providers = ref<ProviderVo[]>([])
const loadProviderList = async () => {
  providerPageApi({
    pageNum: 1,
    pageSize: 100,
    query: {
      status: '1',
    },
  }).then((res: any) => {
    if (res.data && res.data.rows && res.data.rows.length > 0) {
      providers.value = res.data.rows
    }
  }).catch((error) => {
    console.error('加载供应商数据失败:', error)
  })
}

const modelList = ref<ModelVo[]>([])
const selectedModels = ref<ModelVo[]>([])
const loadModels = async () => {
  try {
    const response = await modelPageApi({
      pageNum: 1,
      pageSize: 100,
      query: {
        tag: 'chat',
        provider: selectedProvider.value,
        name: modelSearchKeyword.value,
      }
    })
    modelList.value = response.data.rows || []
  } catch (error) {
    console.error('加载模型列表失败:', error)
  }
}

const multipleThinkRef = ref(null)

// 监听消息变化，自动滚动
watch(messageList, () => {
  nextTick(() => {
    scrollToBottom()
  })
})
</script>

<template>
  <div class="chat-page">
    <div class="menu">
      <ChatMenu/>
    </div>
    <el-container class="chat-main">
      <el-main element-loading-background="rgba(122, 122, 122, 0.3)" class="main-wrap">
        <div class="multi-model-chat">
          <!-- 头部工具栏 -->
          <div class="chat-header">
            <div class="header-content">
              <div class="header-left">
                <div class="model-selector-row">
                  <div class="model-selector">
                    <el-button
                        type="primary"
                        @click="showModelSelector = true"
                        :icon="Plus"
                        class="select-model-btn"
                        style="background: #007bff !important; border-color: #007bff !important; color: white !important; border-radius: 6px !important;"
                    >
                      选择模型
                    </el-button>
                  </div>

                  <!-- 已选择的模型列表 -->
                  <div v-if="selectedModels.length > 0" class="selected-models">
                    <div class="selected-models-container">
                      <div class="selected-models-title">
                        <span class="title-text">已选择 {{ selectedModels.length }} 个模型：</span>
                      </div>
                      <div class="selected-models-list">
                        <div
                            v-for="(model, index) in selectedModels"
                            :key="`${model.provider}-${model.name}`"
                            class="selected-model-item"
                        >
                          <span class="model-name">{{ model.name }}</span>
                          <el-button
                              type="danger"
                              size="small"
                              :icon="Delete"
                              circle
                              @click="removeModel(index)"
                              class="remove-model-btn"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="header-right">
                <el-button
                    @click="clearChat"
                    :icon="Delete"
                    class="clear-btn"
                    style="background: #f8f9fa !important; border-color: #dee2e6 !important; color: #6c757d !important; border-radius: 6px !important;"
                >
                  清空对话
                </el-button>
              </div>
            </div>
          </div>

          <!-- 消息列表 -->
          <div class="chat-messages" ref="messagesContainer">
            <!-- 空状态提示 -->
            <div v-if="userMessages.length === 0" class="empty-state">
              <div class="empty-icon">💬</div>
              <div class="empty-title">开始多模型对话</div>
              <div class="empty-description">选择多个AI模型，同时获得不同的回答进行对比</div>
            </div>

            <!-- 用户消息和对应的模型响应 -->
            <div v-for="userMsg in userMessages" :key="userMsg.id" class="conversation-group">
              <!-- 用户消息 -->
              <div class="user-message">
                <div class="message-header">
                  <div class="user-info">
                    <img
                      :src="userStore.avatar || '/src/assets/images/avatar.png'"
                      :alt="userStore.nickname || '用户'"
                      class="user-avatar"
                    />
                    <span class="user-name">{{ userStore.nickname || '用户' }}</span>
                  </div>
                  <div class="message-time">
                    {{ formatTime(userMsg.timestamp) }}
                  </div>
                </div>
                <div class="message-content">
                  {{ userMsg.content }}
                </div>
              </div>

              <!-- 多模型响应 -->
              <div class="multi-model-response">
                <div class="response-header">
                  <div class="response-title">多模型回答</div>
                  <div class="response-time">{{ formatTime(userMsg.timestamp) }}</div>
                </div>

                <!-- 加载状态 - 显示在标题之后 -->
                <div v-if="isLoading" class="loading-message">
                  <div class="loading-content">
                    <el-icon class="is-loading">
                      <Loading/>
                    </el-icon>
                    <span>正在请求多个模型，请稍候...</span>
                  </div>
                </div>

                <!-- Tab标签 -->
                <div class="model-tabs" :class="[isLoading ? '' : 'show-line']">
                  <div
                      v-for="response in getResponsesForMessage(userMsg.id)"
                      :key="response.modelId"
                      class="tab-item"
                      :class="{ active: getActiveTabForMessage(userMsg.id) === response.modelId }"
                      @click="setActiveTabForMessage(userMsg.id, response.modelId)"
                  >
                    <img
                        :src="response.providerIcon"
                        :alt="response.provider"
                        class="tab-icon"
                    />
                    <span class="tab-name">{{ response.model }}</span>
                    <el-tag
                        v-if="requestStatus[response.modelId] === 'success'"
                        type="success"
                        size="small"
                        class="tab-status"
                    >完成
                    </el-tag>
                    <el-tag
                        v-else-if="requestStatus[response.modelId] === 'error'"
                        type="danger"
                        size="small"
                        class="tab-status"
                    >错误
                    </el-tag>
                    <el-tag
                        v-else
                        type="info"
                        size="small"
                        class="tab-status"
                    >处理中
                    </el-tag>
                  </div>
                </div>

                <!-- Tab内容 -->
                <div class="tab-content">
                  <div
                      v-for="response in getResponsesForMessage(userMsg.id)"
                      :key="response.modelId"
                      v-show="getActiveTabForMessage(userMsg.id) === response.modelId"
                      class="tab-panel"
                  >
                    <div v-if="requestStatus[response.modelId] === 'success'" class="response-content">
                      <div class="content-text">
                        <MarkdownEventStream ref="multipleThinkRef" type="think" :initial-content="response.content" :is-typing="false" />
                      </div>
                      <div v-if="response.inputTokens || response.outputTokens || response.durationSeconds"
                           class="token-usage">
                        <div class="token-item">
                          <span class="token-label">输入Tokens:</span>
                          <span class="token-value">{{ response.inputTokens }}</span>
                        </div>
                        <div class="token-item">
                          <span class="token-label">输出Tokens:</span>
                          <span class="token-value">{{ response.outputTokens }}</span>
                        </div>
                        <div v-if="response.reasoningTokens" class="token-item">
                          <span class="token-label">推理Tokens:</span>
                          <span class="token-value">{{ response.reasoningTokens }}</span>
                        </div>
                        <div v-if="response.durationSeconds > 0" class="token-item">
                          <span class="token-label">耗时:</span>
                          <span class="token-value">{{ response.durationSeconds }}s</span>
                        </div>
                      </div>
                    </div>
                    <div v-else class="error-content">
                      <el-icon class="error-icon">
                        <Warning/>
                      </el-icon>
                      <span>{{ response.errorMessage || '请求失败' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- 输入区域 -->
          <div class="chat-input">
            <div class="input-container">
              <el-input
                v-model="inputMessage"
                type="textarea"
                :rows="4"
                placeholder="发消息"
                :disabled="isLoading || selectedModels.length === 0"
                @keydown.enter="sendMessage"
                resize="none"
                class="message-input"
              />
              <div class="tool-btn">
                <div class="left-box">
                  <div class="model-btn" :class="{ active: enableThinking }" @click="toggleThinking">
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
                  <div class="model-btn" :class="{ active: enableSearch }" @click="toggleSearch">
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
                <div class="right-box">
                  <div class="input-tips">
                    <span v-if="selectedModels.length === 0" class="tip-warning">
                      请先选择至少一个模型
                    </span>
                    <span v-else class="tip-info">
                      已选择 {{ selectedModels.length }} 个模型
                    </span>
                  </div>
                  <el-tooltip
                      class="box-item"
                      effect="light"
                      content="提交"
                      placement="top-start"
                  >
                    <el-button
                        v-auth
                        type="primary"
                        :icon="Promotion"
                        circle
                        :disabled="!inputMessage.trim() || selectedModels.length === 0"
                        class="submit-btn"
                        @click="sendMessage"
                        :loading="isLoading"
                    />
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>

          <!-- 模型选择弹窗 -->
          <el-dialog
              v-model="showModelSelector"
              title="选择AI模型"
              width="600px"
              :before-close="() => showModelSelector = false"
          >
            <div class="model-selector-content">
              <!-- 筛选器 -->
              <div class="selector-filters">
                <el-input
                    v-model="modelSearchKeyword"
                    placeholder="搜索模型名称或提供商"
                    :prefix-icon="Search"
                    class="search-input"
                />
                <el-select
                    v-model="selectedProvider"
                    placeholder="选择提供商"
                    clearable
                    class="provider-select"
                >
                  <el-option
                      v-for="provider in providers"
                      :key="provider.id"
                      :label="provider.name"
                      :value="provider.code"
                  />
                </el-select>
              </div>

              <!-- 模型列表 -->
              <div class="model-list">
                <div
                    v-for="model in modelList"
                    :key="`${model.provider}-${model.name}`"
                    class="model-item"
                    :class="{ selected: isModelSelected(model) }"
                    @click="toggleModelSelection(model)"
                >
                  <img
                      :src="model.providerIcon"
                      :alt="model.providerName"
                      class="model-icon"
                  />
                  <div class="model-info">
                    <div class="model-name-row">
                      <div class="model-name">{{ model.name }}</div>
                    </div>
                    <div v-if="model.remark" class="model-description">{{ model.remark }}</div>
                  </div>
                  <div class="model-status">
                    {{ isModelSelected(model) ? '已选择' : '未选择' }}
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="selector-actions">
                <div class="selected-info">
                  已选择 {{ selectedModels.length }} 个模型
                </div>
                <div class="action-buttons">
                  <el-button @click="showModelSelector = false">取消</el-button>
                  <el-button type="primary" @click="confirmModelSelection">确定</el-button>
                </div>
              </div>
            </div>
          </el-dialog>
        </div>
      </el-main>
    </el-container>

    <!-- 模型配置弹窗 -->
    <el-dialog
        v-model="showModelConfig"
        title="模型配置"
        width="600px"
        :close-on-click-modal="false"
        class="model-config-dialog"
    >
      <div class="config-content">
        <!-- 系统提示词 -->
        <div class="config-section">
          <h3 class="section-title">系统提示词</h3>
          <el-input
              v-model="modelConfig.systemPrompt"
              type="textarea"
              :rows="4"
              placeholder="输入系统提示词..."
              class="system-prompt-input"
          />
        </div>

        <!-- 模型特定设置 -->
        <div class="config-section">
          <!-- 最大消息数量 -->
          <div class="config-item">
            <div class="config-label">
              <span>最大消息数量</span>
              <el-icon class="info-icon">
                <InfoFilled/>
              </el-icon>
            </div>
            <div class="config-control">
              <el-slider
                  v-model="modelConfig.maxMessageCount"
                  :min="0"
                  :max="100"
                  :step="1"
                  show-input
                  class="config-slider"
              />
            </div>
          </div>

          <!-- 温度 -->
          <div class="config-item">
            <div class="config-label">
              <span>Temperature</span>
              <el-icon class="info-icon">
                <InfoFilled/>
              </el-icon>
            </div>
            <div class="config-control">
              <el-slider
                v-model="modelConfig.temperature"
                :min="0"
                :max="1.9999"
                :step="0.01"
                class="config-slider"
              />
              <el-input-number
                v-model="modelConfig.temperature"
                :min="0"
                :max="1.9999"
                :step="0.01"
                controls-position="right"
              />
            </div>
          </div>

          <!-- Top P -->
          <div class="config-item">
            <div class="config-label">
              <span>Top P</span>
              <el-icon class="info-icon">
                <InfoFilled/>
              </el-icon>
            </div>
            <div class="config-control">
              <el-slider
                v-model="modelConfig.topP"
                :min="0.0001"
                :max="1.0"
                :step="0.01"
                class="config-slider"
              />
              <el-input-number
                v-model="modelConfig.topP"
                :min="0.0001"
                :max="1"
                :step="0.01"
                controls-position="right"
              />
            </div>
          </div>

          <!-- 最大输出Token -->
          <div class="config-item">
            <div class="config-label">
              <span>Max Output Tokens</span>
              <el-icon class="info-icon">
                <InfoFilled/>
              </el-icon>
            </div>
            <div class="config-control slider-with-clear-control">
              <el-slider
                v-model="modelConfig.maxOutputTokens"
                :min="0"
                :max="1000000"
                :step="100"
                class="config-slider"
              >
              </el-slider>
              <el-input-number
                v-model="modelConfig.maxOutputTokens"
                :min="0"
                :max="1000000"
                :step="100"
                controls-position="right"
              />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="resetModelConfig">重置</el-button>
          <el-button type="primary" @click="saveModelConfig">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss">
.input-container {
  .el-textarea {
    .el-textarea__inner {
      padding-right: 40px;
    }
  }
  border: 1px solid rgba(86, 86, 95, 0.32) !important;
}

// 多模型对话组件样式
.multi-model-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;

  // 头部样式
  .chat-header {
    padding: 16px 24px;
    background: white;
    border-bottom: 1px solid #f0f0f0;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .header-left {
      flex: 1;
      min-width: 0;

      .model-selector-row {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .chat-title {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        color: #333;
      }

      .model-selector {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0; // Prevent button from shrinking

        .selected-count {
          font-size: 14px;
          color: #666;
          margin-left: 8px;
        }
      }

      .selected-models {
        flex: 1;
        min-width: 0; // Allow content to shrink
        padding: 12px 16px;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

        .selected-models-container {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .selected-models-title {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          white-space: nowrap;
          flex-shrink: 0;

          .title-text {
            display: flex;
            align-items: center;
            gap: 6px;

            &::before {
              content: '🤖';
              font-size: 14px;
            }
          }
        }

        .selected-models-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          flex: 1;

          .selected-model-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            font-size: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;

            &:hover {
              transform: translateY(-1px);
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
              border-color: #cbd5e1;
            }

            .model-name {
              color: #1e293b;
              font-weight: 500;
            }

            .remove-model-btn {
              width: 16px;
              height: 16px;
              min-width: 16px;
              padding: 0;
              border-radius: 50%;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              border: none;
              box-shadow: 0 1px 3px rgba(239, 68, 68, 0.3);
              transition: all 0.2s ease;

              &:hover {
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                transform: scale(1.1);
                box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
              }

              .el-icon {
                font-size: 9px;
                color: white;
              }
            }
          }
        }
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
      flex-shrink: 0;
      align-self: flex-start;
      margin-top: 4px;
    }
  }

  // 消息区域样式
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #ffffff;
    min-height: 400px;
  }

  // 空状态样式
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;

    .empty-icon {
      font-size: 64px;
      margin-bottom: 24px;
      opacity: 0.7;
    }

    .empty-title {
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 12px;
    }

    .empty-description {
      font-size: 15px;
      color: #6c757d;
      line-height: 1.6;
      font-weight: 400;
      max-width: 400px;
    }
  }

  // 对话组样式
  .conversation-group {
    margin-bottom: 24px;
  }

  // 用户消息样式
  .user-message {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-bottom: 24px;

    .message-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;

      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .user-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-name {
          font-size: 13px;
          font-weight: 500;
          color: #666;
        }
      }

      .message-time {
        font-size: 12px;
        color: #999;
      }
    }

    .message-content {
      max-width: 70%;
      padding: 10px 16px;
      background: #fff;
      color: #2c3e50;
      border: 1px solid #e9ecef;
      border-radius: 16px 4px 16px 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      word-wrap: break-word;
      line-height: 1.6;
      position: relative;
      border: none;
    }
  }

  // 多模型响应样式
  .multi-model-response {
    margin-bottom: 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;

    .model-tabs {
      display: flex;
      gap: 0;
      background: #f8f9fa;
      overflow-x: auto;

      .tab-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
        white-space: nowrap;
        min-width: 120px;

        &:hover {
          background: #e9ecef;
        }

        &.active {
          background: white;
          border-bottom-color: #007bff;
          color: #007bff;
        }

        .tab-icon {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .tab-name {
          font-size: 13px;
          font-weight: 500;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab-status {
          flex-shrink: 0;
        }
      }
    }

    .tab-content {
      background: white;
      min-height: 200px;

      .tab-panel {
        padding: 20px;
      }
    }

    .response-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #f8f9fa;

      .response-title {
        font-size: 16px;
        font-weight: 600;
        color: #2c3e50;
      }

      .response-time {
        font-size: 12px;
        color: #6c757d;
        font-weight: 500;
      }
    }

    .show-line {
      border-bottom: 1px solid #e9ecef;
    }

    .model-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      flex-wrap: wrap;

      .tab-item {
        padding: 8px 12px;
        border-radius: 6px 6px 0 0;
        cursor: pointer;
        transition: all 0.2s ease;
        background: #f8f9fa;
        border: 1px solid transparent;
        min-width: 120px;

        &:hover {
          background: #e9ecef;
        }

        &.active {
          background: white;
          border-color: #e0e0e0;
          border-bottom-color: white;
          box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
        }

        .tab-content {
          display: flex;
          align-items: center;
          gap: 6px;

          .tab-icon {
            width: 18px;
            height: 18px;
            border-radius: 3px;
            flex-shrink: 0;
          }

          .tab-info {
            min-width: 0;
            flex: 1;

            .tab-name {
              font-size: 13px;
              font-weight: 500;
              color: #333;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .tab-status {
              font-size: 11px;
              margin-top: 1px;

              &.success {
                color: #28a745;
              }

              &.error {
                color: #dc3545;
              }

              &.timeout {
                color: #ffc107;
              }
            }
          }
        }
      }
    }

    .tab-content-area {
      .tab-panel {
        .model-response-card {
          background: white;
          border-radius: 0;
          padding: 20px;
          border: none;
          border-bottom: 1px solid #f0f0f0;
          box-shadow: none;
          transition: all 0.2s ease;

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background: #f8f9fa;
          }
        }
      }
    }
  }

  // 模型头部信息
  .model-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .model-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .model-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        flex-shrink: 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .model-details {
        .model-name {
          font-size: 15px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 2px;
        }

        .model-provider {
          font-size: 12px;
          color: #6c757d;
          font-weight: 500;
        }
      }
    }

    .response-status {
      display: flex;
      align-items: center;
      gap: 10px;

      .response-duration {
        font-size: 12px;
        color: #6c757d;
        font-weight: 500;
        background: #e9ecef;
        padding: 2px 8px;
        border-radius: 12px;
      }
    }
  }

  // 响应内容
  .response-content {
    margin-bottom: 16px;

    .content-text {
      font-size: 15px;
      line-height: 1.7;
      color: #2c3e50;
      white-space: pre-wrap;
      word-break: break-word;
      font-weight: 400;
    }

    .error-content {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #dc3545;
      font-size: 14px;
      padding: 12px 16px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
      margin-top: 8px;

      .error-icon {
        font-size: 16px;
      }
    }
  }

  // Token使用情况
  .token-usage {
    display: flex;
    gap: 16px;
    padding: 8px 12px;
    background: #f8f9fa;
    border-radius: 6px;
    font-size: 12px;
    flex-wrap: wrap;
    margin-top: 12px;
    align-items: center;

    .token-item {
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;

      .token-label {
        color: #6c757d;
        font-weight: 500;
      }

      .token-value {
        font-weight: 600;
        color: #2c3e50;
      }

      &.cost .token-value {
        color: #28a745;
      }
    }
  }

  // 加载状态
  .loading-message {
    background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
    border-radius: 12px;
    padding: 16px 20px;
    border: 1px solid #e1e8ff;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
    margin: 12px 20px;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    }

    .loading-content {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      color: #667eea;
      font-weight: 600;

      .el-icon {
        font-size: 16px;
        color: #667eea;
      }
    }
  }

  // 输入区域样式
  .chat-input {
    padding: 20px 24px;
    background: white;

    .input-container {
      width: 100%;
      border: 0;
      border-radius: 12px;
      background: #f9fafb;
      overflow: hidden;
    }

    .message-input {
      margin-bottom: 0;
      padding-top: 5px;
      background: #fff;

      :deep(.el-textarea__inner) {
        background: transparent;
        border: none;
        border-radius: 0;
        padding: 16px;
        font-size: 15px;
        line-height: 1.6;
        box-shadow: none;
        resize: none;

        &:focus {
          border: none;
          box-shadow: none;
        }
      }
    }

    .tool-btn {
      width: 100% !important;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      background: #fff;

      .left-box {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .right-box {
        display: flex;
        align-items: center;
        gap: 12px;

        .input-tips {
          .tip-warning {
            color: #f59e0b;
            font-size: 12px;
          }

          .tip-info {
            color: #6b7280;
            font-size: 12px;
          }
        }
      }
    }

    .model-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #fff;
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
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
        color: #6b7280;
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
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }
      }

      &:active {
        transform: translateY(0);
      }
    }

    .submit-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;

      &:hover {
        background: linear-gradient(90deg, #5d77e7 0%, #7345a1 100%);
      }
    }

  }
}

// Element Plus 组件样式覆盖
.multi-model-chat {
  .el-button.select-model-btn {
    background: #007bff !important;
    border-color: #007bff !important;
    color: #ffffff !important;
    border-radius: 6px !important;
    padding: 8px 16px !important;
    font-size: 14px !important;

    &:hover {
      background: #0056b3 !important;
      border-color: #0056b3 !important;
      color: #ffffff !important;
    }
  }

  .el-button.clear-btn {
    background: #f8f9fa !important;
    border-color: #dee2e6 !important;
    color: #6c757d !important;
    border-radius: 6px !important;
    padding: 8px 16px !important;
    font-size: 14px !important;

    &:hover {
      background: #e9ecef !important;
      border-color: #adb5bd !important;
      color: #495057 !important;
    }
  }

  .el-button.send-button {
    background: #007bff !important;
    border-color: #007bff !important;
    color: #ffffff !important;
    border-radius: 6px !important;
    min-width: 80px !important;

    &:hover {
      background: #0056b3 !important;
      border-color: #0056b3 !important;
      color: #ffffff !important;
    }
  }

  .el-textarea .el-textarea__inner {
    border-radius: 8px !important;
    border: 0px solid #e0e0e0 !important;
    font-size: 14px !important;
    line-height: 1.5 !important;
    background: #fff !important;
    box-shadow: none !important;
    &:focus {
      border-color: #007bff !important;
      box-shadow: 0 !important;
    }
  }
}

// 模型选择弹窗样式
.model-selector-content {
  .selector-filters {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: nowrap;
    padding: 16px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px;
    border: 1px solid #e9ecef;

    .search-input {
      flex: 2;
      min-width: 180px;

      :deep(.el-input__wrapper) {
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e9ecef;

        &:hover {
          border-color: #007bff;
        }

        &.is-focus {
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
        }
      }
    }

    .provider-select {
      flex: 1;
      min-width: 100px;

      :deep(.el-select__wrapper) {
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e9ecef;

        &:hover {
          border-color: #007bff;
        }

        &.is-focus {
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
        }
      }
    }
  }

  .model-list {
    max-height: 350px;
    overflow-y: auto;
    overflow-x: hidden;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    background: white;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    .model-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 1px solid #f8f9fa;
      position: relative;
      min-height: 56px;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        transform: translateX(2px);
      }

      &.selected {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-left: 4px solid #007bff;
        box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);

        &::before {
          content: '✓';
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #007bff;
          font-weight: bold;
          font-size: 16px;
        }
      }

      .model-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        flex-shrink: 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border: 2px solid #fff;
        margin-top: 2px;
      }

      .model-info {
        flex: 1;
        min-width: 0;
        overflow: hidden;

        .model-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          width: 100%;
        }

        .model-name {
          font-size: 15px;
          font-weight: 600;
          color: #2c3e50;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
          white-space: nowrap;
        }

        .model-provider {
          font-size: 9px;
          color: #007bff;
          font-weight: 500;
          background: #e3f2fd;
          padding: 1px 4px;
          border-radius: 4px;
          display: inline-block;
          border: 1px solid #bbdefb;
          flex-shrink: 0;
          white-space: nowrap;
          margin-left: 0px;
        }

        .model-description {
          font-size: 11px;
          color: #868e96;
          line-height: 1.4;
          margin-top: 2px;
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
        }
      }

      .model-status {
        font-size: 12px;
        color: #52c41a;
        flex-shrink: 0;
        white-space: nowrap;
        min-width: fit-content;
      }
    }
  }

  .selector-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding: 16px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px;
    border: 1px solid #e9ecef;
    flex-wrap: wrap;
    gap: 12px;

    .selected-info {
      font-size: 14px;
      color: #495057;
      font-weight: 500;
      background: white;
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid #dee2e6;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .action-buttons {
      display: flex;
      gap: 12px;

      .el-button {
        border-radius: 8px;
        font-weight: 500;
        padding: 10px 20px;
        transition: all 0.2s ease;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        &.el-button--primary {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          border: none;

          &:hover {
            background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
          }
        }

        &.el-button--default {
          background: white;
          border: 1px solid #dee2e6;
          color: #495057;

          &:hover {
            background: #f8f9fa;
            border-color: #adb5bd;
          }
        }
      }
    }
  }
}

// 响应式优化
@media (max-width: 768px) {
  .multi-model-chat {
    .chat-header {
      .header-content {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .header-left {
        width: 100%;
      }

      .header-right {
        width: 100%;
        justify-content: flex-end;
        margin-top: 0;
        align-self: stretch;
      }

      .selected-models {
        margin-top: 8px;
        padding: 12px;

        .selected-models-container {
          gap: 8px;
        }

        .selected-models-title {
          font-size: 12px;

          .title-text {
            &::before {
              font-size: 12px;
            }
          }
        }

        .selected-models-list {
          gap: 6px;

          .selected-model-item {
            padding: 4px 10px;
            font-size: 11px;
            border-radius: 16px;

            .remove-model-btn {
              width: 14px;
              height: 14px;
              min-width: 14px;

              .el-icon {
                font-size: 7px;
              }
            }
          }
        }
      }
    }

    .model-tabs {
      .tab-item {
        min-width: 100px;

        .tab-content {
          .tab-info {
            .tab-name {
              font-size: 12px;
            }
          }
        }
      }
    }

    .token-usage {
      gap: 8px;

      .token-item {
        min-width: 60px;
      }
    }

    .chat-input {
      .input-container {
        .input-actions {
          flex-direction: column;
          align-items: stretch;
          gap: 8px;

          .input-tips {
            min-width: auto;
            text-align: center;
          }
        }
      }
    }
  }

  .model-selector-content {
    .selector-filters {
      flex-direction: column;
      gap: 12px;

      .search-input,
      .provider-select {
        min-width: auto;
      }
    }

    .selector-actions {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;

      .action-buttons {
        justify-content: center;
      }
    }
  }
}

@media (max-width: 480px) {
  .multi-model-chat {
    .chat-header {
      padding: 12px 16px;
    }

    .chat-messages {
      padding: 16px;
    }

    .chat-input {
      padding: 16px;
    }

    .model-tabs {
      .tab-item {
        min-width: 80px;
        padding: 6px 8px;
      }
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

// 模型配置弹窗样式
.model-config-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8px 12px;
    margin: 0;
    border-bottom: none;

    .el-dialog__title {
      font-size: 14px;
      font-weight: 600;
      color: white;
    }

    .el-dialog__headerbtn {
      top: 8px;
      right: 12px;

      .el-dialog__close {
        color: white;
        font-size: 16px;

        &:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
    background: #fafbfc;
  }

  .config-content {
    padding: 12px;
    background: white;
    margin: 6px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

    .config-section {
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 6px;
        padding-bottom: 3px;
        border-bottom: 2px solid #e3f2fd;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
      }

      .system-prompt-input {
        :deep(.el-textarea__inner) {
          border-radius: 8px;
          border: 2px solid #e9ecef;
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
          transition: all 0.3s ease;
          background: #fafbfc;

          &:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            background: white;
          }

          &::placeholder {
            color: #adb5bd;
            font-style: italic;
          }
        }
      }

      .config-item {
        margin-bottom: 8px;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 6px;
        border: 1px solid #e9ecef;
        transition: all 0.3s ease;

        &:hover {
          background: #f1f3f4;
          border-color: #dee2e6;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .config-label {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #495057;

          .info-icon {
            font-size: 10px;
            color: #6c757d;
            cursor: help;
            transition: color 0.3s ease;

            &:hover {
              color: #667eea;
            }
          }
        }

        .config-control {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-left: 10px;

          &.slider-with-clear-control {
            .config-slider {
              flex: 1;

              :deep(.slider-input-with-clear) {
                width: 200px !important;
                min-width: 200px;

                .el-input__wrapper {
                  width: 200px !important;
                  min-width: 200px !important;
                }

                .el-input__inner {
                  width: 200px !important;
                }

                .el-input__wrapper {
                  padding-right: 30px;
                }

                .el-input__suffix {
                  right: 4px;

                  .clear-input-btn {
                    width: 16px;
                    height: 16px;
                    padding: 0;
                    font-size: 10px;
                    border: none;
                    background: transparent;
                    color: #c0c4cc;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;

                    &:hover {
                      color: #909399;
                      background: #f5f7fa;
                    }
                  }
                }
              }
            }
          }

          .config-slider {
            flex: 1;
            margin: 0;

            :deep(.el-slider__runway) {
              background: linear-gradient(90deg, #e9ecef 0%, #dee2e6 100%);
              height: 6px;
              border-radius: 3px;
            }

            :deep(.el-slider__bar) {
              background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
              border-radius: 3px;
            }

            :deep(.el-slider__button) {
              width: 20px;
              height: 20px;
              border: 3px solid #667eea;
              background: white;
              box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
              transition: all 0.3s ease;

              &:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
              }
            }

            :deep(.el-slider__stop) {
              background: #dee2e6;
              border-radius: 50%;
            }
          }

          .config-input {
            width: 100px;

            :deep(.el-input__wrapper) {
              border-radius: 8px;
              border: 2px solid #e9ecef;
              background: white;
              transition: all 0.3s ease;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

              &:hover {
                border-color: #dee2e6;
              }

              &.is-focus {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
              }
            }

            :deep(.el-input-number__decrease),
            :deep(.el-input-number__increase) {
              border-radius: 6px;
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              color: #6c757d;

              &:hover {
                background: #e9ecef;
                color: #495057;
              }
            }
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 0 12px 10px;
    margin: 0;

    .el-button {
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
      transition: all 0.3s ease;
      border: 2px solid transparent;

      &:not(.el-button--primary) {
        background: white;
        border-color: #dee2e6;
        color: #6c757d;

        &:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
          color: #495057;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        // 重置按钮特殊样式
        &:first-child {
          background: #fff3cd;
          border-color: #ffeaa7;
          color: #856404;

          &:hover {
            background: #ffeaa7;
            border-color: #fdcb6e;
            color: #6c5ce7;
          }
        }
      }

      &.el-button--primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

        &:hover {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }
  }
}

// 全局样式强制覆盖Max Output Tokens输入框宽度
.slider-input-with-clear {
  width: 200px !important;
  min-width: 200px !important;

  .el-input__wrapper {
    width: 200px !important;
    min-width: 200px !important;
  }

  .el-input__inner {
    width: 200px !important;
  }
}

// 针对el-input-number的特殊样式
.el-input-number.slider-input-with-clear {
  width: 200px !important;
  min-width: 200px !important;

  .el-input__wrapper {
    width: 200px !important;
    min-width: 200px !important;
  }

  .el-input__inner {
    width: 200px !important;
  }
}

// 更精确的选择器
.model-config-dialog .el-input-number.slider-input-with-clear {
  width: 200px !important;
  min-width: 200px !important;
  max-width: 200px !important;

  .el-input {
    width: 200px !important;
    min-width: 200px !important;
  }

  .el-input__wrapper {
    width: 200px !important;
    min-width: 200px !important;
  }

  .el-input__inner {
    width: 200px !important;
  }
}
</style>
