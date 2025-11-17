<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue'
import Sidebar from "@/views/video/sidebar.vue"
import {queryHotDataApi} from "@/api/api";
import type {ModelParameters, ModelPrice, ModelVo} from "@/api/ai/model/types.ts";
import {videoApi} from "@/api/ai/aigc";
import type {VideoModelBo, VideoModelParam} from "@/api/ai/aigc/types.ts";

// 响应式数据
const isLoading = ref(false)
const generatedVideo = ref<string>('')
const showModelDropdown = ref(false)

// 加载页面
onMounted(() => {
  initData()
})

// 初始化数据
const initData = () => {
  loadVideoModelList()
}

// 加载文生视频模型列表
const modelList = ref<ModelVo[]>([])
// 选中的模型
const activeModel = ref<ModelVo>({})
// 解析模型支持类型
const modelParams = ref<ModelParameters>({})
// 解析模型价格
const modelPrice = ref<ModelPrice>({})
// 输出视频分辨率选项
const sizeOptions = ref<string[]>([])
// 视频时长下拉框
const durationOptions = ref<number[]>([])
const loadVideoModelList = () => {
  queryHotDataApi('ai_model_textToVideo').then((res: any) => {
    modelList.value = res.data
    selectModel(res.data[0])
  })
}

// 表单数据
const formData = reactive({
  prompt: '',
  negativePrompt: '',
  size: '',
  duration: 0,
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
  generatedVideo.value = ''
  try {
    let videoParam: VideoModelParam = {
      prompt: formData.prompt,
      negativePrompt: formData.negativePrompt,
      duration: formData.duration,
      size: formData.size,
      seed: formData.seed,
      promptExtend: formData.promptExtend,
      watermark: formData.watermark,
    }
    let requestData: VideoModelBo = {
      provider: activeModel.value.provider || '',
      model: activeModel.value.name || '',
      function: 'textToVideo',
      params: videoParam
    }
    videoApi(requestData).then((res: any) => {
      if (res.code === 0) {
        generatedVideo.value = res.data
        faToast.success(`成功生成视频`)
      } else {
        faToast.error('生成失败，请重试')
      }
      isLoading.value = false
    })
  } catch (error) {
    isLoading.value = false
    console.error('生成视频失败:', error)
    faToast.error('生成失败，请检查网络连接或稍后重试')
  }
}

const calCredits = computed(() => {
  if (modelPrice.value.credit && modelPrice.value.credit > 0) {
    return modelPrice.value.credit * formData.duration
  }
  if (modelPrice.value.conditions) {
    for (let condition of modelPrice.value.conditions) {
      if (formData.size === condition.fieldValues) {
        return condition.credit * formData.duration
      }
    }
  }
  return 0
})

// 视频加载完成事件
const onVideoLoaded = () => {
  console.log('视频加载完成')
}

// 下载视频
const downloadVideo = () => {
  if (generatedVideo.value) {
    // 在新标签页中打开视频链接
    window.open(generatedVideo.value, '_blank')
  }
}

// 分享视频
const shareVideo = async () => {
  if (generatedVideo.value) {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'AI生成的视频',
          text: '看看我用AI生成的视频！',
          url: generatedVideo.value
        })
      } else {
        // 复制链接到剪贴板
        await navigator.clipboard.writeText(generatedVideo.value)
        faToast.success('视频链接已复制到剪贴板')
      }
    } catch (error) {
      console.error('分享失败:', error)
      faToast.error('分享失败，请稍后重试')
    }
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
  if (modelParams.value.durations) {
    durationOptions.value = modelParams.value.durations.map(item => Number(item.trim()))
    formData.duration = durationOptions.value[0]
  } else {
    durationOptions.value = []
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
            <textarea
              v-model="formData.prompt"
              class="prompt-input"
              placeholder="请描述你想生成的视频内容"
              rows="4"
            />
          </div>

          <!-- 反向提示词 -->
          <div v-show="modelParams.supports?.includes('negativePrompt')" class="form-section">
            <label class="form-label">
              反向提示词 (可选)
            </label>
            <textarea
              v-model="formData.negativePrompt"
              class="prompt-input"
              placeholder="描述你不希望在视频中看到的内容"
              rows="3"
            />
          </div>

          <!-- 参数设置 -->
          <div class="settings-section">
            <!-- 第一行：分辨率选择 -->
            <div class="setting-row setting-row-size">
              <div class="size-selector">
                <div class="size-header">
                  <span class="size-title">视频分辨率</span>
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

            <!-- 第二行：视频时长选择 -->
            <div class="setting-row setting-row-count">
              <div class="count-selector">
                <div class="count-header">
                  <span class="count-title">视频时长</span>
                </div>
                <div class="count-options">
                  <button
                    v-for="option in durationOptions"
                    :key="option"
                    :class="[
                      'count-option',
                      { 'count-option-selected': formData.duration === Number(option) }
                    ]"
                    @click="formData.duration = Number(option)"
                  >
                    {{ option }}s
                  </button>
                </div>
              </div>
            </div>

            <!-- 第三行：随机种子 -->
            <div v-show="modelParams.supports?.includes('seed')" class="setting-row setting-row-seed">
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

            <!-- 第四行 智能提示词 水印标识-->
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
            <p class="loading-text">AI正在创作视频中，请稍候...</p>
          </div>
        </div>

        <div v-else-if="generatedVideo" class="video-result">
          <div class="video-container">
            <video
              :src="generatedVideo"
              controls
              preload="metadata"
              class="generated-video"
              @loadedmetadata="onVideoLoaded"
            >
              您的浏览器不支持视频播放
            </video>
            <div class="video-actions">
              <button @click="downloadVideo" class="download-button">
                <FaIcon name="i-ri:download-line"/>
                下载视频
              </button>
              <button @click="shareVideo" class="share-button">
                <FaIcon name="i-ri:share-line"/>
                分享视频
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="video-icon">
            <div class="play-button">
              <div class="play-triangle"></div>
            </div>
          </div>
          <p class="empty-text">输入创意描述，开始生成您的专属视频</p>
        </div>
      </div>
    </div>
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
  width: 255px;
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
  padding: 24px 24px 0;
  overflow-y: auto;
  max-width: 500px;
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
  margin-bottom: 8px;
}

