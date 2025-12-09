<script setup lang="ts">
import {ref, reactive} from 'vue'
import Sidebar from "@/views/image/sidebar.vue"
import {queryHotDataApi} from "@/api/api";
import type {ModelParameters, ModelPrice, ModelVo} from "@/api/ai/model/types.ts";
import {imageApi, chatApi} from "@/api/ai/aigc";
import type {ImageModelBo, ImageModelParam, ChatModelBo} from "@/api/ai/aigc/types.ts";

// 响应式数据
const isLoading = ref(false)
const generatedImages = ref<string[]>([])
const showModelDropdown = ref(false)
const chatModelList = ref<ModelVo[]>([])
const showOptimizeDialog = ref(false)
const optimizeFormData = ref({
  prompt: '',
  outputEnglish: true
})
const isOptimizing = ref(false)
const optimizedResult = ref<string>('')
const optimizedPrompts = ref<{
  enhanced_prompt?: string
  chinese_prompt?: string
}>({})
const activeTab = ref('chinese')

// 加载页面
onMounted(() => {
  initData()
})

// 初始化数据
const initData = () => {
  loadImageModelList()
  loadChatModelList()
}

// 加载聊天模型列表（用于优化提示词）
const loadChatModelList = () => {
  queryHotDataApi('ai_model_chat').then((res: any) => {
    chatModelList.value = res.data || []
  })
}

// 加载文生图模型列表
const modelList = ref<ModelVo[]>([])
// 选中的模型
const activeModel = ref<ModelVo>({})
// 解析模型支持类型
const modelParams = ref<ModelParameters>({})
// 解析模型价格
const modelPrice = ref<ModelPrice>({})
// 输出图像分辨率选项
const sizeOptions = ref<string[]>([])
// 生成数量选项
const imageCountOptions = ref<Options[]>([])
// 生成图片质量选项
const qualityOptions = ref<string[]>([])
const loadImageModelList = () => {
  queryHotDataApi('ai_model_textToImage').then((res: any) => {
    modelList.value = res.data
    selectModel(res.data[0])
  })
}

// 表单数据
const formData = reactive({
  prompt: '',
  negativePrompt: '',
  size: '',
  n: 1,
  quality: '',
  seed: 0,
  promptExtend: false,
  watermark: false,
})

// 表单验证
const validateForm = () => {
  if (!activeModel.value.id) {
    faToast.error('请选择模型')
    return false
  }
  if (!formData.prompt.trim()) {
    faToast.error('请输入创意描述')
    return false
  }
  return true
}

// 生成图片
const generateImages = async () => {
  if (!validateForm()) return

  isLoading.value = true
  generatedImages.value = []
  try {
    let imageParam: ImageModelParam = {
      prompt: formData.prompt,
      negativePrompt: formData.negativePrompt,
      n: formData.n,
      size: formData.size,
      quality: formData.quality,
      seed: formData.seed,
      promptExtend: formData.promptExtend,
      watermark: formData.watermark,
    }
    let requestData: ImageModelBo = {
      provider: activeModel.value.provider || '',
      model: activeModel.value.name || '',
      function: 'textToImage',
      params: imageParam
    }
    imageApi(requestData).then((res: any) => {
      if (res.code === 0) {
        generatedImages.value = res.data
        faToast.success(`成功生成${generatedImages.value.length}张图片`)
      } else {
        faToast.error(res.msg || '生成失败，请重试')
      }
      isLoading.value = false
    })
  } catch (error) {
    isLoading.value = false
    console.error('生成图片失败:', error)
    faToast.error('生成失败，请检查网络连接或稍后重试')
  }
}

// 下载图片
const downloadImage = (imageUrl: string, _index: number) => {
  // 在新标签页中打开图片链接
  window.open(imageUrl, '_blank')
}

// 打开优化提示词弹窗
const openOptimizeDialog = () => {
  optimizeFormData.value.prompt = formData.prompt
  optimizedResult.value = ''
  optimizedPrompts.value = {}
  activeTab.value = 'chinese'
  showOptimizeDialog.value = true
}

