<template>
  <div class="bbs-container">
    <!-- 主要内容区域 -->
    <div class="bbs-main">
      <div class="main-content">
        <!-- 左侧内容区 -->
        <div class="content-left">
          <!-- 轮播图 -->
          <div class="banner-section">
            <el-carousel height="200px" indicator-position="outside">
              <el-carousel-item v-for="banner in banners" :key="banner.id">
                <img :src="banner.image" :alt="banner.title" class="banner-image"/>
              </el-carousel-item>
            </el-carousel>
          </div>

          <!-- 帖子列表 -->
          <div class="posts-section">
            <div class="section-header">
              <h2>最新帖子</h2>
              <div class="filter-tabs">
                <button
                  v-for="tab in filterTabs"
                  :key="tab.key"
                  :class="['filter-tab', { active: currentFilter === tab.key }]"
                  @click="currentFilter = tab.key"
                >
                  {{ tab.label }}
                </button>
              </div>
            </div>

            <div class="posts-list">
              <div
                v-for="post in filteredPosts"
                :key="post.id"
                class="post-item"
                @click="viewPost(post.id)"
              >
                <div class="post-avatar">
                  <img :src="post.author.avatar" :alt="post.author.nickname"/>
                </div>
                <div class="post-content">
                  <div class="post-title">{{ post.title }}</div>
                  <div class="post-meta">
                    <span class="author">{{ post.author.nickname }}</span>
                    <span class="time">{{ formatTime(post.createTime) }}</span>
                    <span class="category">{{ getCategoryName(post.category) }}</span>
                  </div>
                  <div class="post-preview">{{ post.content }}</div>
                </div>
                <div class="post-stats">
                  <div class="stat-item">
                    <i class="icon-view">👁</i>
                    <span>{{ post.viewCount }}</span>
                  </div>
                  <div class="stat-item">
                    <i class="icon-comment">💬</i>
                    <span>{{ post.commentCount }}</span>
                  </div>
                  <div class="stat-item">
                    <i class="icon-like">❤</i>
                    <span>{{ post.likeCount }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分页 -->
            <div class="pagination">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="totalPosts"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </div>
        </div>

        <!-- 右侧边栏 -->
        <div class="sidebar-right">
          <!-- 热门帖子 -->
          <div class="sidebar-section">
            <h3>热门帖子</h3>
            <div class="hot-posts">
              <div
                v-for="post in hotPosts"
                :key="post.id"
                class="hot-post-item"
                @click="viewPost(post.id)"
              >
                <div class="hot-post-title">{{ post.title }}</div>
                <div class="hot-post-stats">
                  <span>{{ post.viewCount }} 浏览</span>
                  <span>{{ post.commentCount }} 回复</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 活跃用户 -->
          <div class="sidebar-section">
            <h3>活跃用户</h3>
            <div class="active-users">
              <div
                v-for="user in activeUsers"
                :key="user.id"
                class="active-user-item"
              >
                <img :src="user.avatar" :alt="user.nickname" class="user-avatar-small"/>
                <span class="user-name-small">{{ user.nickname }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 响应式数据
const currentFilter = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)

const totalPosts = ref(0)
const hotPosts = ref<any[]>([])
const activeUsers = ref<any[]>([])
const banners = ref([
  {
    id: '1',
    title: '新版本更新公告',
    image: 'https://picsum.photos/800/300?random=1',
    link: '/bbs/post/1',
    sort: 1,
  },
  {
    id: '2',
    title: '攻略征集活动',
    image: 'https://picsum.photos/800/300?random=2',
    link: '/bbs/post/2',
    sort: 2,
  },
])

// 模拟帖子数据
const mockPosts = ref([
  {
    id: '1',
    title: '欢迎来到书友论坛！',
    content: '这是一个全新的论坛平台，欢迎大家在这里分享知识、交流经验。',
    author: {nickname: '管理员', avatar: 'https://picsum.photos/50/50?random=1'},
    category: 'news',
    viewCount: 156,
    commentCount: 23,
    likeCount: 45,
    createTime: new Date().toISOString(),
  },
  {
    id: '2',
    title: '如何提高编程效率？',
    content: '分享一些提高编程效率的小技巧和工具推荐...',
    author: {nickname: '程序员小王', avatar: 'https://picsum.photos/50/50?random=2'},
    category: 'strategy',
    viewCount: 89,
    commentCount: 12,
    likeCount: 34,
    createTime: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    title: '前端框架选择讨论',
    content: 'Vue、React、Angular，你更倾向于哪个框架？',
    author: {nickname: '前端达人', avatar: 'https://picsum.photos/50/50?random=3'},
    category: 'discussion',
    viewCount: 234,
    commentCount: 56,
    likeCount: 78,
    createTime: new Date(Date.now() - 7200000).toISOString(),
  },
])

// 过滤后的帖子
const filteredPosts = computed(() => {
  if (currentFilter.value === 'all') {
    return mockPosts.value
  }
  return mockPosts.value.filter(post => post.category === currentFilter.value)
})

// 筛选标签
const filterTabs = [
  {key: 'all', label: '全部'},
  {key: 'strategy', label: '攻略'},
  {key: 'news', label: '新闻'},
  {key: 'discussion', label: '讨论'},
  {key: 'share', label: '分享'}
]

// 方法
const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)}天前`

  return date.toLocaleDateString()
}

const getCategoryName = (category: string) => {
  const categoryMap: Record<string, string> = {
    strategy: '攻略',
    news: '新闻',
    discussion: '讨论',
    share: '分享'
  }
  return categoryMap[category] || category
}

const viewPost = (postId: string) => {
  router.push(`/bbs/post/${postId}`)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 生命周期
onMounted(() => {
  // 初始化模拟数据
  hotPosts.value = mockPosts.value.slice(0, 3)
  activeUsers.value = [
    {id: '1', nickname: '活跃用户1', avatar: 'https://picsum.photos/32/32?random=10', level: '高级'},
    {id: '2', nickname: '活跃用户2', avatar: 'https://picsum.photos/32/32?random=11', level: '中级'},
    {id: '3', nickname: '活跃用户3', avatar: 'https://picsum.photos/32/32?random=12', level: '新手'},
  ]
  totalPosts.value = mockPosts.value.length
})
</script>

<style scoped>
.bbs-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.bbs-main {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

.content-left {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.banner-section {
  margin-bottom: 20px;
}

.banner-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.section-header h2 {
  margin: 0;
  color: #333;
}

.filter-tabs {
  display: flex;
  gap: 10px;
}

.filter-tab {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-tab.active,
.filter-tab:hover {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.post-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.post-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.post-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.post-content {
  flex: 1;
}

.post-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
}

.post-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.post-preview {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  min-width: 60px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.sidebar-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.hot-posts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hot-post-item {
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.hot-post-item:hover {
  background-color: #f5f5f5;
}

.hot-post-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
  line-height: 1.4;
}

.hot-post-stats {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #666;
}

.active-users {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.active-user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.active-user-item:hover {
  background-color: #f5f5f5;
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name-small {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.user-level {
  font-size: 12px;
  color: #409eff;
  background-color: #ecf5ff;
  padding: 2px 6px;
  border-radius: 10px;
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .bbs-main {
    padding: 0 10px;
  }
}
</style>
