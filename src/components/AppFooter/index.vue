<template>
  <div class="app-footer">
    <div class="footer-content">
      <p class="copyright">
        Copyright © 2025 苏州数游科技有限公司 版权所有
        <a href="https://beian.miit.gov.cn/" target="_blank">苏ICP备2025197988号</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 公共底部组件
</script>

<style scoped>
/* 底部版权信息样式 */
.app-footer {
  padding: 10px 0;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.copyright {
  color: #6c757d;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .app-footer {
    padding: 10px 0;
  }

  .footer-content {
    padding: 0 15px;
  }

  .copyright {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .app-footer {
    padding: 10px 0;
  }

  .footer-content {
    padding: 0 10px;
  }

  .copyright {
    font-size: 12px;
  }
}
</style>