// 优化提示词
const optimizePrompt = async () => {
  if (!optimizeFormData.value.prompt.trim()) {
    faToast.error('请输入创意描述')
    return
  }

  isOptimizing.value = true
  optimizedResult.value = ''

  try {
    let systemPrompt = `## Profile
你是一位经验丰富、视野开阔的设计顾问和创意指导，对各领域的视觉美学和用户体验有深刻理解。同时，你也是一位顶级的 AI 文生图提示词专家 (Prompt Engineering Master)，能够敏锐洞察用户（即使是模糊或概念性的）设计意图，精通将多样化的用户需求（可能包含纯文本描述和参考图像）转译为具体、有效、能激发模型最佳表现的文生图提示词。

## Core Mission
- 你的核心任务是接收用户提供的任何类型的设计需求，基于对文生图模型能力边界的深刻理解进行处理。
- 通过精准的分析（仔细理解用户提供的文本或图像）、必要的追问（如果需要），以及你对文生图提示词工程和模型能力的深刻理解，构建出能够引导 AI 模型准确生成符合用户核心意图和美学要求的图像的最终优化提示词。
- 强调对用户完整意图的精准把握，理解文生图模型能力边界，并采用最有效的文生图提示词引导策略来处理精确性要求，最终激发模型潜力。

## Input Handling
- 接受多样化输入: 准备好处理纯文本描述/关键词列表/参考图像，或文本与图像的组合。
- 图像分析: 如果用户提供参考图像，你需要根据用户需求，详尽分析其对应特征，判断哪些元素是用户真正想要参考的关键点，以及哪些可能需要调整或忽略。

## Key Responsibilities
1. 需求解析: 全面理解用户输入（文本和/或图像），洞察任何隐含要求，识别是否存在歧义、冲突。
2. 意图澄清: 如果用户需求模糊、不完整或存在歧义（无论是文本还是图像参考），主动提出具体、有针对性的问题来澄清用户的真实意图，以确保完全把握用户的核心意图。
3. 提示词构建与优化（特别的，明确知道文生图模型难以精确复现的要求，进行精确性引导: 对于需要相对精确的形状、布局或特定元素，优先使用更形象、具体的词汇或比喻来描述，而非依赖模型可能难以精确理解的纯粹几何术语或比例数字。）
4. 输出交付:
* 提供最终优化后的高质量中文提示词与英文提示词（两个版本）。
* 简要说明关键提示词的构思逻辑或选择理由，帮助用户理解。
* 若用户需求存在多种合理的诠释或实现路径，可提供1-2个具有显著差异的备选提示词供用户探索。

## Guiding Principles
* 精准性:力求每个词都服务于最终的视觉呈现。
* 细节化:尽可能捕捉和转化用户需求中的细节。
* 结构化:提示词应具有清晰的逻辑结构。
* 用户中心:最终目标是如实反映用户的设计意图。

## Interaction Style
专业、耐心、细致、具有启发性。在必要时主动引导用户思考，以获取更清晰的需求。

## 输出格式（严格JSON）
{
  "enhanced_prompt": "英文提示词版本",
  "chinese_prompt": "中文提示词版本"
}`

    const message = optimizeFormData.value.prompt

    const data: ChatModelBo = {
      provider: 'deepseek',
      model: 'deepseek-v3.2',
      function: 'chat',
      params: {
        prompt: systemPrompt,
        message: message,
        stream: false,
        enableThinking: false,
        enableSearch: false
      }
    }

    const response = await chatApi(data)

    // 检查响应是否成功
    if (response.code === 0 && response.data) {
      const content = response.data.content || ''
      optimizedResult.value = content

      // 尝试解析JSON，提取英文和中文提示词
      try {
        let jsonStr = content.trim()
        if (jsonStr.includes('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        } else if (jsonStr.includes('```')) {
          jsonStr = jsonStr.replace(/```\n?/g, '').trim()
        }

        const parsed = JSON.parse(jsonStr)
        optimizedPrompts.value = {
          enhanced_prompt: parsed.enhanced_prompt || '',
          chinese_prompt: parsed.chinese_prompt || ''
        }
        // 设置默认激活的标签页（优先中文）
        activeTab.value = optimizedPrompts.value.chinese_prompt ? 'chinese' : 'english'
      } catch (parseError) {
        // 如果解析失败，清空提取的内容
        optimizedPrompts.value = {}
      }
    } else {
      faToast.error(response.msg || '优化失败，请重试')
    }
  } catch (error) {
    console.error('优化提示词失败:', error)
    faToast.error('优化失败，请检查网络连接或稍后重试')
  } finally {
    isOptimizing.value = false
  }
}

// 复制文本到剪贴板
const copyToClipboard = async (text: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    faToast.success('已复制到剪贴板')
  } catch (error) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      faToast.success('已复制到剪贴板')
    } catch (err) {
      faToast.error('复制失败')
    }
    document.body.removeChild(textArea)
  }
}

// 使用优化后的提示词
const useOptimizedPrompt = (prompt: string) => {
  if (prompt) {
    formData.prompt = prompt
    showOptimizeDialog.value = false
    faToast.success('已应用到输入框')
  }
}

// 模型选择相关函数
const toggleModelDropdown = () => {
  showModelDropdown.value = !showModelDropdown.value
}

const selectModel = (model: ModelVo) => {
  activeModel.value = model
  modelParams.value = JSON.parse(model.parameters || '')
  modelPrice.value = JSON.parse(model.price || '')
  sizeOptions.value = modelParams.value.resolutions || []
  // 默认选中第一个分辨率
  if (sizeOptions.value.length > 0) {
    formData.size = sizeOptions.value[0]
  }
  qualityOptions.value = modelParams.value.qualities || []
  if (qualityOptions.value.length > 0) {
    formData.quality = qualityOptions.value[0]
  }

  imageCountOptions.value = []
  for (let i = 1; i <= (modelParams.value.maxNum || 1); i++) {
    imageCountOptions.value.push({label: i + "张", value: i + '', sort: i})
  }
  showModelDropdown.value = false
}

