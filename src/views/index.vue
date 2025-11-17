<script setup lang="ts">
import {onMounted} from 'vue'
import {useRouter} from 'vue-router'

const router = useRouter()

// 跳转到专区
function goToSection(path: string) {
  router.push(path)
}

// 生命周期
onMounted(() => {
  // 初始化数据
})
</script>

<template>
  <div class="home-container">
    <!-- 背景装饰 -->
    <div class="background-decoration"></div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 欢迎横幅 -->
      <div class="welcome-banner">
        <div class="banner-content">
          <h1 class="banner-title">欢迎来到数游科技</h1>
          <p class="banner-subtitle">分享知识，交流经验，共同成长</p>
        </div>
        <div class="banner-image">
          <img src="https://picsum.photos/400/200?random=1" alt="欢迎横幅"/>
        </div>
      </div>

      <!-- 专区导航 -->
      <div class="sections-grid">
        <!-- 捏脸专区 -->
        <div class="section-card face-section" @click="goToSection('/face')">
          <div class="section-icon">
            <FaIcon name="i-mdi:face-woman"/>
          </div>
          <div class="section-content">
            <h3 class="section-title">捏脸专区</h3>
            <p class="section-desc">展示你的创意捏脸作品</p>
          </div>
          <div class="section-arrow">
            <FaIcon name="i-mdi:arrow-right"/>
          </div>
        </div>

        <!-- 外形专区 -->
        <div class="section-card appearance-section" @click="goToSection('/skin')">
          <div class="section-icon">
            <FaIcon name="i-mdi:account-tie"/>
          </div>
          <div class="section-content">
            <h3 class="section-title">外形专区</h3>
            <p class="section-desc">分享你的角色外形搭配</p>
          </div>
          <div class="section-arrow">
            <FaIcon name="i-mdi:arrow-right"/>
          </div>
        </div>

        <!-- 攻略专区 -->
        <div class="section-card guide-section" @click="goToSection('/guide')">
          <div class="section-icon">
            <FaIcon name="i-mdi:book-open"/>
          </div>
          <div class="section-content">
            <h3 class="section-title">攻略专区</h3>
            <p class="section-desc">分享游戏攻略和心得</p>
          </div>
          <div class="section-arrow">
            <FaIcon name="i-mdi:arrow-right"/>
          </div>
        </div>

        <!-- 公告专区 -->
        <div class="section-card notice-section" @click="goToSection('/notice')">
          <div class="section-icon">
            <FaIcon name="i-mdi:bullhorn"/>
          </div>
          <div class="section-content">
            <h3 class="section-title">公告专区</h3>
            <p class="section-desc">查看最新公告和通知</p>
          </div>
          <div class="section-arrow">
            <FaIcon name="i-mdi:arrow-right"/>
          </div>
        </div>

        <!-- 活动专区 -->
        <div class="section-card event-section" @click="goToSection('/event')">
          <div class="section-icon">
            <FaIcon name="i-mdi:calendar-star"/>
          </div>
          <div class="section-content">
            <h3 class="section-title">活动专区</h3>
            <p class="section-desc">参与精彩活动和比赛</p>
          </div>
          <div class="section-arrow">
            <FaIcon name="i-mdi:arrow-right"/>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
  position: relative;
  overflow: hidden;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.08)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.06)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.04)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
  z-index: 1;
}

/* 主要内容区域 */
.main-content {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* 欢迎横幅 */
.welcome-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 40px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.banner-content {
  flex: 1;
}

.banner-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.banner-subtitle {
  font-size: 1.2rem;
  color: #5a6c7d;
  margin: 0;
  font-weight: 300;
}

.banner-image {
  flex-shrink: 0;
  margin-left: 40px;
}

.banner-image img {
  width: 200px;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* 专区网格 */
.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

/* 专区卡片 */
.section-card {
  display: flex;
  align-items: center;
  padding: 24px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.section-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.section-card:hover::before {
  opacity: 1;
}

.section-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.95);
}

/* 专区图标 */
.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 16px;
  margin-right: 20px;
  font-size: 28px;
  color: white;
  flex-shrink: 0;
}

.face-section .section-icon {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
}

.appearance-section .section-icon {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
}

.guide-section .section-icon {
  background: linear-gradient(135deg, #45b7d1, #96c93d);
}

.notice-section .section-icon {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.event-section .section-icon {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

/* 专区内容 */
.section-content {
  flex: 1;
  position: relative;
  z-index: 2;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.section-desc {
  font-size: 0.9rem;
  color: #5a6c7d;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.section-stats {
  display: flex;
  gap: 16px;
}

.section-stats .stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #7f8c8d;
}

/* 专区箭头 */
.section-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(52, 73, 94, 0.1);
  color: #34495e;
  font-size: 16px;
  transition: all 0.3s ease;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.section-card:hover .section-arrow {
  background: rgba(52, 73, 94, 0.2);
  transform: translateX(4px);
}

/* 最新动态 */
.latest-news {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 32px 32px 16px 32px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.news-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.news-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.news-tabs {
  display: flex;
  gap: 8px;
}

.news-tab {
  padding: 8px 16px;
  background: rgba(52, 73, 94, 0.1);
  border: 1px solid rgba(52, 73, 94, 0.2);
  border-radius: 20px;
  color: #5a6c7d;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.news-tab:hover {
  background: rgba(52, 73, 94, 0.2);
  color: #2c3e50;
}

.news-tab.active {
  background: rgba(52, 73, 94, 0.3);
  color: #2c3e50;
  border-color: rgba(52, 73, 94, 0.4);
}

/* 新闻列表 */
.news-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.news-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
}

.news-item:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateX(4px);
}

.news-category {
  flex-shrink: 0;
  margin-right: 16px;
}

.category-badge {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 12px;
  white-space: nowrap;
}

.news-content {
  flex: 1;
  margin-right: 16px;
}

.news-title-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.news-preview {
  font-size: 0.9rem;
  color: #5a6c7d;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.news-time {
  font-size: 0.8rem;
  color: #95a5a6;
}

.news-author {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 20px 16px 16px 16px;
    gap: 24px;
  }

  .welcome-banner {
    flex-direction: column;
    text-align: center;
    padding: 24px;
  }

  .banner-title {
    font-size: 2rem;
  }

  .banner-subtitle {
    font-size: 1rem;
  }

  .banner-image {
    margin-left: 0;
    margin-top: 20px;
  }

  .banner-image img {
    width: 160px;
    height: 100px;
  }

  .sections-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .section-card {
    padding: 20px;
  }

  .section-icon {
    width: 50px;
    height: 50px;
    font-size: 24px;
    margin-right: 16px;
  }

  .section-title {
    font-size: 1.2rem;
  }

  .section-desc {
    font-size: 0.85rem;
  }

  .latest-news {
    padding: 24px 24px 12px 24px;
  }

  .news-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .news-title {
    font-size: 1.5rem;
  }

  .news-tabs {
    flex-wrap: wrap;
  }

  .news-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
  }

  .news-category {
    margin-right: 0;
    margin-bottom: 8px;
  }

  .news-content {
    margin-right: 0;
    width: 100%;
  }

  .news-meta {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 16px 12px 12px 12px;
  }

  .welcome-banner {
    padding: 20px;
  }

  .banner-title {
    font-size: 1.8rem;
  }

  .section-card {
    padding: 16px;
  }

  .section-icon {
    width: 45px;
    height: 45px;
    font-size: 20px;
    margin-right: 12px;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .latest-news {
    padding: 20px 20px 10px 20px;
  }

  .news-item {
    padding: 12px;
  }
}
</style>
