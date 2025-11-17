<script setup>
import { ref, reactive, nextTick } from 'vue';

// 定义props接收父组件传入的数据
const props = defineProps({
  templateSegments: {
    type: Array,
    required: true,
    default: () => [],
  },
  placeholder: {
    type: String,
    required: true,
    default: '输入主题和写作要求',
  }
})

// 定义emits向父组件发送事件
const emit = defineEmits(['update:templateSegments', 'templateChange', 'submit']);

// 检查模板是否为空
const isTemplateEmpty = computed(() => {
  // 检查是否为空数组
  if (props.templateSegments.length === 0) {
    return true
  }
  if (props.templateSegments.length > 0) {
    const segment = props.templateSegments.map((elem) => {
      return elem.text
    }).join('')
    return segment.trim() === ''
  }
  return false
})

// 更新特殊字段的值
const updateSpecialFieldValue = (index, value) => {
  const newSegments = [...props.templateSegments];
  if (newSegments[index] && newSegments[index].isSpecial) {
    newSegments[index].value = value;
    emit('update:templateSegments', newSegments);
    emit('templateChange', newSegments);
  }
};

// 活跃状态管理
const activeSegmentIndex = ref(null);
const activeStaticTextIndex = ref(null);
const isDeleting = ref(false); // 防止连续删除触发

// 当模板为空时的textarea值
const emptyTemplateText = ref('');

// 处理空模板的输入
const handleEmptyTemplateInput = (value) => {
  emptyTemplateText.value = value;
  // 发送变化事件给父组件，传递空数组表示模板为空
  emit('templateChange', []);
};

// 处理回车键提交
const handleEnterKey = (event) => {
  // 阻止默认的回车换行行为
  event.preventDefault();
  // 通知父组件进行提交
  emit('submit');
};

// 获取特殊字段的最小宽度，防止聚焦时宽度变化
const getSpecialFieldMinWidth = (segment) => {
  // 根据占位符长度估算最小宽度，但限制最大宽度
  const placeholderLength = segment.placeholder.length;
  // 每个字符约8px宽度，加上一些缓冲，但不超过120px
  const calculatedWidth = Math.max(placeholderLength * 8, 60);
  const maxWidth = 120;
  return `${Math.min(calculatedWidth, maxWidth)}px`;
};

// 设置活跃的特殊可编辑字段
const setActiveSegment = (index) => {
  if (index === null) {
    activeSegmentIndex.value = null;
    return;
  }

  // 确保索引有效
  if (index >= 0 && index < props.templateSegments.length) {
    activeSegmentIndex.value = index;
    activeStaticTextIndex.value = null;

    // 自动聚焦
    nextTick(() => {
      const segment = props.templateSegments[index];
      if (segment.inputType === 'text') {
        // 找到对应索引的输入框
        const input = document.querySelector(`input[data-index="${index}"]`);
        if (input) {
          input.focus();
          // 选中所有内容以便快速替换
          input.select();
        }
      } else if (segment.inputType === 'select') {
        const select = document.querySelector(`select[data-index="${index}"]`);
        if (select) {
          select.focus();
        }
      }
    });
  }
};

