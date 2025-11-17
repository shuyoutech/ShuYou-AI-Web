<script setup lang="ts">
import {ref, onMounted} from 'vue'
import Sidebar from "@/views/audio/sidebar.vue"
import {queryHotDataApi} from "@/api/api";
import type {ModelVo} from "@/api/ai/model/types.ts";
import type {AudioModelBo, AudioModelParam} from "@/api/ai/aigc/types.ts";
import {audioApi} from "@/api/ai/aigc";
import type {FileItem} from "@/ui/components/FaFileUpload/index.vue";

// 响应式数据
const isLoading = ref(false)
const analysisResult = ref<string | string[] | object | null>(null)
const showModelDropdown = ref(false)
const files = ref<FileItem[]>([])

// 加载页面
onMounted(() => {
  initData()
})

// 初始化数据
const initData = () => {
  loadAudioModelList()
}

// 加载语音识别模型列表
const modelList = ref<ModelVo[]>([])
// 选中的模型
const activeModel = ref<ModelVo>({})
const loadAudioModelList = () => {
  queryHotDataApi('ai_model_audioTranscription').then((res: any) => {
    modelList.value = res.data
    activeModel.value = res.data[0]
  })
}

// 表单验证
const validateForm = () => {
  if (!activeModel.value.id) {
    faToast.error('请选择模型')
    return false
  }
  if (!files.value) {
    faToast.error('请上传音频文件')
    return false
  }
  return true
}

// 提交语音识别
const submitTranscription = async () => {
  if (!validateForm()) return

  isLoading.value = true
  analysisResult.value = null
  try {
    let audioParam: AudioModelParam = {
      fileUrls: files.value?.map(item => String(item.url))
    }
    let requestData: AudioModelBo = {
      provider: activeModel.value.provider || '',
      model: activeModel.value.name || '',
      function: 'audioTranscription',
      params: audioParam
    }
    audioApi(requestData).then((res: any) => {
      if (res.code === 0) {
        analysisResult.value = res.data
        faToast.success(`成功语音识别`)
      } else {
        faToast.error('识别失败，请重试')
      }
      isLoading.value = false
    })
  } catch (error) {
    isLoading.value = false
    console.error('语音识别失败:', error)
    faToast.error('识别失败，请检查网络连接或稍后重试')
  }
}

// 格式化结果
const formatResult = (result: any) => {
  if (!result) return ''

  // 如果是字符串，尝试解析为JSON
  if (typeof result === 'string') {
    try {
      const parsed = JSON.parse(result)
      if (Array.isArray(parsed)) {
        return parsed.map(item => {
          if (typeof item === 'string') {
            // 清理特殊标记
            return item
              .replace(/<\|Speech\|>/g, '')
              .replace(/<\|ANGRY\|>/g, '')
              .replace(/<l\/Speech\|>/g, '')
              .replace(/<\|/g, '')
              .replace(/Speech\|>/g, '')
              .replace(/\/Speech\|>/g, '')
              .trim()
          }
          return item
        }).join('\n\n')
      }
      return JSON.stringify(parsed, null, 2)
    } catch {
      return result
    }
  }

  // 如果是对象，格式化JSON
  if (typeof result === 'object') {
    return JSON.stringify(result, null, 2)
  }

  return String(result)
}

