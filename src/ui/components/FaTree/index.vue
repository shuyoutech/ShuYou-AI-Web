<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils'
import Node from './node.vue'

export interface TreeNode extends Record<string, any> {
  id: string
  name: string
  children?: TreeNode[]
  checked?: boolean
  disabled?: boolean
}

export interface TreeProps {
  data: TreeNode[]
  checkable?: boolean
  filterable?: boolean
  filterPlaceholder?: string
  /**
   * 自定义过滤方法
   * @param query 搜索查询字符串
   * @param node 树形节点
   * @returns 是否匹配搜索条件
   *
   * 如果不提供此属性，组件将默认使用 name 字段进行模糊查询
   * 如果提供此属性，将优先使用自定义过滤逻辑，同时保持默认的 name 查询作为后备
   *
   * 示例：
   * ```ts
   * const customFilter = (query: string, node: TreeNode) => {
   *   // 按类型过滤
   *   if (query === 'file' && node.type === 'file') return true
   *   if (query === 'folder' && node.type === 'folder') return true
   *   // 按名称过滤
   *   return node.name.toLowerCase().includes(query.toLowerCase())
   * }
   * ```
   */
  filterMethod?: (query: string, node: TreeNode) => boolean
  class?: HTMLAttributes['class']
}

defineOptions({
  name: 'FaTree',
})

const props = withDefaults(defineProps<TreeProps>(), {
  checkable: false,
  filterable: false,
  filterPlaceholder: '搜索...',
})

const emit = defineEmits<{
  selectionChange: [node: TreeNode | null]
  checkChange: [nodes: TreeNode[]]
}>()

// 响应式状态
const expandedIds = ref<Set<string>>(new Set())
const selectedId = ref<string | null>(null)
const searchQuery = ref('')

// 构建所有项目的ID映射
const nodeMap = computed(() => {
  const map = new Map<string, TreeNode>()
  const processNode = (node: TreeNode) => {
    map.set(node.id, node)
    node.children?.forEach(processNode)
  }
  props.data.forEach(processNode)
  return map
})

// 搜索过滤后的数据
const filteredData = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.data
  }

  const searchLower = searchQuery.value.toLowerCase()
  const newExpandedIds = new Set<string>()

  // 检查项目是否匹配搜索
  const nodeMatches = (node: TreeNode): boolean => {
    // 如果提供了外部过滤函数，优先使用外部函数
    if (props.filterMethod) {
      const externalMatch = props.filterMethod(searchQuery.value, node)
      if (externalMatch) {
        return true
      }
    }
    // 默认使用 name 进行模糊查询
    const nameMatches = node.name.toLowerCase().includes(searchLower)
    if (nameMatches) {
      return true
    }
    // 递归检查子级项目
    if (node.children) {
      return node.children.some(child => nodeMatches(child))
    }
    return false
  }

  // 过滤树结构
  const filterTree = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .map((node) => {
        if (!node.children) {
          return nodeMatches(node) ? node : null
        }
        const filteredChildren = filterTree(node.children)
        if (filteredChildren.length > 0 || nodeMatches(node)) {
          if (node.children) {
            newExpandedIds.add(node.id)
          }
          return {
            ...node,
            children: filteredChildren,
          }
        }
        return null
      })
      .filter((node): node is TreeNode => node !== null)
  }

  // 更新展开的ID
  nextTick(() => {
    if (searchQuery.value.trim()) {
      expandedIds.value = new Set([...expandedIds.value, ...newExpandedIds])
    }
  })

  return filterTree(props.data)
})

// 获取选中状态
function getCheckState(node: TreeNode): boolean | 'indeterminate' {
  const originalNode = nodeMap.value.get(node.id)
  if (!originalNode) {
    return false
  }
  // 基础情况：没有子级时直接返回当前状态
  if (!originalNode.children?.length) {
    return !!originalNode.checked
  }
  // 使用 reduce 统计各种状态的数量
  const stats = originalNode.children.reduce(
    (acc, child) => {
      if (child.disabled) {
        acc.disabled++
        return acc
      }
      const childState = getCheckState(child)
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
  return originalNode.children.length - stats.disabled === 0
    ? false
    : stats.checked === originalNode.children.length - stats.disabled
      ? true
      : stats.checked > 0 || stats.indeterminate > 0
        ? 'indeterminate'
        : false
}

// 获取选中的项目
const selectedNode = computed(() => {
  if (!selectedId.value) {
    return null
  }
  // 递归查找选中的项目
  const findNode = (nodes: TreeNode[]): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === selectedId.value) {
        return node
      }
      if (node.children) {
        const found = findNode(node.children)
        if (found) {
          return found
        }
      }
    }
    return null
  }
  return findNode(props.data)
})

// 获取所有父级节点ID
function getAllParentIds(nodes: TreeNode[]): string[] {
  let ids: string[] = []
  nodes.forEach((node) => {
    if (node.children) {
      ids.push(node.id)
      ids = [...ids, ...getAllParentIds(node.children)]
    }
  })
  return ids
}

// 切换展开状态
function handleToggleExpand(id: string, isOpen: boolean) {
  const newExpandedIds = new Set(expandedIds.value)
  if (isOpen) {
    newExpandedIds.add(id)
  }
  else {
    newExpandedIds.delete(id)
  }
  expandedIds.value = newExpandedIds
}