const getCurrentModelIcon = () => {
  const currentModel = modelList.value.find(model => model.id === activeModel.value.id)
  return currentModel?.providerIcon || ''
}

const getCurrentModelName = () => {
  const currentModel = modelList.value.find(model => model.id === activeModel.value.id)
  return currentModel?.alias || ''
}

const getCurrentModelDesc = () => {
  const currentModel = modelList.value.find(model => model.id === activeModel.value.id)
  return currentModel?.remark || ''
}

// 根据分辨率字符串自动判断宽高比
const getAspectRatioClass = (resolution: string) => {
  if (!resolution) return 'square'

  // 解析分辨率字符串，支持多种格式：1024:1024, 1024x1024, 1024*1024等
  const match = resolution.match(/(\d+)[:*x](\d+)/i)
  if (!match) return 'square'

  const width = parseInt(match[1])
  const height = parseInt(match[2])

  if (!width || !height) return 'square'

  const ratio = width / height

  // 判断宽高比
  if (Math.abs(ratio - 1) < 0.1) {
    return 'square' // 正方形 (1:1)
  } else if (ratio > 1.2) {
    return 'landscape' // 横屏 (宽>高)
  } else if (ratio < 0.8) {
    return 'portrait' // 竖屏 (高>宽)
  } else {
    return 'square' // 接近正方形的归为正方形
  }
}

const calCredits = computed(() => {
  if (modelPrice.value.credit && modelPrice.value.credit > 0) {
    return modelPrice.value.credit * formData.n
  }
  if (modelPrice.value.conditions) {
    for (let condition of modelPrice.value.conditions) {
      if (condition.fieldKeys === 'quality,size') {
        if ((formData.quality + ',' + formData.size) === condition.fieldValues) {
          return condition.credit * formData.n
        }
      } else if (condition.fieldKeys === 'size') {
        if (formData.size === condition.fieldValues) {
          return condition.credit * formData.n
        }
      } else if (condition.fieldKeys === 'quality') {
        if (formData.quality === condition.fieldValues) {
          return condition.credit * formData.n
        }
      }
    }
  }
  return 0
})
</script>

