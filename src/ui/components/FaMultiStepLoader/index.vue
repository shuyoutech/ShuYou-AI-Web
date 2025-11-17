<script setup lang="ts">
defineOptions({
  name: 'FaMultiStepLoader',
})

const props = withDefaults(defineProps<{
  loading?: boolean
  steps: Step[]
  preventClose?: boolean
}>(), {
  loading: false,
  preventClose: false,
})

const emit = defineEmits<{
  stateChange: [number]
  complete: []
  close: []
  error: [Error, number]
}>()

export interface Step {
  text: string // 步骤文本
  afterText?: string // 步骤完成后的文本
  name?: string // 步骤返回数据对象名称
  action?: (context: StepContext) => Promise<any> // 步骤执行的函数
}

export type StepContext = Record<string, any>

const currentState = ref(0)
const isLastStepComplete = ref(false)
const stepResults = ref<StepContext>({}) // 存储每个步骤的返回值

async function executeStepAction(step: Step) {
  if (typeof step.action === 'function') {
    try {
      const result = await step.action(stepResults.value)
      if (step.name) {
        stepResults.value[step.name] = result
      }
      return true
    }
    catch (error) {
      emit('error', error as Error, currentState.value)
      return false
    }
  }
  return true
}

async function proceedToNextStep() {
  const currentStep = props.steps[currentState.value]
  if (!currentStep) {
    return
  }

  // Execute the current step's action
  const success = await executeStepAction(currentStep)
  if (!success) {
    return // 如果执行失败，终止流程
  }

  if (currentState.value < props.steps.length - 1) {
    currentState.value++
    emit('stateChange', currentState.value)
    processCurrentStep()
  }
  else {
    isLastStepComplete.value = true
    emit('complete')
  }
}

async function processCurrentStep() {
  const currentStep = props.steps[currentState.value]
  if (!currentStep) {
    return
  }

  await proceedToNextStep()
}

function close() {
  emit('close')
}

watch(
  () => props.loading,
  (newLoading) => {
    if (newLoading) {
      currentState.value = 0
      isLastStepComplete.value = false
      stepResults.value = {} // 重置步骤结果
      processCurrentStep()
    }
  },
)
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="loading && steps.length > 0"
      class="fixed inset-0 z-5000 size-full flex items-center justify-center backdrop-blur-2xl"
    >
      <button
        v-show="!preventClose"
        class="absolute right-4 top-4 z-5001 h-9 inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary px-3 text-sm text-primary-foreground font-medium ring-offset-background transition-colors disabled:pointer-events-none hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
        size="sm"
        @click="close"
      >
        <FaIcon name="i-heroicons:x-mark" class="size-6" />
      </button>
      <div class="relative h-96">
        <div class="relative mx-auto mt-40 max-w-xl flex flex-col justify-start">
          <div
            v-for="(step, index) in steps"
            :key="index"
          >
            <div
              v-if="step"
              class="mb-4 flex items-center gap-2 text-left transition-all duration-300 ease-in-out"
              :style="{
                opacity:
                  index === currentState
                    ? 1
                    : Math.max(1 - Math.abs(index - currentState) * 0.2, 0),
                transform: `translateY(${
                  index === currentState ? -(currentState * 40) : -(currentState * 40)
                }px)`,
              }"
            >
              <FaIcon v-if="index < currentState || (index === steps.length - 1 && index === currentState && isLastStepComplete)" name="i-heroicons:check-circle-solid" class="size-6 text-primary" />
              <FaIcon v-else-if="index === currentState && (!isLastStepComplete || index !== steps.length - 1)" name="i-heroicons:arrow-path" class="size-6 animate-spin text-primary" />
              <FaIcon v-else name="i-heroicons:check-circle" class="size-6 text-black opacity-50 dark:text-white" />
              <div class="flex flex-col">
                <span
                  class="text-lg text-black dark:text-white" :class="[
                    index > currentState && 'opacity-50',
                  ]"
                >
                  {{ step.text }}
                </span>
                <Transition
                  enter-active-class="transition-all duration-300"
                  enter-from-class="opacity-0 -translate-y-1"
                  enter-to-class="opacity-100 translate-y-0"
                >
                  <span
                    v-if="
                      step.afterText
                        && (index < currentState
                          || (index === steps.length - 1
                            && index === currentState
                            && isLastStepComplete))
                    "
                    class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                  >
                    {{ step.afterText }}
                  </span>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="[mask-image:radial-gradient(900px_at_center,hsl(var(--primary))_30%,transparent)] absolute inset-x-0 bottom-0 z--1 h-full bg-white bg-gradient-to-t dark:bg-black"
      />
    </div>
  </Transition>
</template>
