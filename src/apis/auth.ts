import { post } from 'utils/request';
import type {
  LoginRequestParams,
  LoginResponseData,
  RegisterRequestParams,
  RegisterResponseData,
} from '@/types/auth';

export const reqPostLogin = (data: LoginRequestParams) =>
  post<LoginResponseData>('/auth/login', data);

export const reqPostRegister = (data: RegisterRequestParams) =>
  post<RegisterResponseData>('/auth/register', data);
