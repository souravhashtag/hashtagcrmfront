import apiClient from './apiClient';

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('auth/login', payload);
    return response.data;
  } catch (error) {
    throw error; 
  }
};

// Optional helper
export const logout = () => {
  localStorage.removeItem('token');
};
