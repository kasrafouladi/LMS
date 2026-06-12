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
  const raw = await request<unknown>('/auth/login', {
    method: 'POST',
    body: { email, password },
    noAuth: true,
  });
  
  console.log('LOGIN RAW RESPONSE:', raw, typeof raw);
  
  const token = typeof raw === 'string' ? raw : (raw as any).access_token;
  
  if (!token) throw new Error('توکن دریافت نشد');
  
  saveToken(token);
  
  let role: 'Admin' | 'Teacher' | 'Student' = 'Student';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('JWT PAYLOAD:', payload);
    role = payload.role;
  } catch {
    console.error('خطا در decode توکن');
  }
  
  return { access_token: token, token_type: 'bearer', role };
}

export async function register(payload: {
  full_name: string;
  email: string;
  password: string;
  role?: 'Student' | 'Teacher';
  phone_number?: string;
  date_of_birth?: string;
}) {
  return request('/auth/register', { 
    method: 'POST', 
    body: payload, 
    noAuth: true 
  });
}

export async function getMe(): Promise<MeResponse> {
  return request<MeResponse>('/auth/me');
}