// 复制识别结果
const copyResult = async () => {
  if (!analysisResult.value) return
  try {
    let textToCopy = formatResult(analysisResult.value)
    await navigator.clipboard.writeText(textToCopy)
    faToast.success('结果已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    faToast.error('复制失败')
  }
}


// 模型选择相关函数
const toggleModelDropdown = () => {
  showModelDropdown.value = !showModelDropdown.value
}

const selectModel = (model: ModelVo) => {
  Object.assign(activeModel, model)
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
        <div class="form-section">
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

        <!-- 音频文件上传 -->
        <div class="form-section">
          <label class="form-label">
            音频文件 (必选)
          </label>

          <!-- 上传区域 -->
          <div class="upload-area">
            <FaFileUpload
              v-model="files"
              action="/file/upload"
              :after-upload="(response) => response.data.fileUrl"
              multiple
              :ext="['mp3','mp4','avi','flv','wmv','wav']"
              :size="10 * 1024 * 1024"
              :max="5"
              class="custom-audio-upload"
            />
          </div>
        </div>
      </div>

      <!-- 识别参数设置 -->
      <div class="form-section submit-section">
        <!-- 提交按钮 -->
        <button
          @click="submitTranscription"
          :disabled="isLoading"
          class="generate-button"
          :class="{ 'loading': isLoading }"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? '识别中...' : '开始识别' }}
        </button>
      </div>
    </div>

    <!-- 右侧结果展示区域 -->
    <div class="result-panel">
      <div class="display-header">

        <h3 class="display-title">识别结果</h3>
      </div>

      <div class="display-content">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-animation">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p class="loading-text">AI正在识别语音中，请稍候...</p>
          </div>
        </div>

        <div v-else-if="!analysisResult" class="empty-state">
          <!-- 应用场景介绍 -->
          <div class="scenario-intro">
            <div class="scenario-header">
              <h4 class="scenario-title">🎙️ 应用场景</h4>
              <p class="scenario-desc">探索AI语音识别的强大功能</p>
            </div>

            <div class="scenario-grid">
              <div class="scenario-card">
                <div class="scenario-card-header">
                  <div class="scenario-icon-wrapper">
                    <div class="scenario-icon">📝</div>
                  </div>
                  <h5 class="scenario-card-title">会议记录</h5>
                </div>
                <p class="scenario-card-desc">将会议录音转换为文字记录，支持多语言识别和自动标点，提高会议效率。</p>
              </div>

              <div class="scenario-card">
                <div class="scenario-card-header">
                  <div class="scenario-icon-wrapper">
                    <div class="scenario-icon">🎓</div>
                  </div>
                  <h5 class="scenario-card-title">课堂转录</h5>
                </div>
                <p class="scenario-card-desc">将课堂录音转换为文字，帮助学生更好地复习和学习，支持字幕格式输出。</p>
              </div>

              <div class="scenario-card">
                <div class="scenario-card-header">
                  <div class="scenario-icon-wrapper">
                    <div class="scenario-icon">🎬</div>
                  </div>
                  <h5 class="scenario-card-title">视频字幕</h5>
                </div>
                <p class="scenario-card-desc">为视频内容自动生成字幕，支持时间戳和多种格式输出，提升视频可访问性。</p>
              </div>

              <div class="scenario-card">
                <div class="scenario-card-header">
                  <div class="scenario-icon-wrapper">
                    <div class="scenario-icon">📞</div>
                  </div>
                  <h5 class="scenario-card-title">通话记录</h5>
                </div>
                <p class="scenario-card-desc">将通话录音转换为文字记录，便于后续查阅和分析，支持多语言识别。</p>
              </div>

              <div class="scenario-card">
                <div class="scenario-card-header">
                  <div class="scenario-icon-wrapper">
                    <div class="scenario-icon">🎙️</div>
                  </div>
                  <h5 class="scenario-card-title">播客转录</h5>
                </div>
                <p class="scenario-card-desc">将播客音频转换为文字内容，便于搜索和分享，支持自动标点和格式优化。</p>
              </div>

              <div class="scenario-card">
                <div class="scenario-card-header">
                  <div class="scenario-icon-wrapper">
                    <div class="scenario-icon">🎵</div>
                  </div>
                  <h5 class="scenario-card-title">音乐歌词</h5>
                </div>
                <p class="scenario-card-desc">识别歌曲中的歌词内容，支持多语言和方言识别，为音乐爱好者提供便利。</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="result-content">
          <div class="result-box">
            <div class="result-header">
              <h4 class="result-title">🎙️ 语音识别结果</h4>
            </div>
            <div class="result-text">
              <pre class="result-formatted">{{ formatResult(analysisResult) }}</pre>
            </div>
            <div class="result-actions">
              <button @click="copyResult" class="copy-button">
                <span class="copy-icon">📋</span>
                复制结果
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.text-to-image-container {
  display: flex;
  min-height: calc(100vh - 101px);
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
  background: white;
  border-right: 1px solid #e9ecef;
  padding: 24px;
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
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 450px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

/* 音频上传样式 */
.audio-upload-input {
  display: none;
}

.audio-upload-placeholder {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #f9fafb;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.audio-upload-placeholder:hover {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

.upload-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.upload-hint {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

.audio-preview {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
}

.audio-preview:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
}

.audio-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.audio-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2c3e50;
}

.audio-size {
  font-size: 0.8rem;
  color: #6c757d;
}

.remove-audio {
  width: 24px;
  height: 24px;
  border: none;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  transition: all 0.3s ease;
}

.remove-audio:hover {
  background: #dc2626;
  transform: scale(1.1);
}

/* 参数设置样式 */
.param-settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 12px;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-select {
  padding: 10px 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.param-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.param-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #8b5cf6;
  cursor: pointer;
}

/* 提交按钮区域样式 */
.submit-section {
  margin-top: 24px;
}

/* 结果展示区域样式优化 */
.result-panel {
  margin-top: -30px;
}

.result-formatted {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 24px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #2c3e50;
  overflow-x: auto;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 音频上传组件样式 */
.custom-audio-upload :deep(.fa-file-upload) {
  width: 100%;
}

.custom-audio-upload :deep(.fa-file-upload__upload-area) {
  border: 2px dashed #d1d5db;
  border-radius: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transition: all 0.3s ease;
  min-height: 140px;
  position: relative;
  overflow: hidden;
}

.custom-audio-upload :deep(.fa-file-upload__upload-area::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(139, 92, 246, 0.05) 50%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.custom-audio-upload :deep(.fa-file-upload__upload-area:hover) {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.1) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.15);
}

.custom-audio-upload :deep(.fa-file-upload__upload-area:hover::before) {
  opacity: 1;
}

.custom-audio-upload :deep(.fa-file-upload__upload-icon) {
  color: #8b5cf6;
  font-size: 2.5rem;
  margin-bottom: 12px;
  filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.2));
}

