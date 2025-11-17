/**
 * 模型查询参数
 */
export interface ModelQuery {
  provider?: string;  //模型编码
  name?: string; //模型名称
  type?: string; //模型类型
  chargeType?: string;//计费类型
  tag?: string;  //模型标签
}

/**
 * 模型详情
 */
export interface ModelVo {
  id?: string;              //模型ID
  status?: string;          //状态
  statusName?: string;      //状态名称
  provider?: string;        //供应商
  providerName?: string;    //供应商名称
  providerIcon?: string;    //供应商图标
  types?: string[];         //模型类型
  typeNames?: string[];     //模型类型名称
  tags?: string[];          //模型标签
  name?: string;            //模型名称
  alias?: string;           //模型别名
  inputs?: string[];        //输入支持
  outputs?: string[];       //输出支持
  remark?: string;          //模型描述
  contextWindow?: number;   //上下文长度
  contextWindowStr?: string;
  baseUrl?: string;         //代理地址
  apiKey?: string;          //API密钥
  enableSearch?: boolean;   //是否支持互联网搜索
  enableThinking?: boolean; //是否支持思考模式
  chargeType?: string;      //计费类型
  chargeTypeName?: string;  //计费类型名称
  price?: string;           //价格列表
  parameters?: string;      //模型支持参数
}

export interface ModelPrice {
  promptPrice?: number;
  completionPrice?: number;
  reasoningPrice?: number;
  perPrice?: number;
  credit?: number;
  conditions?: ModelPriceCondition[];
  currency?: string;
}

export interface ModelPriceCondition {
  fieldKeys: string;
  fieldValues: string;
  price?: number;
  credit: number;
}

export interface ModelParameters {
  supports?: string[];
  resolutions?: string[];
  qualities?: string[];
  maxPromptLength?: number;
  maxNum?: number;
  maxReferenceNum?: number;
  maxSeed?: number;
  durations?: string[];
  voices?: string[];
  languageTypes?: string[];
  fileFormats?: string[];
  maxFileSize?: string;
}

/**
 * 模型新增对象
 */
export interface ModelBo {
  id?: string;              //模型ID
  status?: string;          //状态
  provider?: string;        //供应商
  name?: string;            //模型名称
  alias?: string;           //模型别名
  types?: string[];         //模型类型
  tags?: string[];          //模型标签
  inputs?: string[];        //输入支持
  outputs?: string[];       //输出支持
  remark?: string;          //模型描述
  contextWindow?: number;   //上下文长度
  baseUrl?: string;         //代理地址
  apiKey?: string;          //API密钥
  hot?: boolean;            //是否热门模型
  enableSearch?: boolean;   //是否支持互联网搜索
  enableThinking?: boolean; //是否支持思考模式
  chargeType?: string;      //计费类型
}
