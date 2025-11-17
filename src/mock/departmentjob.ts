import { defineFakeRoute } from 'vite-plugin-fake-server/client'

// 部门&职位
const departmentjobList = [
  {
    id: 1,
    title: '技术部',
    jobList: [
      { id: 1, title: '前端开发' },
      { id: 2, title: '接口开发' },
      { id: 3, title: 'App开发' },
    ],
  },
  {
    id: 2,
    title: '设计部',
    jobList: [
      { id: 4, title: '网页设计' },
      { id: 5, title: '视觉设计' },
    ],
  },
  {
    id: 3,
    title: '运营部',
    jobList: [
      { id: 6, title: '用户运营' },
      { id: 7, title: '产品运营' },
      { id: 8, title: '内容运营' },
    ],
  },
]

export default defineFakeRoute([
  {
    url: '/mock/department/list',
    method: 'get',
    response: ({ query }) => {
      const { title, from, limit } = query
      const list = departmentjobList.filter((item) => {
        return title ? item.title.includes(title as string) : true
      })
      const pageList = list.filter((_item, index) => {
        return index >= ~~from && index < (~~from + ~~limit)
      })
      return {
        error: '',
        status: 1,
        data: {
          list: pageList,
          total: list.length,
        },
      }
    },
  },
  {
    url: '/mock/department/detail/',
    method: 'get',
    response: ({ query }) => {
      const info = departmentjobList.filter(item => item.id === ~~query.id)
      return {
        error: '',
        status: 1,
        data: info[0],
      }
    },
  },
  {
    url: '/mock/department/create',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/department/edit',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/department/delete',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/job/list',
    method: 'get',
    response: ({ query }) => {
      const { department_id, title, from, limit } = query
      let jobList: any[] = []
      for (const i in departmentjobList) {
        if (departmentjobList[i].id === ~~department_id) {
          jobList = departmentjobList[i].jobList
        }
      }
      const list = jobList.filter((item) => {
        return title ? item.title.includes(title) : true
      })
      const pageList = list.filter((_item, index) => {
        return index >= ~~from && index < (~~from + ~~limit)
      })
      return {
        error: '',
        status: 1,
        data: {
          list: pageList,
          total: list.length,
        },
      }
    },
  },
  {
    url: '/mock/job/detail/',
    method: 'get',
    response: ({ query }) => {
      let jobList: any[] = []
      for (const i in departmentjobList) {
        if (departmentjobList[i].id === ~~query.department_id) {
          jobList = departmentjobList[i].jobList
        }
      }
      const info = jobList.filter(item => item.id === ~~query.id)
      return {
        error: '',
        status: 1,
        data: info[0],
      }
    },
  },
  {
    url: '/mock/job/create',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/job/edit',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/job/delete',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
])
