<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from '@/views/audio/sidebar.vue'
import { audioMessagePageApi } from '@/api/ai/aigc'
import type { AudioMessageVo } from '@/api/ai/aigc/types'

// 音频列表数据
const audioList = ref<AudioMessageVo[]>([])
const loading = ref(false)

// 使用 composable 管理分页
const { pagination, onSizeChange, onCurrentChange } = usePagination()
pagination.value.pageSize = 10
pagination.value.sizes = [10, 20, 30, 50]
pagination.value.layout = 'total, sizes, prev, pager, next, jumper'

// 加载音频列表
const loadAudioList = async () => {
  loading.value = true
  try {
    const query = {
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize,
      sort: 'requestTime',
      order: 'desc',
      query: {}
    }

    const response: any = await audioMessagePageApi(query)
    if (response.code === 0) {
      audioList.value = response.data.rows || []
      pagination.value.total = response.data.total || 0
    } else {
      faToast.error(response.msg || '加载音频列表失败')
    }
  } catch (error) {
    console.error('加载音频列表失败:', error)
    faToast.error('加载音频列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 分页处理
const handleSizeChange = async (size: number) => {
  await onSizeChange(size)
  await loadAudioList()
}

const handleCurrentChange = async (page: number) => {
  await onCurrentChange(page)
  await loadAudioList()
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化时长
const formatDuration = (seconds: number) => {
  if (!seconds) return '0秒'
  if (seconds < 60) {
    return `${seconds}秒`
  }
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${minutes}分${secs}秒` : `${minutes}分`
}

// 下载音频
const downloadAudio = (audio: AudioMessageVo) => {
  if (audio.audioUrl) {
    window.open(audio.audioUrl, '_blank')
  }
}

// 播放音频
const playAudio = (audioUrl: string) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl)
    audio.play().catch(error => {
      console.error('播放音频失败:', error)
      faToast.error('播放音频失败')
    })
  }
}

// 初始化
onMounted(() => {
  loadAudioList()
})
</script>

<template>
  <div class="my-audios-container">
    <!-- 左侧导航栏 -->
    <div class="sidebar-section">
      <Sidebar />
    </div>

    <!-- 右侧内容区域 -->
    <div class="content-section">
      <div class="content-header">
        <h2 class="page-title">我的创作</h2>
        <p class="page-subtitle">查看您创作的所有音频</p>
      </div>

      <!-- 音频列表 -->
      <div v-loading="loading" class="audio-list-container">
        <div v-if="audioList.length === 0 && !loading" class="empty-state">
          <div class="empty-icon">
            <FaIcon name="i-ri:mic-line" />
          </div>
          <p class="empty-text">暂无创作音频</p>
          <p class="empty-hint">快去创作您的第一个音频吧！</p>
        </div>

        <div v-else class="audio-grid">
          <div
            v-for="audio in audioList"
            :key="audio.id"
            class="audio-card"
          >
            <div class="audio-preview">
              <div class="audio-player-wrapper">
                <audio
                  v-if="audio.audioUrl"
                  :src="audio.audioUrl"
                  controls
                  preload="metadata"
                  class="audio-player"
                >
                  您的浏览器不支持音频播放
                </audio>
                <div v-else class="audio-placeholder">
                  <FaIcon name="i-ri:music-line" />
                  <span>音频加载中...</span>
                </div>
              </div>
            </div>
            <div class="audio-info">
              <div class="audio-meta">
                <div class="meta-item">
                  <FaIcon name="i-ri:time-line" />
                  <span>{{ formatTime(audio.requestTime) }}</span>
                </div>
                <div v-if="audio.modelName" class="meta-item">
                  <FaIcon name="i-ri:robot-line" />
                  <span>{{ audio.modelName }}</span>
                </div>
                <div v-if="audio.durationSeconds" class="meta-item">
                  <FaIcon name="i-ri:play-circle-line" />
                  <span>{{ formatDuration(audio.durationSeconds) }}</span>
                </div>
              </div>
              <div class="audio-actions">
                <button
                  @click="downloadAudio(audio)"
                  class="action-button download-btn"
                  :disabled="!audio.audioUrl"
                >
                  <FaIcon name="i-ri:download-line" />
                  下载
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-show="pagination.total > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="pagination.sizes"
          :total="Number(pagination.total)"
          :layout="pagination.layout"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.my-audios-container {
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

/* 右侧内容区域 */
.content-section {
  flex: 1;
  height: calc(100vh - 101px);
  background: white;
  padding: 32px;
  overflow-y: auto;
}

.content-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 0.95rem;
  color: #6c757d;
  margin: 0;
}

/* 音频列表容器 */
.audio-list-container {
  min-height: 400px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: white;
  font-size: 2rem;
}

.empty-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.empty-hint {
  font-size: 0.95rem;
  color: #6c757d;
  margin: 0;
}

/* 音频网格 */
.audio-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 0;
}

/* 音频卡片 */
.audio-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
}

.audio-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.audio-preview {
  width: 100%;
  padding: 24px;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
  position: relative;
}

.audio-player-wrapper {
  width: 100%;
}

.audio-player {
  width: 100%;
  height: 40px;
  border-radius: 8px;
}

.audio-placeholder {
  width: 100%;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  gap: 12px;
  font-size: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.audio-placeholder :deep(.fa-icon) {
  font-size: 2rem;
  color: #adb5bd;
}

.audio-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.audio-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #6c757d;
}

.meta-item :deep(.fa-icon) {
  font-size: 1rem;
  color: #adb5bd;
}

.audio-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #e9ecef;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.download-btn {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.download-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
}

.download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 分页容器 */
.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px 0;
  border-top: 2px solid #e9ecef;
  margin-top: 0;
  background: #fff;
  min-height: 80px;

  :deep(.el-pagination) {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

/* 响应式设计 */
@media (max-width: 1600px) {
  .audio-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1200px) {
  .audio-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .my-audios-container {
    flex-direction: column;
  }

  .sidebar-section {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
  }

  .content-section {
    padding: 20px;
  }

  .audio-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>

