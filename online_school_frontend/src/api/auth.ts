import { request, saveToken } from './client';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: 'Admin' | 'Teacher' | 'Student';
}

export interface MeResponse {
  sub: string;
  email: string;
  fullname: string;
  role: 'Admin' | 'Teacher' | 'Student';
  exp: number;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    noAuth: true,
  });
  saveToken(data.access_token);
  return data;
}

export async function register(payload: {
  full_name: string;
  email: string;
  password: string;
  role?: 'Student' | 'Teacher';
  phone_number?: string;
  date_of_birth?: string;
}) {
  return request('/auth/register', { method: 'POST', body: payload, noAuth: true });
}

export async function getMe(): Promise<MeResponse> {
  return request<MeResponse>('/auth/me');
}