<template>
  <div class="text-to-image-container">
    <!-- 左侧导航栏 -->
    <div class="sidebar-section">
      <Sidebar/>
    </div>

    <!-- 中央输入面板 -->
    <div class="input-panel">
      <div class="panel-body">
        <!-- 模型选择 -->
        <div class="form-section ai-model">
          <label class="form-label">
            AI模型
          </label>
          <div class="model-selector">
            <div class="selected-model" @click="toggleModelDropdown">
              <div class="model-icon">
                <img :src="getCurrentModelIcon()" alt="">
              </div>
              <div class="model-info">
                <div class="model-name">{{ getCurrentModelName() }}</div>
                <div class="model-desc">{{ getCurrentModelDesc() }}</div>
              </div>
              <div class="dropdown-arrow" :class="{ 'rotated': showModelDropdown }">
                ▼
              </div>
            </div>

            <div v-if="showModelDropdown" class="model-dropdown">
              <div
                v-for="model in modelList"
                :key="model.id"
                class="model-option"
                @click="selectModel(model)"
              >
                <div class="model-option-icon">
                  <img :src="model.providerIcon" alt="">
                </div>
                <div class="model-option-info">
                  <div class="model-option-name">{{ model.alias }}</div>
                  <div class="model-option-desc">{{ model.remark }}</div>
                </div>
                <div v-if="activeModel.id === model.id" class="selected-indicator">✓</div>
              </div>
            </div>
          </div>
        </div>
        <div class="middle-box">
          <!-- 创意描述 -->
          <div class="form-section">
            <label class="form-label">
              创意描述 (必填)
            </label>
            <div class="prompt-input-wrapper">
              <el-input
                v-model="formData.prompt"
                maxlength="1000"
                placeholder="请描述你想生成的图片内容，例如：一只可爱的小猫坐在窗台上，阳光透过窗户洒在它身上，背景是温馨的客厅"
                show-word-limit
                type="textarea"
                :rows=5
                :autosize="{ minRows: 5, maxRows: 10 }"
                class="prompt-textarea"
              />
              <div class="prompt-actions">
                <button
                  class="optimize-prompt-btn"
                  @click="openOptimizeDialog"
                >
                  <img
                    src="https://shuyoutech.com/preview/deepseek.png"
                    alt="优化提示词"
                    class="optimize-icon"
                  />
                  <span>优化提示词</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 反向提示词 -->
          <div v-show="modelParams.supports?.includes('negativePrompt')" class="form-section">
            <label class="form-label">
              反向提示词 (可选)
            </label>
            <textarea
              v-model="formData.negativePrompt"
              class="prompt-input"
              placeholder="描述你不希望在画面中看到的内容"
              rows="3"
              maxlength="1000"
            />
          </div>

          <!-- 参数设置 -->
          <div v-show="sizeOptions" class="settings-section">
            <!-- 第一行：分辨率选择 -->
            <div class="setting-row setting-row-size">
              <div class="size-selector">
                <div class="size-header">
                  <span class="size-title">图像的分辨率</span>
                </div>
                <div class="size-options">
                  <button
                    v-for="option in sizeOptions"
                    :key="option"
                    :class="[
                        'size-option',
                        { 'size-option-selected': formData.size === option }
                      ]"
                    @click="formData.size = option"
                  >
                    <div class="size-icon" :class="getAspectRatioClass(option)">
                      <div class="size-icon-inner"></div>
                    </div>
                    <span class="size-label">{{ option }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 第二行：数量和质量选择 -->
            <div class="setting-row setting-row-count-quality">
              <div class="count-quality-selector">
                <div v-show="imageCountOptions" class="count-selector">
                  <div class="count-header">
                    <span class="count-title">图片个数</span>
                  </div>
                  <div class="count-select-wrapper">
                    <select v-model="formData.n" class="count-select">
                      <option
                        v-for="option in imageCountOptions"
                        :key="option.value"
                        :value="Number(option.value)"
                      >
                        {{ option.label }}
                      </option>
                    </select>
                  </div>
                </div>

                <div v-show="modelParams.qualities" class="quality-selector">
                  <div class="quality-header">
                    <span class="quality-title">质量</span>
                  </div>
                  <div class="count-select-wrapper">
                    <select v-model="formData.quality" class="count-select">
                      <option
                        v-for="option in qualityOptions"
                        :key="option"
                        :value="option"
                      >
                        {{ option }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- 第三行：随机种子 -->
            <div v-show="modelParams.maxSeed" class="setting-row setting-row-seed">
              <div class="seed-selector">
                <div class="seed-header">
                  <span class="seed-title">随机种子数</span>
                  <FaTooltip text="随机数种子，用于控制模型生成内容的随机性">
                    <FaIcon name="i-ri:question-line"/>
                  </FaTooltip>
                </div>
                <div class="seed-input">
                  <el-slider v-model="formData.seed" show-input :min="0" :max="modelParams.maxSeed"/>
                </div>
              </div>
            </div>

            <!-- 第四行：底部控制栏 -->
            <div class="setting-row setting-row-bottom">
              <div class="bottom-controls">

                <div v-show="modelParams.supports?.includes('promptExtend')" class="control-item">
                  <label class="control-label">智能修改</label>
                  <FaTooltip text="是否开启prompt智能改写。开启后会使用大模型对输入prompt进行智能改写">
                    <FaIcon name="i-ri:question-line"/>
                  </FaTooltip>
                  <div class="toggle-switch">
                    <input
                      v-model="formData.promptExtend"
                      type="checkbox"
                      id="smartEdit"
                      class="toggle-input"
                    />
                    <label for="smartEdit" class="toggle-label">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div v-show="modelParams.supports?.includes('watermark')" class="control-item">
                  <label class="control-label">添加水印</label>
                  <FaTooltip text="是否添加水印标识，水印位于图片右下角，文案为“AI生成”">
                    <FaIcon name="i-ri:question-line"/>
                  </FaTooltip>
                  <div class="toggle-switch">
                    <input
                      v-model="formData.watermark"
                      type="checkbox"
                      id="watermark"
                      class="toggle-input"
                    />
                    <label for="watermark" class="toggle-label">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成按钮 -->
        <button
          @click="generateImages"
          :disabled="isLoading"
          class="generate-button"
          :class="{ 'loading': isLoading }"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? '生成中...' : '立即生成（' + calCredits + '算力）' }}
        </button>
      </div>
    </div>

    <!-- 右侧结果展示区域 -->
    <div class="result-panel">
      <div class="display-header">
        <h3 class="display-title">生成结果</h3>
      </div>

      <div class="display-content">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-animation">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p class="loading-text">AI正在创作中，请稍候...</p>
          </div>
        </div>

        <div v-else-if="generatedImages.length === 0" class="empty-state">
          <div class="palette-icon">
            <div class="palette-wood">
              <div class="paint-dot red"></div>
              <div class="paint-dot yellow"></div>
              <div class="paint-dot green"></div>
              <div class="paint-dot blue"></div>
              <div class="paint-dot purple"></div>
            </div>
          </div>
          <p class="empty-text">输入创意描述,开始生成你的专属图片</p>
        </div>

        <div v-else class="images-grid">
          <div
            v-for="(image, index) in generatedImages"
            :key="index"
            class="image-item"
          >
            <img
              :src="image"
              :alt="`生成的图片 ${index + 1}`"
              class="generated-image"
              @click="downloadImage(image, index)"
              @load="() => {}"
            />
            <div class="image-actions">
              <button
                @click="downloadImage(image, index)"
                class="download-button"
              >
                查看
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 优化提示词弹窗 -->
    <el-dialog
      v-model="showOptimizeDialog"
      title="优化提示词"
      width="700px"
      class="optimize-dialog"
      :close-on-click-modal="false"
    >
      <div class="optimize-content">
        <!-- 创意描述输入 -->
        <label class="form-label">创意描述</label>
        <el-input
          v-model="optimizeFormData.prompt"
          type="textarea"
          maxlength="1000"
          show-word-limit
          :rows=5
          :autosize="{ minRows: 5, maxRows: 10 }"
          placeholder="请输入您想要优化的创意描述"
          class="prompt-input"
        />
        <!-- 优化按钮 -->
        <el-button
          type="primary"
          :loading="isOptimizing"
          @click="optimizePrompt"
          class="optimize-btn"
        >
          {{ isOptimizing ? '优化中...' : '优化提示词' }}
        </el-button>

        <!-- 优化结果展示 -->
        <div v-if="optimizedResult && (optimizedPrompts.enhanced_prompt || optimizedPrompts.chinese_prompt)" class="result-container">
          <el-tabs v-model="activeTab" class="prompt-tabs">
            <!-- 中文提示词标签页 -->
            <el-tab-pane
              v-if="optimizedPrompts.chinese_prompt"
              label="中文提示词"
              name="chinese"
            >
              <template #label>
                <span class="tab-label">
                  <FaIcon name="i-ri:translate-2" class="tab-icon"/>
                  中文提示词
                </span>
              </template>
              <div class="tab-content">
                <div class="tab-actions">
                  <el-button
                    size="small"
                    @click="copyToClipboard(optimizedPrompts.chinese_prompt || '')"
                  >
                    <FaIcon name="i-ri:file-copy-line"/>
                    复制
                  </el-button>
                  <el-button
                    type="primary"
                    size="small"
                    @click="useOptimizedPrompt(optimizedPrompts.chinese_prompt || '')"
                  >
                    使用此提示词
                  </el-button>
                </div>
                <div class="prompt-text-content">
                  <div class="prompt-text">{{ optimizedPrompts.chinese_prompt }}</div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 英文提示词标签页 -->
            <el-tab-pane
              v-if="optimizedPrompts.enhanced_prompt"
              label="英文提示词"
              name="english"
            >
              <template #label>
                <span class="tab-label">
                  <FaIcon name="i-ri:global-line" class="tab-icon"/>
                  英文提示词
                </span>
              </template>
              <div class="tab-content">
                <div class="tab-actions">
                  <el-button
                    size="small"
                    @click="copyToClipboard(optimizedPrompts.enhanced_prompt || '')"
                  >
                    <FaIcon name="i-ri:file-copy-line"/>
                    复制
                  </el-button>
                  <el-button
                    type="primary"
                    size="small"
                    @click="useOptimizedPrompt(optimizedPrompts.enhanced_prompt || '')"
                  >
                    使用此提示词
                  </el-button>
                </div>
                <div class="prompt-text-content">
                  <div class="prompt-text">{{ optimizedPrompts.enhanced_prompt }}</div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showOptimizeDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.text-to-image-container {
  display: flex;
  height: calc(100vh - 101px);
  background: #f8f9fa;
}

