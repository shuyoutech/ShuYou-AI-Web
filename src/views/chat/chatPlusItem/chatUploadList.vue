<script setup>
import { ArrowLeft, ArrowRight, Close, Document, Loading, Picture } from '@element-plus/icons-vue'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import api from '@/utils/axios'

const _props = defineProps({
  fileList: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['remove', 'update:fileList', 'uploadComplete', 'uploadError'])

// 文件上传状态
const uploadStates = ref(new Map()) // 存储每个文件的上传状态
const uploadedFiles = ref(new Map()) // 存储上传成功后的文件信息

const showRightScrollIndicator = ref(false)
const showLeftScrollIndicator = ref(false)
const uploadListRef = ref(null)

// 判断是否为图片文件
function isImageFile(file) {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const extension = getFileExtension(file.name).toLowerCase()
  return imageTypes.includes(extension) || file.type.startsWith('image/')
}

// 获取文件扩展名
function getFileExtension(filename) {
  return filename.split('.').pop() || ''
}

// 获取图片类型
function getImageType(filename) {
  const extension = getFileExtension(filename).toLowerCase()
  const typeMap = {
    jpg: 'JPEG',
    jpeg: 'JPEG',
    png: 'PNG',
    gif: 'GIF',
    bmp: 'BMP',
    webp: 'WEBP',
    svg: 'SVG',
  }
  return typeMap[extension] || extension.toUpperCase()
}

// 截断文件名
function truncateFileName(filename) {
  if (filename.length <= 20) {
    return filename
  }
  return `${filename.substring(0, 17)}...`
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) {
    return '0B'
  }

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / k ** i).toFixed(2)) + sizes[i]
}

// 删除文件
function removeFile(index) {
  const file = _props.fileList[index]
  if (file) {
    // 清理上传状态和文件信息
    uploadStates.value.delete(file.name)
    uploadedFiles.value.delete(file.name)
  }
  emit('remove', index)
}

// 上传单个文件
async function uploadFile(file, index) {
  const fileKey = file.name
  try {
    // 设置上传状态
    uploadStates.value.set(fileKey, {
      status: 'uploading',
      progress: 0,
      error: null,
    })

    // 创建FormData对象
    const formData = new FormData()
    formData.append('file', file)

    // 调用上传API
    const response = await api({
      url: '/file/upload',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const fileInfo = response.data

    // 上传成功，更新状态
    uploadStates.value.set(fileKey, {
      status: 'success',
      progress: 100,
      error: null,
    })

    // 存储文件信息
    uploadedFiles.value.set(fileKey, {
      ...fileInfo,
      originalFile: file,
      index,
    })

    // 通知父组件上传完成
    emit('uploadComplete', {
      fileInfo,
      originalFile: file,
      index,
    })
  }
  catch (error) {
    console.error('文件上传失败:', error)

    // 上传失败，更新状态
    uploadStates.value.set(fileKey, {
      status: 'error',
      progress: 0,
      error: error.message || '上传失败',
    })

    // 通知父组件上传失败
    emit('uploadError', {
      file,
      error: error.message || '上传失败',
      index,
    })
  }
}

// 批量上传文件
async function uploadFiles(files) {
  for (let i = 0; i < files.length; i++) {
    await uploadFile(files[i], i)
  }
}

// 获取文件上传状态
function getUploadState(fileName) {
  return uploadStates.value.get(fileName) || { status: 'pending', progress: 0, error: null }
}

// 获取上传后的文件信息
function getUploadedFileInfo(fileName) {
  return uploadedFiles.value.get(fileName)
}

// 检查文件是否正在上传
function isUploading(fileName) {
  const state = getUploadState(fileName)
  return state.status === 'uploading'
}

// 检查文件是否上传成功
function isUploaded(fileName) {
  const state = getUploadState(fileName)
  return state.status === 'success'
}

// 检查文件是否上传失败
function isUploadError(fileName) {
  const state = getUploadState(fileName)
  return state.status === 'error'
}

// 滚动到右侧
function scrollToRight() {
  if (uploadListRef.value) {
    const container = uploadListRef.value
    const currentScroll = container.scrollLeft
    const scrollAmount = 120 // 进一步减少滚动距离
    const maxScroll = container.scrollWidth - container.clientWidth

    const targetScroll = Math.min(currentScroll + scrollAmount, maxScroll)

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    })

    // 立即更新状态，减少延迟
    setTimeout(() => {
      checkScrollIndicators()
    }, 150)
  }
}

