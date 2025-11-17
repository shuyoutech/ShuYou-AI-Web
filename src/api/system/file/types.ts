export interface FileQuery {
  fileName?: string;
  originalFileName?: string;
}

export interface FileVo {
  id: string; //文件ID
  createTime: string; //上传时间
  createUserId: string; //上传人ID
  createUserName: string;//上传人名称
  fileName: string; //文件名称
  originalFileName: string; //原文件名称
  fileSize: number; //文件大小
  fileSizeFormat: string; //文件大小格式
  fileType: string; //文件格式
  mimeType: string; //媒体类型
  filePath: string; //文件路径
  fileHash: string; //文件Hash
  fileUrl: string; //文件url
  bucketName: string; //桶名称
  fileKey: string; //文件key
}
