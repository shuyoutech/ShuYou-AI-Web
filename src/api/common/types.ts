declare global {

  /**
   * 分页查询参数
   */
  interface PageQuery<T> {
    pageNum?: number; //当前页码:1
    pageSize?: number; //每页记录条数:10
    sort?: string; //排序字段:createTime
    order?: string; //排序规则:asc,desc
    query: T; //查询参数对象
  }

  /**
   * 分页响应对象
   */
  interface PageResult<T> {
    rows: T[];
    total: number;
  }

  /**
   * 列表查询参数
   */
  interface Query {
    limit?: number;
    sort?: string;
    order?: string;
  }

  /**
   * 接口返回对象
   */
  interface R<T> {
    code?: number;
    msg?: string;
    data?: T;
  }

  interface Tree<T> {
    parentId: string;
    label: string;
    value: string;
    sort: number;
    metadata: T;
    children: Tree<T>[];
  }

  /**
   * 下拉选项对象
   */
  interface Options {
    value: string; //显示值
    label: string; //显示文本
    sort?: number;  //排序号
  }

  /**
   * 公共更新状态对象
   */
  interface UpdateStatusBo {
    id: string;
    status: string;
  }

  /**
   * 弹窗属性
   */
  interface DialogVo {
    title?: string;
    visible: boolean;
  }

}

export {};
