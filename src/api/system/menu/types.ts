/**
 * 菜单查询参数
 */
export interface MenuQuery {
  name?: string;
}

/**
 * 菜单详情
 */
export interface MenuVo {
  id: number;
  rootId: number;
  parentId: number;
  treePath: string;
  treeLevel: number;
  status: string;
  type: string;
  name: string;
  path: string;
  sort: number;
  component: string;
  queryParams: string;
  frame: boolean;
  cache: boolean;
  visible: boolean;
  perms: string;
  icon: string;
  remark: string;
}

/**
 * 菜单新增对象
 */
export interface MenuBo {
  id?: number;
  rootId?: number;
  parentId?: number;
  treePath?: string;
  treeLevel?: number;
  status?: string;
  type?: string;
  name?: string;
  path?: string;
  sort?: number;
  component?: string;
  queryParams?: string;
  frame?: boolean;
  cache?: boolean;
  visible?: boolean;
  perms?: string;
  icon?: string;
  remark?: string;
}


