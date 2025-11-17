import type {ModelVo} from "@/api/ai/model/types.ts";

export interface ApiKeyQuery {
  name?: string; //名称
}

export interface ApiKeyVo {
  id?: string;              //模型ID
  status?: string;          //状态
  createTime?: string;       //创建时间
  type?: string;            //类型
  userId?: string;          //用户ID
  name?: string;            //名称
  provider?: string;        //供应商
  baseUrl?: string;         //代理地址
  apiKey?: string;          //API密钥
  modelIds?: string[];      //模型IDS
  models?: ModelVo[];       //模型集合
}

export interface ApiKeyBo {
  id?: string;              //模型ID
  name?: string;            //名称
  provider?: string;        //供应商
  baseUrl?: string;         //代理地址
  apiKey?: string;          //API密钥
  modelIds?: string[];      //模型IDS
}