/* 左侧导航栏 */
.sidebar-section {
  width: 239px;
  background: white;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 中央输入面板 */
.input-panel {
  flex: 1;
  height: calc(100vh - 101px);
  background: white;
  border-right: 1px solid #e9ecef;
  padding: 24px;
  max-width: 500px;
  box-sizing: border-box;
}

.panel-header {
  margin-bottom: 20px;
}

.panel-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.panel-body {
  /* display: flex;
  flex-direction: column;
  gap: 18px; */
  max-width: 450px;
  padding-top: 98px;
  position: relative;
}

.ai-model {
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.middle-box {
  height: calc(100vh - 290px);
  overflow-y: auto;
  padding: 4px 0 10px 0;
}

.form-section {
  /* display: flex;
  flex-direction: column;
  gap: 8px; */
  margin-bottom: 8px;
}

.form-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
  display: block;
}

/* 创意描述输入框包装器 */
.prompt-input-wrapper {
  width: 100%;
  position: relative;
}

/* 创意描述输入框样式优化 */
.prompt-input-wrapper :deep(.el-textarea) {
  width: 100%;
}

.prompt-input-wrapper :deep(.el-textarea__inner) {
  width: 100%;
  padding: 16px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
  background: #f8f9fa;
  font-family: inherit;
  color: #2c3e50;
  min-height: 120px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.prompt-input-wrapper :deep(.el-textarea__inner:hover) {
  border-color: #ced4da;
  background: white;
}

.prompt-input-wrapper :deep(.el-textarea__inner:focus) {
  outline: none;
  border-color: #8b5cf6;
  background: white;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.prompt-input-wrapper :deep(.el-input__count) {
  background: transparent;
  color: #6c757d;
  font-size: 0.85rem;
  bottom: 8px;
  right: 12px;
}

.prompt-input-wrapper :deep(.el-textarea__inner::placeholder) {
  color: #adb5bd;
  font-size: 0.9rem;
}

/* 优化提示词按钮样式 */
.prompt-actions {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  gap: 12px;
}

.optimize-prompt-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  color: #2c3e50;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: 2px solid #dc3545;
  outline-offset: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.optimize-prompt-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #8b5cf6;
  outline-color: #dc3545;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.optimize-prompt-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.optimize-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.loading-spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(44, 62, 80, 0.3);
  border-top: 2px solid #2c3e50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

/* 优化提示词弹窗样式 */
.optimize-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.optimize-dialog :deep(.el-dialog__header) {
  padding: 16px 20px 12px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  margin: 0;
}

.optimize-dialog :deep(.el-dialog__title) {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
}

.optimize-dialog :deep(.el-dialog__headerbtn) {
  top: 14px;
  right: 16px;
}

.optimize-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
  font-size: 18px;
}

.optimize-dialog :deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: rgba(255, 255, 255, 0.8);
}

.optimize-dialog :deep(.el-dialog__body) {
  padding: 16px;
  max-height: 70vh;
  overflow-y: auto;
  background: #f8f9fa;
}

.optimize-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.optimize-content .form-section {
  margin-bottom: 0;
  background: white;
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #e9ecef;
}

.optimize-content .form-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  display: block;
  position: relative;
  padding-left: 8px;
}