// 滚动到左侧
function scrollToLeft() {
  if (uploadListRef.value) {
    const container = uploadListRef.value
    const currentScroll = container.scrollLeft
    const scrollAmount = 120 // 进一步减少滚动距离

    const targetScroll = Math.max(currentScroll - scrollAmount, 0)

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    })

    // 立即更新状态，减少延迟
    setTimeout(() => {
      checkScrollIndicators()
    }, 150)
  }
}

// 检测是否需要显示滚动指示器
function checkScrollIndicators() {
  nextTick(() => {
    if (uploadListRef.value) {
      const container = uploadListRef.value
      const containerWidth = container.clientWidth
      const scrollWidth = container.scrollWidth
      const currentScroll = container.scrollLeft
      const maxScroll = scrollWidth - containerWidth

      // 检查是否需要显示左右滚动指示器，使用更精确的阈值
      const canScrollRight = scrollWidth > containerWidth && currentScroll < maxScroll - 5
      const canScrollLeft = currentScroll > 5

      showRightScrollIndicator.value = canScrollRight
      showLeftScrollIndicator.value = canScrollLeft
    }
  })
}

// 组件挂载后检测
onMounted(() => {
  setTimeout(() => {
    checkScrollIndicators()
    // 添加滚动事件监听
    if (uploadListRef.value) {
      uploadListRef.value.addEventListener('scroll', checkScrollIndicators)
    }
  }, 100)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  if (uploadListRef.value) {
    uploadListRef.value.removeEventListener('scroll', checkScrollIndicators)
  }
})

// 监听文件列表变化
watch(() => _props.fileList.length, () => {
  setTimeout(() => {
    checkScrollIndicators()
  }, 100)
})

// 监听文件列表变化，自动开始上传新文件
watch(() => _props.fileList, (newList, oldList) => {
  if (newList.length > oldList.length) {
    // 有新文件添加，开始上传
    const newFiles = newList.slice(oldList.length)
    uploadFiles(newFiles)
  }
}, { deep: true })

// 获取所有已上传的文件，按类型分类
function getAllUploadedFiles() {
  const files = []
  const images = []

  uploadedFiles.value.forEach((fileInfo, fileName) => {
    const file = {
      ...fileInfo,
      fileName, // 添加原始文件名作为key
    }

    if (isImageFile(fileInfo.originalFile)) {
      images.push(file)
    }
    else {
      files.push(file)
    }
  })

  return {
    all: Array.from(uploadedFiles.value.values()),
    files, // 非图片文件
    images, // 图片文件
    count: {
      total: uploadedFiles.value.size,
      files: files.length,
      images: images.length,
    },
  }
}

// 获取指定类型的已上传文件
function getUploadedFilesByType(type) {
  const result = []

  uploadedFiles.value.forEach((fileInfo, fileName) => {
    const isImage = isImageFile(fileInfo.originalFile)

    if (type === 'image' && isImage) {
      result.push({
        ...fileInfo,
        fileName,
      })
    }
    else if (type === 'file' && !isImage) {
      result.push({
        ...fileInfo,
        fileName,
      })
    }
  })

  return result
}

// 暴露方法给父组件
defineExpose({
  uploadFiles,
  getUploadedFileInfo,
  getUploadState,
  isUploading,
  isUploaded,
  isUploadError,
  getAllUploadedFiles,
  getUploadedFilesByType,
})
</script>

