<script setup>
import { Close } from '@element-plus/icons-vue'
import { defineEmits, defineProps, ref } from 'vue'

defineProps({
  skillName: {
    type: String,
    default: '技能名称',
  },
  tooltip: {
    type: String,
    default: '点击退出技能',
  },
  visible: {
    type: Boolean,
    default: true,
  },
})

const emits = defineEmits(['close', 'update:visible'])

const isHovered = ref(false)

function handleClose() {
  emits('close')
  emits('update:visible', false)
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    handleClose()
  }
}
</script>

<template>
  <div
    v-if="visible"
    class="exit-item"
    tabindex="0"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @keydown="handleKeydown"
  >
    <!-- 提示框 -->
    <div v-if="isHovered" class="tooltip">
      {{ tooltip }}
    </div>

    <!-- 技能标签 -->
    <div class="skill-tag">
      <span class="skill-name">{{ skillName }}</span>
      <div v-if="isHovered" class="close-btn" @click="handleClose">
        <el-icon>
          <Close />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.exit-item {
  position: relative;
  display: inline-block;
  cursor: pointer;
  outline: none;
  animation: float 2s ease-in-out infinite;
  padding-bottom: 10px;
  &:hover {
    animation-play-state: paused;
  }

  &:focus {
    .skill-tag {
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
    }
  }
}

// 上下浮动动画
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-3px);
  }
}

.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #1a1a1a;
  color: #ffffff;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  // 箭头
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #1a1a1a;
  }
}

.skill-tag {
  display: inline-flex;
  align-items: center;
  // gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #e8f2ff 0%, #f0e8ff 100%);
  color: #5a67d8;
  border: 1px solid #e2e8f0;
  border-radius: 16px 16px 16px 0;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  user-select: none;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
    border-color: #c7d2fe;
  }

  .skill-name {
    flex: 1;
    white-space: nowrap;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    background: rgba(90, 103, 216, 0.1);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: 4px;

    &:hover {
      background: rgba(90, 103, 216, 0.2);
      transform: scale(1.1);
    }

    .el-icon {
      font-size: 10px;
      color: #5a67d8;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .skill-tag {
    padding: 5px 12px;
    font-size: 12px;

    .close-btn {
      width: 14px;
      height: 14px;

      .el-icon {
        font-size: 9px;
      }
    }
  }

  .tooltip {
    font-size: 11px;
    padding: 6px 10px;
  }
}

@media (max-width: 480px) {
  .skill-tag {
    padding: 4px 10px;
    font-size: 11px;

    .close-btn {
      width: 12px;
      height: 12px;

      .el-icon {
        font-size: 8px;
      }
    }
  }
}
</style>