.optimize-content > .form-label {
  margin-bottom: 8px;
}

.optimize-content .form-label::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 14px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 2px;
}

.optimize-content .prompt-input {
  width: 100%;
}

.optimize-content .prompt-input :deep(.el-textarea__inner) {
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  border: none;
  border-radius: 0;
  padding: 10px 0;
  transition: all 0.3s ease;
  background: transparent;
  min-height: 80px;
  box-shadow: none;
}

.optimize-content .prompt-input :deep(.el-textarea__inner:hover) {
  border: none;
  background: transparent;
  box-shadow: none;
}

.optimize-content .prompt-input :deep(.el-textarea__inner:focus) {
  border: none;
  background: transparent;
  box-shadow: none;
}

.switch-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%);
  border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.1);
}

.switch-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 6px;
}

.switch-label::before {
  content: '🌐';
  font-size: 1rem;
}

.optimize-dialog :deep(.el-switch) {
  --el-switch-on-color: #8b5cf6;
}

.optimize-dialog :deep(.el-switch__label) {
  font-weight: 500;
  font-size: 0.85rem;
}

.optimize-btn {
  width: auto;
  min-width: 140px;
  padding: 8px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: none;
  border-radius: 8px;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
  align-self: center;
  margin: 0 auto;
}

.optimize-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.optimize-btn:active:not(:disabled) {
  transform: translateY(0);
}

.result-container {
  margin-top: 8px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.prompt-tabs {
  background: white;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
}

.prompt-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.prompt-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: #e9ecef;
}

.prompt-tabs :deep(.el-tabs__item) {
  font-size: 0.9rem;
  font-weight: 500;
  color: #6c757d;
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
}

.prompt-tabs :deep(.el-tabs__item.is-active) {
  color: #8b5cf6;
  font-weight: 600;
}

.prompt-tabs :deep(.el-tabs__active-bar) {
  background-color: #8b5cf6;
}

.prompt-tabs :deep(.el-tabs__item:hover) {
  color: #8b5cf6;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-icon {
  width: 16px;
  height: 16px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tab-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f3f5;
}

.tab-actions :deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
  padding: 8px 16px;
  font-size: 0.85rem;
}

.tab-actions :deep(.el-button--primary) {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: none;
}

.prompt-text-content {
  padding: 14px;
  background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
  border-radius: 8px;
  border: 1px solid #f1f3f5;
  max-height: 250px;
  overflow-y: auto;
}

