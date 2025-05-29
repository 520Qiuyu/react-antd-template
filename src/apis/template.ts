import type { IPageData } from '@/types/request';
import { post, get } from 'utils/request';
export const base = window.baseUrl;

export const testUseGetList = (param?: any) =>
  get<IPageData<{ id: string; name: string }>>(`/api/testUse/getList`, param);

export const testUseGetDrop = (param?: any) => get(`/api/testUse/getDrop`, param);
