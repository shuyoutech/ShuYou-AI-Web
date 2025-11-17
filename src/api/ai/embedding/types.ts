export interface EmbeddingTextBo {
  knowledgeId: string;//知识库ID
  docName: string;    //文档名称
  docContent: string; //文档内容
}

export interface EmbeddingFileBo {
  knowledgeId: string; //知识库ID
  docFileIds: string[];//文档名称
}

export interface EmbeddingSearchBo {
  knowledgeId: string; //知识库ID
  text: string;        //内容
}

export interface EmbeddingSearchVo {
  text: string; //内容
  score: number;//得分
}