<template>
  <div v-if="fileList.length > 0" class="upload-list-container">
    <!-- 文件列表容器 -->
    <div class="upload-list-wrapper">
      <!-- 左侧滚动指示器 -->
      <div v-if="showLeftScrollIndicator" class="scroll-indicator scroll-indicator-left" @click="scrollToLeft">
        <el-icon><ArrowLeft /></el-icon>
      </div>

      <div ref="uploadListRef" class="upload-list">
        <div
          v-for="(file, index) in fileList"
          :key="index"
          class="file-item"
        >
          <!-- 文件图标 -->
          <div class="file-icon">
            <el-icon v-if="isImageFile(file)" class="image-icon">
              <Picture />
            </el-icon>
            <el-icon v-else class="document-icon">
              <Document />
            </el-icon>
          </div>

          <!-- 文件信息 -->
          <div class="file-info">
            <div class="file-name" :title="file.name">
              {{ truncateFileName(file.name) }}
            </div>
            <div class="file-details">
              <!-- 上传中状态 -->
              <template v-if="isUploading(file.name)">
                <span class="upload-status uploading">
                  <el-icon class="loading-icon"><Loading /></el-icon>
                  上传中...
                </span>
              </template>
              <!-- 上传失败状态 -->
              <template v-else-if="isUploadError(file.name)">
                <span class="upload-status error">
                  上传失败
                </span>
              </template>
              <!-- 上传成功状态，显示文件信息 -->
              <template v-else-if="isUploaded(file.name)">
                <span v-if="isImageFile(file)" class="file-type">
                  {{ getImageType(file.name).toUpperCase() }}
                </span>
                <span v-else class="file-type">
                  {{ getFileExtension(file.name).toUpperCase() }}
                </span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </template>
              <!-- 待上传状态 -->
              <template v-else>
                <span class="upload-status pending">
                  等待上传...
                </span>
              </template>
            </div>
          </div>

          <!-- 删除按钮 -->
          <div class="file-actions">
            <el-icon
              class="delete-icon"
              title="删除文件"
              @click="removeFile(index)"
            >
              <Close />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 右侧滚动指示器 -->
      <div v-if="showRightScrollIndicator" class="scroll-indicator scroll-indicator-right" @click="scrollToRight">
        <el-icon><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.upload-list-container {
  width: 100%;
  background: white;
  border-radius: 12px;
  padding: 0 11px;
  margin: 12px 0;
}

.upload-list-header {
  margin-bottom: 12px;

  .header-text {
    font-size: 14px;
    color: #666;
    font-weight: 500;
  }
}

.upload-list-wrapper {
  display: flex;
  align-items: center;
  gap: 2px;
}

.upload-list {
  display: flex;
  gap: 12px;
  align-items: center;
  overflow-x: auto;
  padding-bottom: 4px;
  position: relative;
  flex: 1;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;

  /* 隐藏滚动条 - 兼容所有浏览器 */
  &::-webkit-scrollbar {
    display: none;
  }

  /* Firefox */
  scrollbar-width: none;

  /* IE and Edge */
  -ms-overflow-style: none;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 8px 10px;
  min-width: 160px;
  flex-shrink: 0;
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);

    .file-actions {
      opacity: 1;
    }
  }
}

.file-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;

  .image-icon {
    font-size: 28px;
    color: #67c23a;
    background: #f0f9ff;
    padding: 4px;
    border-radius: 4px;
  }

  .document-icon {
    font-size: 28px;
    color: #409eff;
    background: #f0f9ff;
    padding: 4px;
    border-radius: 4px;
  }
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.file-type {
  font-weight: 500;
  color: #409eff;
}

.file-size {
  color: #999;
}

.upload-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;

  &.uploading {
    color: #409eff;
  }

  &.error {
    color: #f56c6c;
  }

  &.pending {
    color: #909399;
  }

  .loading-icon {
    animation: rotate 1s linear infinite;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.file-actions {
  flex-shrink: 0;
  height: 20px;
  opacity: 0;
  transition: opacity 0.2s ease;

  .delete-icon {
    font-size: 22px;
    color: #f56c6c;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    transition: all 0.2s ease;
    margin-top: -1px;

    &:hover {
      background-color: #fef0f0;
      color: #f56c6c;
    }
  }
}

.scroll-indicator {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  font-size: 18px;
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
  border-radius: 50%;
  border: 1px solid rgba(64, 158, 255, 0.2);
  animation: pulse 2s infinite;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(90deg, rgba(64, 158, 255, 0.2) 0%, rgba(64, 158, 255, 0.1) 100%);
    border-color: rgba(64, 158, 255, 0.4);
    transform: scale(1.1);
    animation: none;
  }

  &:active {
    transform: scale(0.95);
  }
}

.scroll-indicator-left {
  margin-right: 8px;
}

.scroll-indicator-right {
  margin-left: 8px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .upload-list-container {
    margin: 8px 0;
    padding: 12px;
  }

  .file-item {
    min-width: 160px;
    padding: 8px;
    gap: 8px;
  }

  .file-icon {
    width: 28px;
    height: 28px;

    .image-icon,
    .document-icon {
      font-size: 16px;
      padding: 4px;
    }
  }

  .file-name {
    font-size: 13px;
  }

  .file-details {
    font-size: 11px;
  }
}
</style>
