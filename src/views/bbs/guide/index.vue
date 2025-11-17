<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import {gameHotListApi} from "@/api/game";
import type {GameVo} from "@/api/game/types.ts";
import {dictOptionsApi} from "@/api/common";
import {postPageApi} from "@/api/bbs/post";
import type {PostQuery, PostVo} from "@/api/bbs/post/types.ts";

const router = useRouter()

// 外形列表数据
const skinList = reactive<PostVo[]>([]);
const skinCount = ref(0)

const postQuery = reactive<PageQuery<PostQuery>>({
  pageNum: 1,
  pageSize: 15,
  sort: 'createTime',
  order: 'desc',
  query: {
    gameId: '',
    tags: [],
  }
})

const viewSkin = (skin: PostVo) => {
  // 跳转到外形详情页面
  router.push(`/guide/detail/${skin.id}`)
}

// 移除点赞功能，保持列表简洁

const handleSizeChange = (pageSize: number) => {
  postQuery.pageSize = pageSize
  postQuery.pageNum = 1
  handleSearch()
}

const handleCurrentChange = (pageNum: number) => {
  postQuery.pageNum = pageNum
  handleSearch()
}

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// 从content中提取第一张图片
const extractFirstImage = (content: string) => {
  if (!content) return null

  // 匹配img标签的src属性
  const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/i
  const match = content.match(imgRegex)

  if (match && match[1]) {
    return match[1]
  }

  // 如果没有找到img标签，尝试匹配其他可能的图片格式
  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp))/i
  const urlMatch = content.match(urlRegex)

  if (urlMatch && urlMatch[1]) {
    return urlMatch[1]
  }

  return null
}

