/**
 * 向量数据库查询参数
 */
export interface VectorQuery {
  type?: string; //向量数据库类型
  name?: string; //数据库别名
}

/**
 * 向量数据库详情
 */
export interface VectorVo {
  id: string;          //向量数据库ID
  type: string;        //向量数据库类型
  typeName: string;    //向量数据库类型
  name: string;        //数据库别名
  host: string;        //数据库地址
  port: number;        //数据库端口
  username: string;    //数据库用户名
  password: string;    //数据库密码
  databaseName: string;//数据库名
  tableName: string;   //表名称
  dimension: number;   //向量纬度
}

/**
 * 向量数据库新增对象
 */
export interface VectorBo {
  id?: string;          //向量数据库ID
  type?: string;        //向量数据库类型
  name?: string;        //数据库别名
  host?: string;        //数据库地址
  port?: number;        //数据库端口
  username?: string;    //数据库用户名
  password?: string;    //数据库密码
  databaseName?: string;//数据库名
  tableName?: string;   //表名称
  dimension?: number;   //向量纬度
}
