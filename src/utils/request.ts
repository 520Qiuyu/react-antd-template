import type { IApiResponse } from '@/types/request';
import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import axios from 'axios';
import qs from 'qs';
import eventBus from './eventBus';
import { msgError } from './modal';
import { getLocalToken } from './userInfo';

const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: 1000 * 300,
  withCredentials: true,
  // 更改axios序列化方式 params参数时 传入 [1,2,3] => 1,2,3 // https://github.com/ljharb/qs
  paramsSerializer: (params) => {
    return qs.stringify(params, { arrayFormat: 'comma' });
  },
});

// 响应拦截器
instance.interceptors.response.use(
  // @ts-ignore
  function (response: AxiosResponse<IApiResponse>) {
    /**
     * 1、在响应拦截器中统一处理错误信息
     */
    const config = response.config as IAxiosConfig;
    if (config.showError !== false) {
      const { code, message, meta } = response.data || {};
      checkStatus(code || meta!.statusCode, message || meta!.message, response);
    }

    return response?.data || response;
  },
  function (error: AxiosError<IApiResponse>) {
    console.log('响应拦截器 error', error);
    const response = error.response;
    if (!response) {
      return error;
    }
    const config = error.config as IAxiosConfig;
    const status = error.response?.status;
    if (config.showError !== false) {
      const { message } = error.response?.data || {};
      checkStatus(status!, message, error.response);
    }
    // 401 未登录
    // 触发未登录
    if (response.status === 401) {
      eventBus.emit('401');
    }
    return error?.response?.data || error?.response;
  },
);

// 请求拦截器
instance.interceptors.request.use(function (config: InternalAxiosRequestConfig) {
  let token = getLocalToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

/**
 * @description: get请求方法 R：返回值类型 T：参数类型
 * @param {string} url 请求地址
 * @param {object} params 请求参数
 * @param {object} config 请求配置
 */
export function get<R = any, T = any>(url: string, params?: T, config: IAxiosConfig = {}) {
  return instance.get<any, IApiResponse<R>>(url, { params: params, ...config });
}
/**
 * @description: post请求方法 R：返回值类型 T：参数类型
 * @param url 请求地址
 * @param data 请求参数
 * @param params 请求参数
 * @param config 请求配置
 * @returns
 */
export function post<R = any, D = any, T = any>(
  url: string,
  data?: D,
  params?: T,
  config: IAxiosConfig<D> = {},
) {
  return instance.post<any, IApiResponse<R>>(url, data, { params: params, ...config });
}
/**
 * @description: put请求方法 R：返回值类型 T：参数类型
 * @param url 请求地址
 * @param data  请求参数
 * @param params  请求参数
 * @param config  请求配置
 * @returns
 */
export function put<R = any, D = any, T = any>(
  url: string,
  data?: D,
  params?: T,
  config: IAxiosConfig<D> = {},
) {
  return instance.put<any, IApiResponse<R>>(url, data, { params: params, ...config });
}
/**
 * @description: delete请求方法 R：返回值类型 T：参数类型
 * @param url 请求地址
 * @param params  请求参数
 * @param config  请求配置
 * @returns
 * */
export function del<R = any, T = any>(url: string, params?: T, config: IAxiosConfig = {}) {
  return instance.delete<any, IApiResponse<R>>(url, { params: params, ...config });
}

const STATUS_MAP = {
  200: '请求成功',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};
function checkStatus(code: number, message?: string, response?: AxiosResponse<any>) {
  if (code >= 200 && code < 300) {
    return;
  } else {
    // 白名单 不报错 服务器重定向如登出时会返回302
    const whiteList = [302];
    if (response && whiteList.includes(response.status)) {
      return;
    }
    if (code === 401) {
      eventBus.emit('401');
    }
    return msgError(message || STATUS_MAP[code] || '未知错误');
  }
}

interface IAxiosConfig<D = any> extends AxiosRequestConfig<D> {
  /** 是否显示错误信息 */
  showError?: boolean;
}