// 清理HTML内容，移除标签和实体符号
const cleanHtmlContent = (content: string) => {
  if (!content) return '暂无内容预览'

  // 移除HTML标签
  let cleanContent = content.replace(/<[^>]*>/g, '')

  // 替换HTML实体符号
  cleanContent = cleanContent
    .replace(/&nbsp;/g, ' ')           // 非断行空格
    .replace(/&amp;/g, '&')            // &符号
    .replace(/&lt;/g, '<')             // 小于号
    .replace(/&gt;/g, '>')             // 大于号
    .replace(/&quot;/g, '"')           // 双引号
    .replace(/&#39;/g, "'")            // 单引号
    .replace(/&apos;/g, "'")           // 单引号
    .replace(/&hellip;/g, '...')       // 省略号
    .replace(/&mdash;/g, '—')          // 长破折号
    .replace(/&ndash;/g, '–')          // 短破折号
    .replace(/&copy;/g, '©')           // 版权符号
    .replace(/&reg;/g, '®')            // 注册商标
    .replace(/&trade;/g, '™')          // 商标符号

  // 清理多余的空格和换行
  cleanContent = cleanContent
    .replace(/\s+/g, ' ')              // 多个空格替换为单个空格
    .replace(/\n\s*\n/g, '\n')         // 多个换行替换为单个换行
    .trim()                            // 去除首尾空格

  // 截取前100个字符
  if (cleanContent.length > 100) {
    cleanContent = cleanContent.substring(0, 100) + '...'
  }

  return cleanContent
}

// 游戏选择相关方法
const toggleGame = (gameId: string) => {
  if (postQuery.query.gameId && postQuery.query.gameId === gameId) {
    postQuery.query.gameId = ''
  } else {
    postQuery.query.gameId = gameId
  }
  handleSearch()
}

// 标签选择相关方法
const toggleType = (value: string) => {
  if (postQuery.query.tags) {
    const index = postQuery.query.tags.indexOf(value)
    if (index > -1) {
      postQuery.query.tags.splice(index, 1)
    } else {
      postQuery.query.tags.push(value)
    }
    handleSearch()
  }
}

// 加载游戏
const gameList = ref<GameVo[]>();
const loadGames = () => {
  gameHotListApi().then(({data}) => {
    gameList.value = data;
  });
}

// 加载外形标签
const typeList = ref<Options[]>();
const loadSkinTypes = () => {
  dictOptionsApi("bbs_guide_type").then(({data}) => {
    typeList.value = data;
  })
}

const handSort = (sort: string) => {
  postQuery.sort = sort
  handleSearch()
}

// 查询外形列表
const handleSearch = () => {
  postQuery.query.plate = 'guide' // 攻略专区使用plate=guide
  skinList.length = 0
  skinCount.value = 0
  postPageApi(postQuery).then(({data}) => {
    Object.assign(skinList, data.rows)
    skinCount.value = Number(data.total)
  });
}

// 跳转到上传外形页面
const goToUpload = () => {
  router.push('/guide-upload')
}

onMounted(() => {
  loadGames()
  loadSkinTypes()
  handleSearch()
})
</script>


<template>
  <div class="skin-design-container">
    <!-- 筛选和搜索区域 -->
    <div class="filter-section">
      <div class="filter-content">
        <!-- 第一排：热门游戏选择 -->
        <div class="game-selector">
          <div class="game-section">
            <span class="game-label">游戏</span>
            <div class="game-buttons">
              <button
                v-for="game in gameList"
                :key="game.id"
                :class="['game-btn', { active: postQuery.query.gameId === game.id }]"
                @click="toggleGame(game.id)"
              >
                <img :src="game.icon" :alt="game.name" class="game-btn-icon"/>
                <span class="game-btn-text">{{ game.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 第二排：分类筛选标签 -->
        <div class="category-selector">
          <span class="category-label">标签&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <div class="tag-buttons">
            <button
              v-for="type in typeList"
              :key="type.value"
              :class="['tag-btn', { active: postQuery.query.tags?.includes(type.value) }]"
              @click="toggleType(type.value)"
            >
              <span class="tag-btn-text">{{ type.label }}</span>
            </button>
          </div>
        </div>

        <!-- 第三排：搜索和排序 -->
        <div class="search-filter-row">
          <div class="search-box">
            <input
              v-model="postQuery.query.title"
              type="text"
              placeholder="搜索攻略..."
              class="search-input"
              @change="handleSearch"
            />
          </div>
          <div class="sort-upload-group">
            <div class="sort-buttons">
              <button
                :class="['sort-btn', { active: postQuery.sort === 'createTime' }]"
                @click="handSort('createTime')"
              >
                <FaIcon name="i-mdi:clock-outline" class="sort-icon"/>
                <span>最新</span>
              </button>
              <button
                :class="['sort-btn', { active: postQuery.sort === 'likeCount' }]"
                @click="handSort('likeCount')"
              >
                <FaIcon name="i-mdi:fire" class="sort-icon"/>
                <span>最热</span>
              </button>
            </div>
            <div class="header-actions">
              <button class="btn btn-primary" @click="goToUpload">
                <FaIcon name="i-mdi:plus"/>
                发布攻略
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <div class="content-wrapper">
        <!-- 内容区 -->
        <div class="content-main">
          <!-- 攻略列表 -->
          <div class="guide-list">
            <div
              v-for="(guide, index) in skinList"
              :key="guide.id"
              class="guide-item"
              @click="viewSkin(guide)"
            >
              <!-- 左侧序号 -->
              <div class="guide-number">{{ skinList.length - index }}</div>

              <!-- 中间内容区 -->
              <div class="guide-content">
                <!-- 标题和标签 -->
                <div class="guide-header">
                  <h3 class="guide-title">{{ guide.title }}</h3>
                  <div class="guide-badges">
                    <span v-if="guide.isSticky" class="badge sticky">置顶</span>
                    <span v-if="guide.isFeatured" class="badge featured">精</span>
                  </div>
                </div>

                <!-- 内容预览 -->
                <div class="guide-preview">
                  {{ cleanHtmlContent(guide.content) }}
                </div>

                <!-- 图片预览 -->
                <div v-if="extractFirstImage(guide.content)" class="guide-images">
                  <img :src="extractFirstImage(guide.content)" :alt="guide.title" class="preview-image"/>
                </div>
              </div>

              <!-- 右侧信息 -->
              <div class="guide-meta">
                <div class="author-info">
                  <img :src="guide.userAvatar" :alt="guide.userName" class="author-avatar"/>
                  <span class="author-name">{{ guide.userName }}</span>
                </div>
                <div class="post-time">{{ guide.createTimeFormat }}</div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div class="pagination-container">
            <ElPagination :current-page="postQuery.pageNum"
                          :total="skinCount"
                          :page-size="postQuery.pageSize"
                          :page-sizes="[15, 30, 45]"
                          layout="total, sizes, prev, pager, next, jumper"
                          class="pagination"
                          background
                          @current-change="handleCurrentChange"
                          @size-change="handleSizeChange"/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skin-design-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.sort-upload-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-section {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  padding: 8px 0;
}

.filter-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 8px;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 400px;
  max-width: 800px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #909399;
  font-size: 20px;
}

.search-input {
  width: 80%;
  padding: 12px 16px 12px 12px;
  border: 2px solid #e4e7ed;
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  outline: none;
  border-color: #409eff;
  background: white;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
}

.filter-tabs {
  display: flex;
  gap: 12px;
  flex-wrap: nowrap;
  justify-content: flex-start;
  overflow-x: auto;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 2px solid #e4e7ed;
  background: white;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  justify-content: center;
  flex-shrink: 0;
  min-width: 120px;
}

.filter-tab:hover {
  background: #f8f9fa;
  border-color: #c0c4cc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.filter-tab.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 全部按钮的标签样式 */
.filter-tab.tag-like {
  background: #f0f9ff;
  color: #409eff;
  border: 1px solid #b3d8ff;
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  min-width: 50px;
  box-shadow: none;
  transform: none;
}

.filter-tab.tag-like:hover {
  background: #e1f5fe;
  border-color: #81d4fa;
  transform: none;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.filter-tab.tag-like.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
  transform: none;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}


/* 游戏选择按钮样式 */
.game-selector {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 8px;
}

.game-section {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  width: 100%;
  justify-content: flex-start;
}

.game-label {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  flex-shrink: 0;
}

.game-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: nowrap;
  justify-content: flex-start;
  padding: 8px 0;
  overflow-x: auto;
}

.game-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 2px solid #e4e7ed;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  justify-content: center;
  flex-shrink: 0;
  min-width: 80px;
  max-width: 120px;
}

.game-btn:hover {
  background: #f8f9fa;
  border-color: #c0c4cc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.game-btn.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.game-btn-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.game-btn-text {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  text-align: center;
}

/* 分类选择器样式 */
.category-selector {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 8px;
}

/* 标签按钮容器样式 */
.tag-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  justify-content: flex-start;
  padding: 8px 0;
  overflow-x: auto;
}