// 设置活跃的静态文本
const setActiveStaticText = (index) => {
  if (index === null) {
    activeStaticTextIndex.value = null;
    return;
  }

  // 确保索引有效
  if (index >= 0 && index < props.templateSegments.length) {
    activeStaticTextIndex.value = index;
    activeSegmentIndex.value = null;

    // 自动聚焦到可编辑文本并设置光标到末尾
    nextTick(() => {
      const element = document.querySelector(`.static-text[data-index="${index}"]`);
      if (element) {
        element.focus();
        // 设置光标到文本末尾
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(false); // 折叠到末尾
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
  }
};

// 保存光标位置
const saveCursorPosition = (element) => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const clone = range.cloneRange();
    clone.selectNodeContents(element);
    clone.setEnd(range.endContainer, range.endOffset);
    return clone.toString().length;
  }
  return 0;
};

// 恢复光标位置
const restoreCursorPosition = (element, position) => {
  if (!element || position === null) return;

  const range = document.createRange();
  const sel = window.getSelection();
  let charIndex = 0;
  const nodeStack = [element];
  let currentNode;

  while ((currentNode = nodeStack.pop()) && charIndex <= position) {
    if (currentNode.nodeType === 3) {
      const textLength = currentNode.length;
      if (charIndex + textLength >= position) {
        range.setStart(currentNode, position - charIndex);
        range.setEnd(currentNode, position - charIndex);
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      charIndex += textLength;
    } else {
      for (let i = currentNode.childNodes.length - 1; i >= 0; i--) {
        nodeStack.push(currentNode.childNodes[i]);
      }
    }
  }

  // 如果无法恢复到指定位置，默认到末尾
  moveCursorToEnd(element);
};

// 将光标移动到元素末尾
const moveCursorToEnd = (element) => {
  if (!element) return;

  const range = document.createRange();
  const sel = window.getSelection();
  range.setStartAfter(element.lastChild || element);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
};

// 更新静态文本内容
const updateStaticText = (index, value) => {
  const newSegments = [...props.templateSegments];
  newSegments[index].text = value;
  emit('update:templateSegments', newSegments);
  emit('templateChange', newSegments);
};

// 处理内容区域点击（失去焦点）
const handleContentClick = (e) => {
  if (e.target.classList.contains('template-content')) {
    activeSegmentIndex.value = null;
    activeStaticTextIndex.value = null;
  }
};

// 删除特殊字段
const deleteSpecialField = (index) => {
  if (index >= 0 && index < props.templateSegments.length) {
    // 清除活跃状态
    activeSegmentIndex.value = null;
    activeStaticTextIndex.value = null;

    // 删除字段
    const newSegments = [...props.templateSegments];
    newSegments.splice(index, 1);
    emit('update:templateSegments', newSegments);
    emit('templateChange', newSegments);
  }
};

// 连续删除函数：删除特殊字段后，如果前面是普通文本框，激活它让用户可以逐个删除文字
const deleteSpecialFieldAndPreviousText = (index) => {
  if (index >= 0 && index < props.templateSegments.length) {
    // 删除当前特殊字段
    const newSegments = [...props.templateSegments];
    newSegments.splice(index, 1);

    // 检查前一个片段是否是普通文本框
    if (index > 0) {
      const prevIndex = index - 1;
      const prevSegment = newSegments[prevIndex];

      if (!prevSegment.isSpecial) {
        // 如果前一个是普通文本框，激活它让用户可以逐个删除文字
        activeSegmentIndex.value = null;
        activeStaticTextIndex.value = null;

        nextTick(() => {
          setActiveStaticText(prevIndex);
        });
      } else {
        // 如果前一个是特殊字段，移动到前一个片段
        activeSegmentIndex.value = null;
        activeStaticTextIndex.value = null;

        nextTick(() => {
          setActiveSegment(prevIndex);
        });
      }
    } else {
      // 已经是第一个片段
      activeSegmentIndex.value = null;
      activeStaticTextIndex.value = null;
    }

    // 发送更新事件
    emit('update:templateSegments', newSegments);
    emit('templateChange', newSegments);
  }
};

// 处理静态文本的删除操作
const handleStaticTextDelete = (index, event) => {
  const element = event.target.closest('.static-text');
  if (!element) return;

  // 防止连续删除触发
  if (isDeleting.value) {
    event.preventDefault();
    return;
  }

  // 确保元素处于编辑状态
  if (activeStaticTextIndex.value !== index) {
    event.preventDefault();
    setActiveStaticText(index);
    return;
  }

  const selection = window.getSelection();
  const isEmpty = element.innerText.trim() === '';
  const cursorAtStart = isCursorAtStart(selection, element);

  // 只有在文本为空或光标在开始位置时才进行跨片段移动
  if (isEmpty || cursorAtStart) {
    event.preventDefault();
    isDeleting.value = true;

    // 如果不是第一个片段，移动到前一个片段
    if (index > 0) {
      const prevIndex = index - 1;
      const prevSegment = props.templateSegments[prevIndex];

      // 清除当前活跃状态
      activeSegmentIndex.value = null;
      activeStaticTextIndex.value = null;

      // 立即处理，不使用延迟
      nextTick(() => {
        if (prevSegment.isSpecial) {
          setActiveSegment(prevIndex);
        } else {
          setActiveStaticText(prevIndex);
        }

        // 重置删除状态
        setTimeout(() => {
          isDeleting.value = false;
        }, 100);
      });
    } else {
      // 已经是第一个片段，重置删除状态
      setTimeout(() => {
        isDeleting.value = false;
      }, 100);
    }
  } else {
    // 正常删除，重置删除状态
    isDeleting.value = false;
  }
};

// 处理特殊字段的按键删除操作
const handleSpecialFieldKeydown = (index, event, keyType) => {
  const isActive = activeSegmentIndex.value === index;
  const segment = props.templateSegments[index];

  // 防止连续删除触发
  if (isDeleting.value) {
    event.preventDefault();
    return;
  }

  // 处理非活跃状态下的删除
  if (!isActive) {
    event.preventDefault();
    isDeleting.value = true;

    // 检查字段是否为空
    const isEmpty = !segment.value || segment.value.trim() === '';

    if (isEmpty) {
      // 如果字段为空，使用连续删除函数
      deleteSpecialFieldAndPreviousText(index);

      // 重置删除状态
      setTimeout(() => {
        isDeleting.value = false;
      }, 100);
    } else {
      // 如果字段不为空，清除值并激活编辑
      segment.value = '';
      setActiveSegment(index);

      // 重置删除状态
      setTimeout(() => {
        isDeleting.value = false;
      }, 100);
    }
    return;
  }

  // 处理活跃状态下的删除
  if (isActive) {
    // 对于选择框特殊处理
    if (segment.inputType === 'select') {
      event.preventDefault();
      isDeleting.value = true;

      // 检查选择框是否为空
      const isEmpty = !segment.value || segment.value.trim() === '';

      if (isEmpty) {
        // 如果选择框为空，使用连续删除函数
        deleteSpecialFieldAndPreviousText(index);

        // 重置删除状态
        setTimeout(() => {
          isDeleting.value = false;
        }, 100);
      } else {
        // 如果选择框不为空，清除选择
        segment.value = '';

        // 重置删除状态
        setTimeout(() => {
          isDeleting.value = false;
        }, 100);
      }
    }
    // 对于文本输入框
    else if (segment.inputType === 'text') {
      // 检查输入框是否为空
      const input = event.target;
      const isEmpty = input.value === '';
      const isCursorAtStart = input.selectionStart === 0 && input.selectionEnd === 0;

      // 如果为空且按删除键，直接删除该字段
      if (isEmpty && isCursorAtStart) {
        event.preventDefault();
        isDeleting.value = true;

        // 使用连续删除函数
        deleteSpecialFieldAndPreviousText(index);

        // 重置删除状态
        setTimeout(() => {
          isDeleting.value = false;
        }, 100);
      } else {
        // 正常删除，重置删除状态
        isDeleting.value = false;
      }
    }
  }
};

// 检查光标是否在元素的开始位置
const isCursorAtStart = (selection, element) => {
  if (selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  const preRange = document.createRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.startContainer, range.startOffset);

  return preRange.toString().length === 0;
};

// 获取模板结果文本
const getTemplateResult = () => {
  if (isTemplateEmpty.value) {
    return emptyTemplateText.value;
  }
  return props.templateSegments.map(segment => {
    if (segment.isSpecial) {
      return segment.value || segment.placeholder;
    }
    return segment.text || '';
  }).join('');
}

// 删除整个模板
const deleteTemplate = () => {
  emit('update:templateSegments', []);
  emit('templateChange', []);
  // 清空活跃状态
  activeSegmentIndex.value = null;
  activeStaticTextIndex.value = null;
};

// 保存模板
const saveTemplate = () => {
  const result = getTemplateResult();
  console.log('保存模板:', result);
  alert('模板已保存！');
};

// 重置模板
const resetTemplate = () => {
  const newSegments = [...props.templateSegments];
  newSegments.forEach(segment => {
    if (segment.isSpecial) {
      segment.value = '';
    }
  });
  activeSegmentIndex.value = null;
  activeStaticTextIndex.value = null;
  emit('update:templateSegments', newSegments);
  emit('templateChange', newSegments);
};

defineExpose({
  getTemplateResult,
})
</script>

<template>
  <div class="editable-template">
    <!-- 当模板为空时显示textarea -->
    <div v-if="isTemplateEmpty" class="empty-template-content ">
      <el-input
        v-model="emptyTemplateText"
        type="textarea"
        :rows="3"
        :placeholder="placeholder"
        resize="none"
        @input="handleEmptyTemplateInput"
        @keydown.enter="handleEnterKey"
      />
    </div>

    <!-- 当模板不为空时显示模板内容 -->
    <div
      v-else
      class="template-content p-4 group relative"
      @click="handleContentClick"
    >
      <!-- 动态渲染模板片段 -->
      <template v-for="(segment, index) in props.templateSegments" :key="index">
        <!-- 特殊可编辑字段 -->
        <span
          v-if="segment.isSpecial"
          class="special-field inline-flex items-center px-2 mx-1 rounded cursor-text"
          :class="{ 'ring-2 ring-blue-500': activeSegmentIndex === index }"
          @click.stop="setActiveSegment(index)"
          :style="{ minWidth: getSpecialFieldMinWidth(segment) }"
          :title="segment.value"
        >
          <!-- 输入框模式 -->
          <input
            v-if="activeSegmentIndex === index && segment.inputType === 'text'"
            :value="segment.value"
            @input="updateSpecialFieldValue(index, $event.target.value)"
            type="text"
            class="special-input w-full bg-transparent outline-none border-none"
            @blur="setActiveSegment(null)"
            @keyup.enter="setActiveSegment(null)"
            :data-index="index"
            :placeholder="segment.placeholder"
          >

          <!-- 选择框模式 -->
          <select
            v-if="activeSegmentIndex === index && segment.inputType === 'select'"
            :value="segment.value"
            @change="updateSpecialFieldValue(index, $event.target.value)"
            class="special-select w-full bg-transparent outline-none border-none"
            @blur="setActiveSegment(null)"
            :data-index="index"
            :id="index"
          >
            <option value="" disabled selected>{{ segment.placeholder }}</option>
            <option
              v-for="option in segment.options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>

          <!-- 显示模式 -->
          <span v-else class="special-display">
            {{ segment.value || segment.placeholder }}
          </span>

          <!-- 删除按钮 -->
          <!-- <button
            class="delete-btn"
            @click.stop="deleteSpecialField(index)"
            title="删除字段"
          >
            ×
          </button> -->
        </span>

        <!-- 普通文本（可直接编辑） -->
        <span
          v-else
          class="static-text"
          :contenteditable="activeStaticTextIndex === index"
          :data-active="activeStaticTextIndex === index"
          :data-index="index"
          :tabindex="activeStaticTextIndex === index ? 0 : -1"
        >
          {{ segment.text }}
        </span>
      </template>

      <!-- 删除模板按钮 -->
      <span v-if="!isTemplateEmpty" class="delete-template-btn" @click="deleteTemplate" title="删除整个模板">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </span>
    </div>

    <!-- 结果展示 -->
    <!-- <div class="mt-6 p-4 bg-gray-50 rounded-md">
      <h3 class="font-semibold text-gray-700 mb-2">当前模板结果:</h3>
      <p class="text-gray-800">{{ getTemplateResult() }}</p>
    </div> -->
  </div>
</template>

<style scoped>
.empty-template-content {
  padding: 4px 4px 8px;
}

/* 删除模板按钮样式 */
.template-content .delete-template-btn {
  opacity: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: 4px;
  border-radius: 4px;
  background: #fef2f2;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-content:hover .delete-template-btn {
  opacity: 1;
}

.delete-template-btn:hover {
  background: #fef2f2;
  color: #dc2626;
  transform: scale(1.1);
}

.delete-template-btn:active {
  transform: scale(0.95);
  background: #fee2e2;
  color: #b91c1c;
}

.empty-template-content .el-textarea__inner {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
}

.empty-template-content .el-textarea__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.template-content {
  min-height:90px;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  line-height: 1.6;
}
.special-field {
  transition: all 0.2s ease;
  vertical-align: middle;
  box-sizing: border-box;
  white-space: nowrap; /* 强制单行显示 */
  overflow: visible;   /* 允许溢出，确保删除按钮完全显示 */
  text-overflow: ellipsis; /* 溢出时显示省略号 */
  height: 28px;         /* 增加高度，确保内容不被遮挡 */
  line-height: 28px;    /* 行高与高度一致，垂直居中 */
  max-width: 200px;    /* 增加最大宽度 */
  min-width: 100px;   /* 增加最小宽度 */
  display: inline-block; /* 确保宽度控制生效 */
  position: relative;  /* 为绝对定位的输入框提供定位上下文 */
  background-color: rgba(0, 87, 255, 0.06);
  margin-bottom: 4px;
}

.special-field:hover {
  background-color: #e6f0ff;
}

/* 特殊字段输入框样式 - 确保宽度一致且单行显示 */
.special-input, .special-select {
  box-sizing: border-box;
  width: 100%;
  min-width: 100%;
  max-width: 100%;      /* 限制最大宽度 */
  padding: 0 4px;       /* 添加左右内边距，确保文字不被遮挡 */
  margin: 0;
  font: inherit;
  color: inherit;
  white-space: nowrap;  /* 输入内容不换行 */
  overflow: hidden;     /* 隐藏溢出 */
  text-overflow: ellipsis;
  height: 100%;         /* 填充父容器高度 */
  border: none;         /* 移除边框 */
  outline: none;        /* 移除焦点轮廓 */
  background: transparent !important; /* 透明背景 */
  position: absolute;   /* 绝对定位 */
  top: 0;
  left: 0;
  z-index: 1;           /* 确保在显示文本之上，但低于删除按钮 */
  opacity: 0;           /* 默认隐藏 */
  pointer-events: none; /* 默认不可交互 */
  line-height: 28px;     /* 确保行高与容器一致 */
}

/* 选择器样式完全重置 - 移除所有原生样式 */
.special-select,
.special-select:focus,
.special-select:hover,
.special-select:active {
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  -ms-appearance: none !important;
  outline: none !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  text-shadow: none !important;
  -webkit-box-shadow: none !important;
  -moz-box-shadow: none !important;
}

/* 选择器的特殊处理 - 确保下拉内容可以显示 */
.special-select {
  position: relative !important; /* 使用相对定位，确保下拉内容可以显示 */
  z-index: 10 !important;       /* 提高z-index，确保下拉内容在上层 */
  background: transparent !important; /* 白色背景 */
  border: none !important; /* 浅灰色边框 */
  border-radius: 6px !important; /* 圆角 */
  padding: 4px 28px 4px 10px !important; /* 减少上下内边距，调整文字位置 */
  font-size: 14px !important; /* 字体大小 */
  color: #374151 !important; /* 文字颜色 */
  cursor: pointer !important; /* 手型光标 */
  transition: all 0.2s ease !important; /* 过渡动画 */
  appearance: none !important; /* 移除默认样式 */
  -webkit-appearance: none !important; /* 移除webkit默认样式 */
  -moz-appearance: none !important; /* 移除firefox默认样式 */
  outline: none !important; /* 移除焦点轮廓 */
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%236b7280' d='M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z'/%3E%3C/svg%3E") !important; /* 自定义下拉箭头 */
  background-repeat: no-repeat !important;
  background-position: right 10px center !important;
  background-size: 14px !important;
  min-height: 28px !important; /* 最小高度，与容器一致 */
  height: 28px !important; /* 固定高度，与容器一致 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important; /* 轻微阴影 */
  width: 100% !important; /* 占满容器宽度 */
  min-width: 100px !important; /* 最小宽度 */
  max-width: 200px !important; /* 最大宽度 */
  text-align: left !important; /* 左对齐 */
  line-height: 1.2 !important; /* 调整行高 */
  font-size: 13px !important; /* 稍微减小字体 */
}

/* 选择器hover状态 */
.special-select:hover {
  border-color: #9ca3af !important; /* 悬停时边框颜色变深 */
  transform: translateY(-1px) !important; /* 轻微上移效果 */
}

/* 选择器focus时的特殊处理 */
.special-select:focus {
  position: relative !important; /* 使用相对定位，确保下拉内容可以显示 */
  z-index: 10 !important;       /* 提高z-index，确保下拉内容在上层 */
  border-color: #3b82f6 !important; /* 焦点时蓝色边框 */
  outline: none !important; /* 移除默认焦点轮廓 */
}

/* 选择器选项样式优化 */
.special-select option {
  padding: 10px 12px !important; /* 增加选项内边距 */
  font-size: 14px !important; /* 选项字体大小 */
  color: #374151 !important; /* 选项文字颜色 */
  background: #fff !important; /* 选项背景色 */
  border: 1px solid #e5e7eb !important; /* 移除选项边框 */
  line-height: 1.5 !important; /* 行高 */
  font-weight: 400 !important; /* 字体粗细 */
  transition: all 0.15s ease !important; /* 过渡动画 */
  cursor: pointer !important; /* 手型光标 */
}

/* 选择器选项悬停状态 */
.special-select option:hover {
  background: #f8fafc !important; /* 悬停时浅蓝色背景 */
  color: #1f2937 !important; /* 悬停时文字颜色变深 */
  transform: translateX(2px) !important; /* 轻微右移效果 */
}

/* 选择器选项选中状态 */
.special-select option:checked,
.special-select option:selected {
  background: #b5cef7 !important; /* 选中时蓝色背景 */
  color: white !important; /* 选中时白色文字 */
  font-weight: 500 !important; /* 选中时字体加粗 */
}

/* 选择器选项禁用状态 */
.special-select option:disabled {
  color: #9ca3af !important; /* 禁用时灰色文字 */
  background: #f9fafb !important; /* 禁用时浅灰色背景 */
  cursor: not-allowed !important; /* 禁用光标 */
}

/* 选择器选项分组标题 */
.special-select optgroup {
  font-weight: 600 !important; /* 分组标题加粗 */
  color: #6b7280 !important; /* 分组标题颜色 */
  background: #f3f4f6 !important; /* 分组背景色 */
  padding: 8px 12px !important; /* 分组内边距 */
  font-size: 12px !important; /* 分组字体大小 */
  text-transform: uppercase !important; /* 大写字母 */
  letter-spacing: 0.5px !important; /* 字母间距 */
}

/* 特殊字段显示文本样式 */
.special-display {
  display: inline-block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  z-index: 1;
  opacity: 1;
  transition: opacity 0.2s ease;
  padding: 0 4px;       /* 添加左右内边距，与输入框保持一致 */
  line-height: 28px;     /* 确保行高与容器一致 */
  box-sizing: border-box; /* 确保内边距计算正确 */
  color: #1890ff;
}

/* 活跃状态下的输入框样式 */
.special-field.ring-2 .special-input,
.special-field.ring-2 .special-select {
  opacity: 1;
  pointer-events: auto;
}

/* 活跃状态下隐藏显示文本 */
.special-field.ring-2 .special-display {
  opacity: 0;
}

/* 确保输入框focus时不会改变容器尺寸 */
.special-field:focus-within {
  max-width: 140px !important;
  min-width: 100px !important;
}

/* 输入框focus时的特殊处理 */
.special-input:focus,
.special-select:focus {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 100% !important;
  transform: none !important;
  scale: 1 !important;
  position: relative !important; /* 改为相对定位 */
  z-index: 1 !important;  /* 降低z-index，确保删除按钮在上层 */
  text-align: left !important; /* 左对齐 */
  line-height: 1.2 !important; /* 调整行高 */
  font-size: 14px !important; /* 稍微减小字体 */
  height: 30px !important; /* 固定高度，与容器一致 */
  min-height: 30px !important; /* 最小高度，与容器一致 */
  padding: 4px 28px 4px 10px !important; /* 减少上下内边距，调整文字位置 */
  box-sizing: border-box !important; /* 确保内边距计算正确 */
  /* 完全移除select原生样式 */
  appearance: none !important; /* 移除默认样式 */
  -webkit-appearance: none !important; /* 移除webkit默认样式 */
  -moz-appearance: none !important; /* 移除firefox默认样式 */
  background: transparent !important; /* 确保背景色 */
  border: none !important; /* 确保边框样式 */
  border-radius: 6px !important; /* 确保圆角 */
  outline: none !important; /* 移除焦点轮廓 */
}

/* 普通文本样式 */
.static-text {
  cursor: text;
  padding: 0 2px;
  margin: 0 -2px;
  transition: background-color 0.2s ease;
  white-space: normal;  /* 允许普通文本换行 */
  word-wrap: break-word; /* 允许长单词换行 */
  display: inline; /* 确保文本可以正常换行 */
}

/* 编辑状态的普通文本样式 */
.static-text[data-active="true"] {
  background-color: #f0f9ff;
  outline: none;
}

/* 移除contenteditable元素的默认聚焦样式 */
.static-text[contenteditable="true"]:focus {
  outline: none;
}

/* 编辑时的光标样式 */
.static-text[contenteditable="true"] {
  caret-color: #1e40af;
}

/* 确保所有元素都使用相同的盒模型计算方式 */
* {
  box-sizing: border-box;
}

/* 防止浏览器默认样式影响特殊字段 */
.special-field input,
.special-field select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border-radius: 0;
  box-shadow: none;
  resize: none;
}

/* 选择框下拉箭头样式 */
.special-field select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;  /* 调整箭头位置，避免遮挡文字 */
  background-repeat: no-repeat;
  background-size: 12px;
  padding-right: 24px;  /* 增加右侧内边距，为箭头留出更多空间 */
}