.form-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #495057;
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
  padding: 8px;
  border: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  gap: 0;
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
  padding: 2px 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  margin-bottom: 2px;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
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
  height: 40px;
  justify-content: center;
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

/* 数量选择器样式 */
.setting-row-count {
  height: auto !important;
  min-height: auto;
  padding: 2px 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  margin-bottom: 2px;
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

.count-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
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

.count-options {
  display: flex;
  gap: 8px;
}

.count-option {
  padding: 8px 16px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  color: #2c3e50;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

.count-option:hover {
  border-color: #8b5cf6;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
}

.count-option-selected {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
  color: #8b5cf6;
  font-weight: 600;
}

/* 随机种子选择器样式 */
.setting-row-seed {
  height: auto !important;
  min-height: auto;
  padding: 2px 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
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
    max-width: 500px;
  }

  .images-grid:has(.image-item:only-child) .generated-image {
    max-width: 500px;
  }

  .images-grid:has(.image-item:nth-child(4)) .image-item {
    max-width: 100%;
  }

  .images-grid:has(.image-item:nth-child(4)) .generated-image {
    max-width: 100%;
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

/* 视频结果展示样式 */
.video-result {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
}

.video-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  max-width: 800px;
  width: 100%;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.1);
}

.generated-video {
  width: 100%;
  max-width: 750px;
  height: auto;
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  background: #000;
  transition: all 0.3s ease;
  border: 3px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
}

.generated-video:hover {
  transform: scale(1.02);
  box-shadow: 0 16px 60px rgba(0, 0, 0, 0.3);
  border-color: rgba(139, 92, 246, 0.3);
}

.video-actions {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.video-actions .download-button,
.video-actions .share-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.video-actions .download-button {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.video-actions .download-button:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 35px rgba(139, 92, 246, 0.5);
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
}

.video-actions .share-button {
  background: rgba(255, 255, 255, 0.9);
  color: #8b5cf6;
  border: 2px solid #8b5cf6;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.2);
}

.video-actions .share-button:hover {
  background: #8b5cf6;
  color: white;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
  border-color: #7c3aed;
}

/* 空状态视频图标样式 */
.video-icon {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-button {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-button:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.4);
}

.play-triangle {
  width: 0;
  height: 0;
  border-left: 18px solid white;
  border-top: 12px solid transparent;
  border-bottom: 12px solid transparent;
  margin-left: 4px;
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
  max-width: 700px;
}

.images-grid:has(.image-item:only-child) .generated-image {
  max-width: 700px;
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
  max-width: 350px;
}

.images-grid:has(.image-item:nth-child(4)) .generated-image {
  max-width: 350px;
}

.image-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  max-width: 500px;
  width: 100%;
}

.image-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.generated-image {
  width: 100%;
  max-width: 500px;
  height: auto;
  display: block;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
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

/* 中等屏幕优化 */
@media (max-width: 1200px) {
  .video-container {
    max-width: 100%;
    padding: 20px;
  }

  .generated-video {
    max-width: 100%;
  }

  .video-actions {
    gap: 16px;
  }

  .video-actions .download-button,
  .video-actions .share-button {
    padding: 14px 28px;
    min-width: 120px;
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

  .video-result {
    padding: 12px;
  }

  .video-container {
    padding: 16px;
    gap: 20px;
  }

  .generated-video {
    max-width: 100%;
    border-radius: 12px;
  }

  .video-actions {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .video-actions .download-button,
  .video-actions .share-button {
    width: 100%;
    padding: 16px 24px;
    min-width: auto;
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
