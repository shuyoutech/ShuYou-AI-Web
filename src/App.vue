<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'dayjs/locale/zh-cn'
import dayjs from '@/utils/dayjs'

const { locale } = useI18n()
locale.value = 'zh-cn'
dayjs.locale('zh-cn')
</script>

<template>
  <ElConfigProvider :locale="zhCn">
    <RouterView>
    </RouterView>
    <FaToast/>
  </ElConfigProvider>
</template>
