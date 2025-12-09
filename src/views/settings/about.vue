<script setup lang="ts">
import Sidebar from './sidebar.vue'
</script>

<template>
  <div class="about-container">
    <div class="about-layout">
      <div class="sidebar-section">
        <Sidebar />
      </div>

      <div class="main-content">
        <div class="page-header">
          <h3 class="title">联系我们</h3>
          <p class="subtitle">如果您对 数游科技AI、技术支持、使用体验、合作等有任何问题和建议，都可以与我们联系</p>
        </div>
        <div class="card-grid">
          <div class="card contact-wechat">
            <div class="left">
              <div class="card-icon"><FaIcon name="i-ant-design:wechat-filled"/></div>
              <div class="info">
                <div class="label">联系微信</div>
                <div class="value">dm18626260603</div>
              </div>
            </div>
            <div class="qrcode">
              <img src="https://shuyoutech.com/preview/wechat_group.png" alt="微信二维码" referrerpolicy="no-referrer" />
              <div class="qrcode-tip">扫码进微信群</div>
            </div>
          </div>

          <div class="card contact-email">
            <div class="card-icon"><FaIcon name="i-ep:message"/></div>
            <div class="info">
              <div class="label">联系邮箱</div>
              <div class="value">yangchao@szshuyou.com</div>
            </div>
          </div>

          <div class="card contact-qq">
            <div class="card-icon"><FaIcon name="i-ant-design:qq-circle-filled"/></div>
            <div class="info">
              <div class="label">联系QQ</div>
              <div class="value">1219191915</div>
            </div>
          </div>

          <div class="card contact-miniprogram">
            <div class="left">
              <div class="card-icon"><FaIcon name="i-ant-design:wechat-filled"/></div>
              <div class="info">
                <div class="label">小程序</div>
                <div class="value">数游AI</div>
              </div>
            </div>
            <div class="qrcode">
              <img src="https://shuyoutech.com/preview/wxamp-shouyou.jpg" alt="数游AI小程序二维码" referrerpolicy="no-referrer" />
              <div class="qrcode-tip">扫码使用小程序</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-container {
  height: calc(100vh - 60px);
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
  position: absolute;
  left: 0; right: 0; top: 60px;
  width: 100vw;
}

.about-layout {
  display: flex;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 10px 20px;
  height: 100%;
}

.sidebar-section {
  flex-shrink: 0;
  width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  overflow: hidden;
}

.page-header {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

.title {
  font-size: 28px;
  font-weight: 800;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #5a6c7d;
  margin: 0;
}

.card-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  grid-auto-rows: 220px;
  gap: 16px;
}

.contact-miniprogram {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.contact-miniprogram .left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.contact-miniprogram .info {
  text-align: left;
}

.card {
  background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.75) 100%);
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(28, 36, 56, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.65);
  outline: 1px solid rgba(82, 98, 255, 0.06);
  backdrop-filter: blur(12px);
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: transform .25s ease, box-shadow .25s ease;
}

.card::before {
  content: '';
  position: absolute; inset: -1px;
  background: radial-gradient(120px 120px at 20% 0%, rgba(102,126,234,.18), transparent 60%),
              radial-gradient(160px 160px at 100% 100%, rgba(118,75,162,.12), transparent 60%);
  pointer-events: none;
}

.card::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,.3), rgba(255,255,255,0));
  mix-blend-mode: overlay;
  pointer-events: none;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 36px rgba(28,36,56,0.16);
}

.contact-wechat { display: flex; align-items: center; justify-content: space-between; }
.contact-wechat .left { display: flex; align-items: center; gap: 16px; }

.contact-wechat .info .label { color: #5a6c7d; margin-bottom: 8px; }
.contact-wechat .info .value { font-size: 22px; font-weight: 800; color: #1f2937; }

.qrcode {
  position: absolute;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.16);
  padding: 10px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  backdrop-filter: blur(2px);
}

.qrcode img {
  width: 148px;
  height: 148px;
  object-fit: cover;
  border-radius: 10px;
  background: #fff;
}

.qrcode-tip {
  font-size: 12px;
  opacity: 0.95;
}

.contact-email, .contact-qq {
  display: flex;
  justify-content: flex-start;
  gap: 16px;
}

.card-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(102,126,234,0.16), rgba(118,75,162,0.16));
  color: #667eea;
  display: flex; align-items: center; justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(102,126,234,.15);
}

.card-icon :deep(svg) {
  width: 28px;
  height: 28px;
}

.contact-wechat .corner {
  position: absolute; left: 16px; top: 16px;
  background: rgba(255,255,255,0.2);
  color: #fff;
}

.info .label { color: #5a6c7d; margin-bottom: 8px; }
.info .value { font-size: 22px; font-weight: 800; color: #1f2937; }

@media (max-width: 1200px) {
  .about-layout { flex-direction: column; }
  .sidebar-section { width: 100%; }
  .card-grid { grid-template-columns: 1fr; grid-auto-rows: 220px; }
  .qrcode { right: 16px; bottom: 16px; }
  .qrcode img { width: 132px; height: 132px; }
}
</style>