/* 标签按钮样式 */
.tag-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #e4e7ed;
  background: #f8f9fa;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  justify-content: center;
  flex-shrink: 0;
  min-width: 60px;
}

.tag-btn:hover {
  background: #e9ecef;
  border-color: #c0c4cc;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.tag-btn.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.tag-btn-text {
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  text-align: center;
}

/* 排序按钮样式 */
.sort-buttons {
  display: flex;
  align-items: center;
  border: 2px solid #e4e7ed;
  border-radius: 25px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  background: white;
  color: #909399;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
  font-weight: 500;
  border-right: 1px solid #e4e7ed;
  min-width: 70px;
  justify-content: center;
}

.sort-btn:last-child {
  border-right: none;
}

.sort-btn:hover {
  background: #f8f9fa;
  color: #606266;
  transform: translateY(-1px);
}

.sort-btn.active {
  background: #409eff;
  color: white;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.sort-icon {
  font-size: 16px;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
}

.content-wrapper {
  display: block;
}

.content-main {
  background: white;
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #d9d9d9;
  overflow: hidden;
}

/* 攻略列表样式 - 参考贴吧设计 */
.guide-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.guide-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #d9d9d9;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.guide-item:last-child {
  border-bottom: none;
}

.guide-item:hover {
  background-color: #f8f9fa;
}