.custom-audio-upload :deep(.fa-file-upload__upload-text) {
  color: #374151;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 8px;
}

.custom-audio-upload :deep(.fa-file-upload__upload-subtext) {
  color: #6b7280;
  font-size: 0.9rem;
}

/* 文件预览样式优化 */
.custom-audio-upload :deep(.fa-file-upload__preview-list) {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.custom-audio-upload :deep(.fa-file-upload__preview-item) {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.custom-audio-upload :deep(.fa-file-upload__preview-item:hover) {
  border-color: #8b5cf6;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
  transform: translateY(-1px);
}

.custom-audio-upload :deep(.fa-file-upload__preview-icon) {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.custom-audio-upload :deep(.fa-file-upload__preview-info) {
  flex: 1;
  min-width: 0;
}

.custom-audio-upload :deep(.fa-file-upload__preview-name) {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-audio-upload :deep(.fa-file-upload__preview-size) {
  color: #6b7280;
  font-size: 0.8rem;
}

.custom-audio-upload :deep(.fa-file-upload__preview-delete) {
  width: 32px;
  height: 32px;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.custom-audio-upload :deep(.fa-file-upload__preview-delete:hover) {
  background: #dc2626;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* 参考图片上传样式 */
.upload-area {
  position: relative;
  width: 100%;
}

/* FaImageUpload 组件自定义样式 */
.custom-image-upload {
  width: 100%;
}

/* 深度选择器修改 FaImageUpload 组件内部样式 */
.custom-image-upload :deep(.fa-image-upload) {
  width: 100%;
}

.custom-image-upload :deep(.fa-image-upload__upload-area) {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #f9fafb;
  transition: all 0.3s ease;
}

.custom-image-upload :deep(.fa-image-upload__upload-area:hover) {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

.custom-image-upload :deep(.fa-image-upload__upload-icon) {
  color: #8b5cf6;
}

.custom-image-upload :deep(.fa-image-upload__upload-text) {
  color: #374151;
}

.custom-image-upload :deep(.fa-image-upload__upload-subtext) {
  color: #6b7280;
}

/* 图片预览区域样式 */
.custom-image-upload :deep(.fa-image-upload__preview) {
  margin-top: 16px;
}

.custom-image-upload :deep(.fa-image-upload__preview-item) {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s ease;
}

.custom-image-upload :deep(.fa-image-upload__preview-item:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.custom-image-upload :deep(.fa-image-upload__preview-image) {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.custom-image-upload :deep(.fa-image-upload__preview-actions) {
  background: rgba(0, 0, 0, 0.7);
}

.custom-image-upload :deep(.fa-image-upload__preview-delete) {
  background: rgba(239, 68, 68, 0.9);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: white;
  transition: all 0.3s ease;
}

.custom-image-upload :deep(.fa-image-upload__preview-delete:hover) {
  background: #dc2626;
  transform: scale(1.1);
}

/* 网格布局优化 */
.custom-image-upload :deep(.fa-image-upload__preview-grid) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
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
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
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
  padding: 4px 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
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
  background: #8b5cf6;
  color: white;
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
  padding-top: 40px;
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


/* 应用场景介绍样式 */
.scenario-intro {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  margin-top: -40px;
}

.scenario-header {
  text-align: center;
  margin-bottom: 20px;
}

.scenario-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.scenario-desc {
  color: #6c757d;
  font-size: 0.95rem;
  margin: 0;
}

.scenario-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 0 20px;
}

.scenario-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.scenario-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.scenario-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.2);
}

.scenario-card:hover::before {
  transform: scaleX(1);
}

.scenario-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.scenario-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-radius: 10px;
  flex-shrink: 0;
}

.scenario-icon {
  font-size: 1.3rem;
}

.scenario-card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  line-height: 1.3;
  flex: 1;
}

.scenario-card-desc {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #6c757d;
  margin: 0;
}

/* 分析图标样式 */
.analysis-icon {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eye-icon {
  position: relative;
  width: 60px;
  height: 40px;
}

.eye-outer {
  width: 100%;
  height: 100%;
  border: 3px solid #8b5cf6;
  border-radius: 50%;
  position: relative;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
}

.eye-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: #8b5cf6;
  border-radius: 50%;
  animation: blink 3s infinite;
}

.pupil {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
}

@keyframes blink {
  0%, 90%, 100% {
    transform: translate(-50%, -50%) scaleY(1);
  }
  95% {
    transform: translate(-50%, -50%) scaleY(0.1);
  }
}

/* 结果展示框样式 */
.result-content {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.result-box {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.result-header {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-time {
  font-size: 0.85rem;
  opacity: 0.9;
}

.result-text {
  padding: 24px;
  line-height: 1.8;
  color: #2c3e50;
  font-size: 0.95rem;
}

.result-text p {
  margin: 0 0 16px 0;
}

.result-text p:last-child {
  margin-bottom: 0;
}

.result-json {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #495057;
  overflow-x: auto;
  margin: 0;
}

.result-actions {
  padding: 16px 24px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.copy-button:hover {
  background: #7c3aed;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.copy-icon {
  font-size: 1rem;
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

  .result-content {
    max-width: 100%;
  }

  .result-box {
    margin: 0 16px;
  }


  .scenario-intro {
    max-width: 100%;
  }

  .scenario-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 0 16px;
  }

  .scenario-card {
    padding: 20px;
  }

  .scenario-card-header {
    gap: 10px;
    margin-bottom: 12px;
  }

  .scenario-icon-wrapper {
    width: 36px;
    height: 36px;
  }

  .scenario-icon {
    font-size: 1.2rem;
  }

  .scenario-card-title {
    font-size: 1rem;
  }

  .scenario-card-desc {
    font-size: 0.85rem;
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