.prompt-text {
  margin: 0;
  padding: 0;
  font-size: 0.9rem;
  line-height: 1.7;
  color: #2c3e50;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

.optimize-dialog :deep(.el-dialog__footer) {
  padding: 12px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.optimize-dialog :deep(.dialog-footer .el-button) {
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  font-size: 0.9rem;
}

.prompt-input {
  width: 100%;
  padding: 16px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 0.95rem;
  resize: vertical;
  transition: all 0.3s ease;
  background: #f8f9fa;
  font-family: inherit;
}

.prompt-input:focus {
  outline: none;
  border-color: #8b5cf6;
  background: white;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

/* 模型选择器样式 */
.model-selector {
  position: relative;
  width: 100%;
}

.selected-model {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 12px;
}

.selected-model:hover {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.model-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  flex-shrink: 0;
  overflow: hidden;
}

.model-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.model-info {
  flex: 1;
  min-width: 0;
}

.model-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
}

.model-desc {
  font-size: 0.75rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-arrow {
  font-size: 0.8rem;
  color: #8b5cf6;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.model-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e9ecef;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.model-option {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 12px;
  border-bottom: 1px solid #f8f9fa;
}

.model-option:last-child {
  border-bottom: none;
}

.model-option:hover {
  background: rgba(139, 92, 246, 0.05);
}

.model-option-icon {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  flex-shrink: 0;
  overflow: hidden;
}

.model-option-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.model-option-info {
  flex: 1;
  min-width: 0;
}

.model-option-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 2px;
}

.model-option-desc {
  font-size: 0.7rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selected-indicator {
  font-size: 0.9rem;
  color: #8b5cf6;
  font-weight: bold;
  flex-shrink: 0;
}

.settings-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-row-inline {
  flex-direction: row;
  gap: 16px;
  align-items: center;
  padding: 0;
  border-bottom: 1px solid rgba(233, 236, 239, 0.5);
  justify-content: center;
  height: 52px;
}

.setting-row-inline:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 0 0 auto;
  min-width: 0;
  height: 40px;
  width: 200px;
}

.setting-row-inline .setting-item {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  align-self: center;
}

/* 分辨率选择器样式 */
.setting-row-size {
  height: auto !important;
  min-height: auto;
  padding: 4px 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.size-selector {
  width: 100%;
}

.size-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.size-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
}

.size-help {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #6c757d;
  cursor: help;
}

.size-required {
  color: #dc3545;
  font-weight: bold;
  font-size: 1rem;
}

.size-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

/* 当选项超过4个时，自动调整为每行3个 */
.size-options:has(.size-option:nth-child(5)) {
  grid-template-columns: repeat(3, 1fr);
}

.size-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
}

.size-option:hover {
  border-color: #8b5cf6;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
}

.size-option-selected {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

.size-option-selected .size-label {
  color: #8b5cf6;
  font-weight: 600;
}

.size-icon {
  width: 24px;
  height: 16px;
  border: 1px solid currentColor;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.size-icon-inner {
  background: currentColor;
  border-radius: 1px;
  transition: all 0.2s ease;
}

/* 横屏图标 - 宽矩形 */
.size-icon.landscape {
  width: 28px;
  height: 16px;
}

.size-icon.landscape .size-icon-inner {
  width: 20px;
  height: 8px;
}

/* 正方形图标 - 正方形 */
.size-icon.square {
  width: 20px;
  height: 20px;
}

.size-icon.square .size-icon-inner {
  width: 10px;
  height: 10px;
}

/* 竖屏图标 - 高矩形 */
.size-icon.portrait {
  width: 16px;
  height: 24px;
}

.size-icon.portrait .size-icon-inner {
  width: 8px;
  height: 16px;
}

.size-option:not(.size-option-selected) .size-icon {
  color: #6c757d;
}

.size-option-selected .size-icon {
  color: #8b5cf6;
  border-color: #8b5cf6;
}

.size-label {
  font-size: 0.8rem;
  color: #2c3e50;
  font-weight: 500;
}

/* 数量和质量选择器样式 */
.setting-row-count-quality {
  height: auto !important;
  min-height: auto;
  padding: 4px 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.count-quality-selector {
  width: 100%;
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.count-selector, .quality-selector {
  flex: 1;
  min-width: 0;
}

.count-selector {
  width: 100%;
}

.count-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.count-title, .quality-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
}

.quality-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.count-help {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #6c757d;
  cursor: help;
}

.count-required {
  color: #dc3545;
  font-weight: bold;
  font-size: 1rem;
}

.count-select-wrapper {
  width: 100%;
  max-width: 200px;
}

.count-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  padding-right: 32px;
}

.count-select:hover {
  border-color: #8b5cf6;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
}

.count-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
}

/* 随机种子选择器样式 */
.setting-row-seed {
  height: auto !important;
  min-height: auto;
  padding: 4px 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.seed-selector {
  width: 100%;
}

.seed-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.seed-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
}

.seed-input {
  display: flex;
  align-items: center;
  max-width: 400px;
  padding-left: 8px;
}

/* 底部控制栏样式 */
.setting-row-bottom {
  height: auto !important;
  min-height: auto;
  padding: 4px 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.bottom-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.control-item .control-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
}

.bottom-select {
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  min-width: 120px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  height: 40px;
  line-height: 40px;
}

.bottom-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
}

.control-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #2c3e50;
  white-space: nowrap;
}

/* 提示图标样式优化 */
.control-item :deep(.fa-tooltip) {
  margin-left: 4px;
  opacity: 0.6;
  transition: all 0.2s ease;
  cursor: help;
}

.control-item :deep(.fa-tooltip:hover) {
  opacity: 1;
  transform: scale(1.1);
}

.control-item :deep(.fa-icon) {
  width: 12px;
  height: 12px;
  color: #8b5cf6;
  transition: color 0.2s ease;
}

.control-item :deep(.fa-tooltip:hover .fa-icon) {
  color: #7c3aed;
}

/* 调整底部控制项布局 - 自适应隐藏 */
.setting-row-bottom {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  min-height: auto;
}