.guide-item:last-child {
  border-bottom: none;
}

/* 左侧序号 */
.guide-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  flex-shrink: 0;
}

/* 中间内容区 */
.guide-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.guide-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.guide-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e88e5;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
  cursor: pointer;
  transition: color 0.2s ease;
}

.guide-title:hover {
  color: #1565c0;
  text-decoration: underline;
}

.guide-badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.badge.sticky {
  background: #409eff;
  color: white;
}

.badge.featured {
  background: #f56c6c;
  color: white;
}

.guide-preview {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}

.guide-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

/* 右侧信息 */
.guide-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 120px;
  flex-shrink: 0;
}

.guide-meta .author-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.guide-meta .author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: contain;
  background-color: #f5f5f5;
  padding: 1px;
}

.guide-meta .author-name {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.post-time {
  font-size: 12px;
  color: #999;
}

/* 右下角点赞按钮样式 */
.corner-like {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.corner-like:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.like-icon {
  font-size: 16px;
  color: #999;
  transition: all 0.3s ease;
}

.like-icon.liked {
  color: #ff4757;
  animation: heartBeat 0.6s ease-in-out;
}

@keyframes heartBeat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.3);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.3);
  }
  70% {
    transform: scale(1);
  }
}

.pagination-container {
  padding: 20px;
  background: white;
  border-top: 1px solid #e8e8e8;
}

.pagination {
  display: flex;
  justify-content: center;
}


.work-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.modal-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.modal-image {
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.modal-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-info {
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.modal-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-author-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.modal-author-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-author-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.modal-author-level {
  font-size: 12px;
  color: #409eff;
  background: #f0f9ff;
  padding: 2px 8px;
  border-radius: 10px;
  width: fit-content;
}

.modal-description {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.modal-stats {
  display: flex;
  gap: 20px;
}

.modal-stats .stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: white;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  border-radius: 20px;
  padding: 10px 20px;
  font-weight: 600;
  font-size: 14px;
  min-width: 120px;
  justify-content: center;
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.5);
  background: linear-gradient(135deg, #337ecc, #2c6bb3);
}

.btn-secondary {
  background: white;
  color: #606266;
  border: 2px solid #dcdfe6;
}

.btn-secondary:hover {
  background: #f5f7fa;
  border-color: #c0c4cc;
}

@media (max-width: 768px) {
  .bbs-header .header-content {
    padding: 0 10px;
  }

  .bbs-header .logo {
    margin-left: 0;
  }

  .bbs-header .nav-menu {
    display: none;
  }

  .page-header {
    top: 60px;
  }

  .content-wrapper {
    display: block;
  }

  .header-content {
    flex-direction: column;
    height: auto;
    padding: 16px 20px;
    gap: 16px;
  }

  .filter-content {
    gap: 12px;
  }

  .search-filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .search-box {
    min-width: auto;
  }

  .sort-buttons {
    justify-content: center;
  }

  .sort-btn {
    flex: 1;
    justify-content: center;
  }

  .game-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .category-selector {
    justify-content: flex-start;
  }

  .game-label {
    font-size: 13px;
  }

  .game-buttons {
    gap: 6px;
  }

  .game-btn {
    padding: 6px 12px;
    font-size: 13px;
  }

  .game-btn-icon {
    width: 18px;
    height: 18px;
  }

  .guide-item {
    flex-direction: column;
    gap: 8px;
    padding: 12px 0;
  }

  .guide-number {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }

  .guide-meta {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    min-width: auto;
    width: 100%;
  }

  .guide-meta .author-info {
    margin-bottom: 0;
  }

  .modal-body {
    grid-template-columns: 1fr;
  }

  .modal-info {
    padding: 20px;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
