import { defineFakeRoute } from 'vite-plugin-fake-server/client'

// 角色
const roleList = [
  {
    id: 1,
    name: '超级管理员',
    remark: '该权限一般分配给系统管理员，或用于开发人员进行系统调试',
    auths: ['manager.browse', 'manager.create', 'manager.edit', 'manager.delete'],
  },
  {
    id: 2,
    name: '测试角色',
    remark: '',
    auths: ['test1'],
  },
]

export default defineFakeRoute([
  {
    url: '/mock/role/list',
    method: 'get',
    response: ({ query }) => {
      const { name, from, limit } = query
      const list = roleList.filter((item) => {
        return name ? item.name.includes(name as string) : true
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
    url: '/mock/role/detail/',
    method: 'get',
    response: ({ query }) => {
      const info = roleList.filter(item => item.id === ~~query.id)
      return {
        error: '',
        status: 1,
        data: info[0],
      }
    },
  },
  {
    url: '/mock/role/create',
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
    url: '/mock/role/edit',
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
    url: '/mock/role/delete',
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
    url: '/mock/role/allList',
    method: 'get',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          list: roleList,
        },
      }
    },
  },
])
