import api from "@/utils/axios.ts";
import type {AxiosResponse} from "axios";
import type {FileQuery, FileVo} from "@/api/system/file/types.ts";

/**
 * 文件管理-上传
 */
export function fileUploadApi(file: any): Promise<AxiosResponse<FileVo>> {
  const formData = new FormData();
  formData.append('file', file.blob(), file.filename());
  return api({
    url: '/file/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 文件管理-下载
 */
export function fileDownloadApi(fileId: string) {
  return api({
    url: '/file/download/' + fileId,
    method: 'post',
    responseType: 'blob',
  });
}

/**
 * 文件管理-预览
 */
export function filePreviewApi(fileId: string): Promise<AxiosResponse<string>> {
  return api({
    url: '/file/preview/' + fileId,
    method: 'post',
  });
}

/**
 * 文件管理-删除
 */
export function fileDeleteApi(fileId: string) {
  return api({
    url: '/file/delete/' + fileId,
    method: 'post',
  });
}

/**
 * 文件管理-分页
 */
export function filePageApi(data: PageQuery<FileQuery>): Promise<AxiosResponse<PageResult<FileVo>>> {
  return api({
    url: '/file/page',
    method: 'post',
    data: data
  });
}
