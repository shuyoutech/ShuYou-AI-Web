import {createRouter, createWebHistory} from "vue-router"
import routes from "./routes/index.ts"
import {memberBindThirdPartyApi} from "@/api/member";
import {useUserStore} from "@/store/modules/user.ts";

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  if (to.path === '/wechat/callback') {
    const query = to.query
    console.log("/wechat/callback ============= code:" + query.code)
    if (query.code) {
      const userStore = useUserStore()
      userStore.accessToken(String(query.code))
      next('/')
    }
    return
  } else if (to.path === '/wechat/bind/callback') {
    const query = to.query
    console.log("/wechat/bind/callback ============= code:" + query.code)
    if (query.code) {
      memberBindThirdPartyApi(String(query.code)).then((res: any) => {
        if (res.code === 0) {
          const userStore = useUserStore()
          userStore.getMemberInfo()
          next('/')
        }
      })
    }
    return
  }
  next()
})

export default router
