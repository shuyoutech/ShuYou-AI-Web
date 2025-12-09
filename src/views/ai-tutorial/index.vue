<script setup lang="ts">
const tutorialUrl = 'https://zrzfmdghtr.apifox.cn/'
</script>

<template>
  <div class="ai-tutorial-page">
    <iframe
      :src="tutorialUrl"
      title="AI教程"
      loading="lazy"
      referrerpolicy="no-referrer"
    />
  </div>
</template>

<style scoped>
.ai-tutorial-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 140px);
  min-height: 600px;
  padding: 0;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgb(15 23 42 / 6%);
  overflow: hidden;
}

.ai-tutorial-page iframe {
  border: 0;
  width: 100%;
  height: 100%;
  background: #fff;
}

@media (max-width: 1024px) {
  .ai-tutorial-page {
    height: calc(100vh - 120px);
    min-height: 500px;
  }
}
</style>

