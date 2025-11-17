export interface AigcPromptQuery {
  type?: string
  scene?: string
  name?: string;
}

export interface AigcPromptVo {
  id: string;//ID
  type: string;//模型类型
  typeName: string;//模型类型名称
  scene: string;//使用场景
  sceneName: string;//使用场景名称
  name: string;//模板名称
  content: string;//模板内容
  variables: string[];//模板变量列表
  tags: string[];
}

