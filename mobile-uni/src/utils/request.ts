import { API_BASE_URL } from '@/config';
import type { ApiSuccess } from '@/types/common';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  url: string;
  method?: RequestMethod;
  data?: Record<string, unknown>;
}

export function request<T>({ url, method = 'GET', data }: RequestOptions) {
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      success: (response) => {
        const payload = response.data as ApiSuccess<T> & {
          error?: { message?: string };
        };

        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300 && payload?.success) {
          resolve(payload.data);
          return;
        }

        reject(new Error(payload?.error?.message || payload?.message || '请求失败'));
      },
      fail: (error) => {
        reject(new Error(error.errMsg || '网络异常'));
      }
    });
  });
}
