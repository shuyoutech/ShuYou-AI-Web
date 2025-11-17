<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import Sidebar from '@/views/image/sidebar.vue'
import { imageMessagePageApi } from '@/api/ai/aigc'
import type { ImageMessageVo } from '@/api/ai/aigc/types'

// 图片列表数据
const imageList = ref<ImageMessageVo[]>([])
const loading = ref(false)
const total = ref(0)

// 分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 12,
  total: 0
})

// 加载图片列表
const loadImageList = async () => {
  loading.value = true
  try {
    const query = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      sort: 'requestTime',
      order: 'desc',
      query: {}
    }
    
    const response: any = await imageMessagePageApi(query)
    if (response.code === 0) {
      imageList.value = response.data.rows || []
      pagination.total = response.data.total || 0
      total.value = response.data.total || 0
    } else {
      faToast.error(response.msg || '加载图片列表失败')
    }
  } catch (error) {
    console.error('加载图片列表失败:', error)
    faToast.error('加载图片列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  loadImageList()
}

const handleCurrentChange = (page: number) => {
  pagination.pageNum = page
  loadImageList()
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

// 下载图片
const downloadImage = (imageUrl: string) => {
  if (imageUrl) {
    window.open(imageUrl, '_blank')
  }
}

// 预览图片
const previewImage = (imageUrl: string) => {
  if (imageUrl) {
    window.open(imageUrl, '_blank')
  }
}

// 初始化
onMounted(() => {
  loadImageList()
})
</script>

<template>
  <div class="my-images-container">
    <!-- 左侧导航栏 -->
    <div class="sidebar-section">
      <Sidebar />
    </div>

    <!-- 右侧内容区域 -->
    <div class="content-section">
      <div class="content-header">
        <h2 class="page-title">我的创作</h2>
        <p class="page-subtitle">查看您创作的所有图片</p>
      </div>

      <!-- 图片列表 -->
      <div v-loading="loading" class="image-list-container">
        <div v-if="imageList.length === 0 && !loading" class="empty-state">
          <div class="empty-icon">
            <FaIcon name="i-ri:image-line" />
          </div>
          <p class="empty-text">暂无创作图片</p>
          <p class="empty-hint">快去创作您的第一张图片吧！</p>
        </div>

        <div v-else class="image-grid">
          <div
            v-for="image in imageList"
            :key="image.id"
            class="image-card"
          >
            <div class="image-preview" @click="previewImage(image.imageUrls?.[0])">
              <img
                v-if="image.imageUrls && image.imageUrls.length > 0"
                :src="image.imageUrls[0]"
                :alt="`创作图片 ${image.id}`"
                class="image-item"
              />
              <div v-else class="image-placeholder">
                <FaIcon name="i-ri:image-line" />
                <span>图片加载中...</span>
              </div>
              <div v-if="image.imageNum > 1" class="image-count-badge">
                {{ image.imageNum }} 张
              </div>
            </div>
            <div class="image-info">
              <div class="image-meta">
                <div class="meta-item">
                  <FaIcon name="i-ri:time-line" />
                  <span>{{ formatTime(image.requestTime) }}</span>
                </div>
                <div v-if="image.modelName" class="meta-item">
                  <FaIcon name="i-ri:robot-line" />
                  <span>{{ image.modelName }}</span>
                </div>
                <div v-if="image.imageNum" class="meta-item">
                  <FaIcon name="i-ri:image-line" />
                  <span>{{ image.imageNum }} 张图片</span>
                </div>
              </div>
              <div class="image-actions">
                <button
                  v-for="(url, index) in image.imageUrls"
                  :key="index"
                  @click="downloadImage(url)"
                  class="action-button download-btn"
                >
                  <FaIcon name="i-ri:download-line" />
                  下载{{ image.imageUrls.length > 1 ? ` ${index + 1}` : '' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[12, 24, 48, 96]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.my-images-container {
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

/* 图片列表容器 */
.image-list-container {
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

/* 图片网格 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

/* 图片卡片 */
.image-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.image-preview {
  width: 100%;
  aspect-ratio: 1;
  background: #f8f9fa;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.image-item {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-preview:hover .image-item {
  transform: scale(1.05);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  gap: 12px;
  font-size: 1rem;
}

.image-placeholder :deep(.fa-icon) {
  font-size: 2rem;
  color: #adb5bd;
}

.image-count-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.image-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-meta {
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

.image-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #e9ecef;
  flex-wrap: wrap;
}

.action-button {
  flex: 1;
  min-width: 100px;
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
  padding: 24px 0;
  border-top: 1px solid #e9ecef;
  margin-top: 32px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .my-images-container {
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

  .image-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>

