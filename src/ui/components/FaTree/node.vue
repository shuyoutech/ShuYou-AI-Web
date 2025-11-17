<script setup lang="ts">
import type { TreeNode } from './index.vue'
import { cn } from '@/utils'

interface TreeNodeProps {
  node: TreeNode
  depth: number
  selectedId: string | null
  expandedIds: Set<string>
  checkable: boolean
}

defineOptions({
  name: 'FaTreeNode',
})

const props = defineProps<TreeNodeProps>()

const emit = defineEmits<{
  toggleExpand: [id: string, isOpen: boolean]
  select: [id: string]
  checkChange: [node: TreeNode, checked: boolean]
}>()

defineSlots<{
  default: (props: { node: TreeNode, expanded: boolean }) => any
}>()

const isOpen = computed(() => props.expandedIds.has(props.node.id))
const isSelected = computed(() => !props.checkable && props.selectedId === props.node.id)
const hasChildren = computed(() => props.node.children && props.node.children.length > 0)

// 获取选中状态
const getCheckState = computed({
  get: () => getChildCheckState(props.node),
  set(checked: boolean | 'indeterminate') {
    const isChecked = checked === true
    emit('checkChange', props.node, isChecked)
  },
})

// 递归获取子项选中状态 - 使用函数式编程重构
function getChildCheckState(node: TreeNode): boolean | 'indeterminate' {
  // 基础情况：没有子级时直接返回当前状态
  if (!node.children?.length) {
    return !!node.checked
  }
  // 使用 reduce 统计各种状态的数量
  const stats = node.children.reduce(
    (acc, child) => {
      if (child.disabled) {
        acc.disabled++
        return acc
      }
      const childState = getChildCheckState(child)
      if (childState === true) {
        acc.checked++
      }
      else if (childState === 'indeterminate') {
        acc.indeterminate++
      }
      return acc
    },
    { checked: 0, indeterminate: 0, disabled: 0 },
  )
  // 使用三元运算符和逻辑运算符简化判断逻辑
  return node.children.length - stats.disabled === 0
    ? false
    : stats.checked === node.children.length - stats.disabled
      ? true
      : stats.checked > 0 || stats.indeterminate > 0
        ? 'indeterminate'
        : false
}

// 事件处理
function handleToggleExpand(e: Event) {
  e.stopPropagation()
  if (hasChildren.value) {
    emit('toggleExpand', props.node.id, !isOpen.value)
  }
}

function handleClick(e: Event) {
  e.stopPropagation()

  // 如果节点被禁用，不允许任何操作
  if (props.node.disabled) {
    return
  }

  if (props.checkable) {
    const newCheckedState = !props.node.checked
    emit('checkChange', props.node, newCheckedState)
    return
  }

  // 如果当前项目已选中，则取消选中；否则选中当前项目
  if (props.selectedId === props.node.id) {
    emit('select', '')
  }
  else {
    emit('select', props.node.id)
  }
}

const selectionStyle = computed(() => {
  // 只有在非 checkable 模式下才计算选择样式
  if (!isSelected.value || props.checkable) {
    return ''
  }

  // 获取所有可见节点
  const getVisibleNodes = (nodes: TreeNode[]): TreeNode[] => {
    let visibleNodes: TreeNode[] = []
    nodes.forEach((node) => {
      visibleNodes.push(node)
      if (node.children && props.expandedIds.has(node.id)) {
        visibleNodes = [...visibleNodes, ...getVisibleNodes(node.children)]
      }
    })
    return visibleNodes
  }

  const visibleNodes = getVisibleNodes([props.node])
  const currentIndex = visibleNodes.findIndex(i => i.id === props.node.id)
  const prevNode = visibleNodes[currentIndex - 1]
  const nextNode = visibleNodes[currentIndex + 1]

  const isPrevSelected = prevNode && props.selectedId === prevNode.id
  const isNextSelected = nextNode && props.selectedId === nextNode.id

  const roundTop = !isPrevSelected
  const roundBottom = !isNextSelected

  return cn(
    roundTop && 'rounded-t-md',
    roundBottom && 'rounded-b-md',
  )
})
</script>

<template>
  <div
    :data-tree-node="true"
    :data-id="node.id"
    :class="cn('relative space-y-1', depth > 0 && 'ps-5')"
  >
    <!-- 树形项目 -->
    <div
      :class="cn(
        'relative flex items-center gap-2 min-h-8 px-2 py-1.5 ms-8 rounded-md select-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground',
        node.disabled && 'opacity-50 cursor-not-allowed',
        !node.disabled && 'cursor-pointer',
        selectionStyle,
      )"
      @click="handleClick"
    >
      <!-- 展开/收起按钮 -->
      <div v-if="hasChildren" class="absolute h-4 w-4 flex flex-shrink-0 items-center justify-center -inset-s-6" @click="handleToggleExpand">
        <FaIcon
          name="i-lucide:chevron-down" class="h-3 w-3 text-muted-foreground transition-transform" :class="{
            'rotate--90 rtl:rotate-90': !isOpen,
          }"
        />
      </div>
      <FaCheckbox v-if="checkable" v-model="getCheckState" :disabled="node.disabled" class="flex-shrink-0" @click.stop />
      <div class="flex-1 text-sm text-foreground">
        <slot :node="node" :expanded="isOpen">
          {{ node.name }}
        </slot>
      </div>
    </div>
    <!-- 子项目 -->
    <FaCollapsible v-if="hasChildren" :model-value="isOpen" class="mt-1 space-y-1">
      <FaTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        :checkable="checkable"
        @toggle-expand="(id, isOpen) => emit('toggleExpand', id, isOpen)"
        @select="(ids) => emit('select', ids)"
        @check-change="(node, checked) => emit('checkChange', node, checked)"
      >
        <template #default="{ node: slotNode, expanded: slotExpanded }">
          <slot :node="slotNode" :expanded="slotExpanded" />
        </template>
      </FaTreeNode>
    </FaCollapsible>
    <!-- <div v-if="hasChildren && isOpen" class="mt-1 space-y-1">
      <FaTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        :checkable="checkable"
        @toggle-expand="(id, isOpen) => emit('toggleExpand', id, isOpen)"
        @select="(ids) => emit('select', ids)"
        @check-change="(node, checked) => emit('checkChange', node, checked)"
      >
        <template #default="{ node: slotNode, expanded: slotExpanded }">
          <slot :node="slotNode" :expanded="slotExpanded" />
        </template>
      </FaTreeNode>
    </div> -->
  </div>
</template>