// 选择处理
function handleSelect(id: string) {
  if (!props.checkable) {
    selectedId.value = id
  }
}

// 复选框变化处理
function handleCheckChange(node: TreeNode, checked: boolean) {
  // 更新当前项目状态
  updateNodeCheckedState(node.id, checked)
  // 如果是父级项目，需要更新所有子级状态
  if (node.children && node.children.length > 0) {
    updateChildrenCheckedState(node.children, checked)
  }
  // 如果是子级项目，需要更新父级状态
  updateParentCheckedState(node.id)
  emit('checkChange', getCheckedNodes(props.data))
}

// 更新节点选中状态
function updateNodeCheckedState(id: string, checked: boolean) {
  const updateNode = (nodes: TreeNode[]) => {
    nodes.forEach((node) => {
      if (node.id === id) {
        node.checked = checked
      }
      if (node.children) {
        updateNode(node.children)
      }
    })
  }
  updateNode(props.data)
}

// 更新所有子级选中状态
function updateChildrenCheckedState(children: TreeNode[], checked: boolean) {
  children.forEach((child) => {
    // 跳过被禁用的子级
    if (child.disabled) {
      return
    }
    child.checked = checked
    if (child.children && child.children.length > 0) {
      updateChildrenCheckedState(child.children, checked)
    }
  })
}

// 更新父级选中状态
function updateParentCheckedState(childId: string) {
  const findAndUpdateParent = (nodes: TreeNode[], targetId: string): boolean => {
    for (const node of nodes) {
      if (node.children) {
        // 检查是否是直接父级
        const isDirectParent = node.children.some(child => child.id === targetId)
        if (isDirectParent) {
          // 计算子级状态
          const childStates = node.children.map((child) => {
            if (child.children && child.children.length > 0) {
              return getCheckState(child)
            }
            return !!child.checked
          })
          // 更新父级状态
          if (childStates.every(state => state === true)) {
            node.checked = true
          }
          else if (childStates.every(state => state === false)) {
            node.checked = false
          }
          else {
            node.checked = false // 部分选中状态通过getCheckState计算
          }
          // 继续向上查找父级
          findAndUpdateParent(props.data, node.id)
          return true
        }
        // 递归查找
        if (findAndUpdateParent(node.children, targetId)) {
          return true
        }
      }
    }
    return false
  }

  findAndUpdateParent(props.data, childId)
}

// 获取所有选中的节点
function getCheckedNodes(nodes: TreeNode[]): TreeNode[] {
  const checkedNodes: TreeNode[] = []
  const traverse = (node: TreeNode) => {
    if (node.checked) {
      checkedNodes.push(node)
    }
    if (node.children) {
      node.children.forEach(traverse)
    }
  }
  nodes.forEach(traverse)
  return checkedNodes
}

// 监听选择变化
watch(selectedId, () => {
  // 只有在非 checkable 模式下才触发选择变化事件
  if (!props.checkable) {
    emit('selectionChange', selectedNode.value)
  }
}, { deep: true })

defineExpose({
  // 展开指定或全部节点
  expand: (nodeIds?: string[]) => {
    if (nodeIds && nodeIds.length > 0) {
      // 展开指定的节点
      const newExpandedIds = new Set(expandedIds.value)
      nodeIds.forEach(id => newExpandedIds.add(id))
      expandedIds.value = newExpandedIds
    }
    else {
      // 展开所有父级节点
      expandedIds.value = new Set(getAllParentIds(props.data))
    }
  },
  // 收起指定或全部节点
  collapse: (nodeIds?: string[]) => {
    if (nodeIds && nodeIds.length > 0) {
      // 收起指定的节点
      const newExpandedIds = new Set(expandedIds.value)
      nodeIds.forEach(id => newExpandedIds.delete(id))
      expandedIds.value = newExpandedIds
    }
    else {
      // 收起所有节点
      expandedIds.value = new Set()
    }
  },
  // 全选/取消全选
  checkAll: (checked: boolean) => {
    const processNode = (node: TreeNode) => {
      if (node.disabled) {
        return
      }
      handleCheckChange(node, checked)
      node.children?.forEach(processNode)
    }
    props.data.forEach(processNode)
  },
  // 设置选中
  setSelection: (id: string) => {
    selectedId.value = id
    emit('selectionChange', selectedNode.value)
  },
  // 清除选择
  clearSelection: () => {
    selectedId.value = null
    emit('selectionChange', null)
  },
})
</script>

<template>
  <div :class="cn('w-full', props.class)">
    <div v-if="filterable" class="relative mb-4 w-full">
      <FaIcon name="i-lucide:search" class="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
      <FaInput v-model="searchQuery" :placeholder="filterPlaceholder" class="w-full ps-8" />
    </div>
    <Node
      v-for="node in filteredData"
      :key="node.id"
      :node="node"
      :depth="0"
      :selected-id="selectedId"
      :expanded-ids="expandedIds"
      :checkable="checkable"
      @toggle-expand="handleToggleExpand"
      @select="handleSelect"
      @check-change="handleCheckChange"
    >
      <template #default="{ node: slotNode, expanded: slotExpanded }">
        <slot :node="slotNode" :expanded="slotExpanded" />
      </template>
    </Node>
  </div>
</template>