/* 日期输入框样式 */
.special-field input[type="date"] {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* 确保输入框不会因为内容过长而撑大容器 */
.special-field input[type="text"] {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 确保日期输入框有足够的空间显示内容 */
.special-field input[type="date"] {
  padding-right: 8px;  /* 为日期输入框添加右侧内边距 */
}

/* 确保所有输入框和选择器的文字垂直居中 */
.special-field input,
.special-field select {
  vertical-align: middle;
  display: flex;
  align-items: center;
}

/* 删除按钮样式 */
.delete-btn {
  position: absolute;
  top: -8px;    /* 调整位置，确保完全在容器外部 */
  right: -8px;  /* 调整位置，确保完全在容器外部 */
  width: 20px;  /* 稍微增大按钮尺寸 */
  height: 20px; /* 稍微增大按钮尺寸 */
  border-radius: 50%;
  background-color: #fc6b6b;
  color: white;
  border: 2px solid white; /* 添加白色边框，增强视觉效果 */
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 30;  /* 进一步提高z-index */
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* 添加阴影效果 */
}

.delete-btn:hover {
  background-color: #dc2626;
  transform: scale(1.15);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); /* 悬停时增强阴影 */
}

/* 悬停时显示删除按钮 */
.special-field:hover .delete-btn {
  display: flex;
}

/* 活跃状态下也显示删除按钮 */
.special-field.ring-2 .delete-btn {
  display: flex;
}
</style>