.bottom-controls {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 24px;
  width: 100%;
  flex-wrap: wrap;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* 当只有一个控制项时居中显示 */
.bottom-controls:has(.control-item:only-child) {
  justify-content: center;
}

.bottom-controls:has(.control-item:only-child) .control-item {
  justify-content: center;
}

/* 开关组件样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-label {
  display: inline-block;
  width: 40px;
  height: 22px;
  background: #e9ecef;
  border-radius: 11px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: auto 0;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.toggle-input:checked + .toggle-label {
  background: #8b5cf6;
}

.toggle-input:checked + .toggle-label .toggle-slider {
  transform: translateX(18px);
}

/* 中等屏幕优化 */
@media (max-width: 1200px) {
  .images-grid {
    grid-template-columns: 1fr !important;
    gap: 20px;
  }

  .images-grid:has(.image-item:only-child) .image-item {
    max-width: 400px;
  }

  .images-grid:has(.image-item:only-child) .generated-image {
    max-width: 400px;
    max-height: 400px;
  }

  .images-grid:has(.image-item:nth-child(4)) .image-item {
    max-width: 100%;
  }

  .images-grid:has(.image-item:nth-child(4)) .generated-image {
    max-width: 100%;
    max-height: 300px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .setting-row-inline {
    flex-direction: column;
    gap: 12px;
  }

  .setting-row-inline .setting-item {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .setting-label {
    min-width: 90px;
  }
}

.consumption-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.consumption-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

.consumption-header:hover {
  color: #8b5cf6;
}

.consumption-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
}

.consumption-arrow {
  transition: transform 0.3s ease;
  color: #8b5cf6;
  font-size: 0.8rem;
}

.consumption-arrow.expanded {
  transform: rotate(180deg);
}

.consumption-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.consumption-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.consumption-total {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
  font-weight: 600;
  color: #8b5cf6;
}

.consumption-label {
  font-size: 0.85rem;
  color: #6c757d;
}

.consumption-value {
  font-size: 0.85rem;
  color: #495057;
  font-weight: 500;
}

.generate-button {
  width: 100%;
  padding: 18px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
}

.generate-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
}

.generate-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 右侧结果展示区域 */
.result-panel {
  flex: 1;
  background: white;
  padding: 32px;
  display: flex;
  flex-direction: column;
  min-width: 400px;
}

.display-header {
  margin-bottom: 24px;
}

.display-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.display-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-state {
  text-align: center;
}

.loading-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-dots {
  display: flex;
  gap: 10px;
}

.loading-dots span {
  width: 14px;
  height: 14px;
  background: #8b5cf6;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.loading-text {
  color: #6c757d;
  font-size: 1rem;
  margin: 0;
}

.empty-state {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.palette-icon {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.palette-wood {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #d4a574 0%, #b8860b 100%);
  border-radius: 50%;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.paint-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.paint-dot.red {
  background: #ef4444;
  top: 8px;
  left: 15px;
}

.paint-dot.yellow {
  background: #f59e0b;
  top: 12px;
  right: 12px;
}

.paint-dot.green {
  background: #10b981;
  bottom: 20px;
  left: 10px;
}

.paint-dot.blue {
  background: #3b82f6;
  bottom: 15px;
  right: 18px;
}

.paint-dot.purple {
  background: #8b5cf6;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.empty-text {
  color: #6c757d;
  font-size: 1rem;
  margin: 0;
  max-width: 280px;
  line-height: 1.5;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  width: 100%;
  justify-items: center;
  padding: 20px;
}

/* 只有1张图片时居中显示，尺寸更大 */
.images-grid:has(.image-item:only-child) {
  grid-template-columns: 1fr;
  justify-items: center;
}

.images-grid:has(.image-item:only-child) .image-item {
  max-width: 500px;
}

.images-grid:has(.image-item:only-child) .generated-image {
  max-width: 500px;
  max-height: 500px;
}

/* 有2张图片时对称显示 */
.images-grid:has(.image-item:nth-child(2):last-child) {
  grid-template-columns: 1fr 1fr;
  justify-items: center;
}

/* 超过3个图片时使用更小的尺寸 */
.images-grid:has(.image-item:nth-child(4)) {
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.images-grid:has(.image-item:nth-child(4)) .image-item {
  max-width: 300px;
}

.images-grid:has(.image-item:nth-child(4)) .generated-image {
  max-width: 300px;
  max-height: 300px;
}

.image-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  max-width: 400px;
  width: 100%;
}

.image-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.generated-image {
  width: 100%;
  max-width: 400px;
  max-height: 400px;
  height: auto;
  display: block;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
  object-fit: contain;
}

.generated-image:hover {
  transform: scale(1.02);
}

.image-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-item:hover .image-actions {
  opacity: 1;
}

.download-button {
  padding: 8px 16px;
  background: rgba(139, 92, 246, 0.9);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.download-button:hover {
  background: #8b5cf6;
  transform: scale(1.05);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .text-to-image-container {
    flex-direction: column;
  }

  .sidebar-section {
    width: 100%;
    height: 80px;
    flex-direction: row;
    justify-content: center;
    padding: 0 20px;
  }

  .input-panel {
    max-width: none;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
  }

}

@media (max-width: 768px) {
  .input-panel {
    padding: 20px;
  }

  .result-panel {
    padding: 20px;
  }

  .panel-body {
    gap: 20px;
  }

  .images-grid {
    grid-template-columns: 1fr !important;
    gap: 20px;
    padding: 16px;
  }

  .image-item {
    max-width: 100%;
  }

  .palette-icon {
    width: 60px;
    height: 60px;
  }

  .palette-wood {
    width: 45px;
    height: 45px;
  }

  .paint-dot {
    width: 8px;
    height: 8px;
  }
}
</style>
