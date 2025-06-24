import apiClient from './apiClient';

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}
interface ScreenShotPayload {
    image: File;
}
export interface ScreenShotResponse {
  _id: string;
  image: string;
  userid: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}
export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('auth/login', payload);
    return response.data;
  } catch (error) {
    throw error; 
  }
};
export const ScreenSortUpload = async (payload: ScreenShotPayload): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('auth/screenshotupload', payload);
    return response.data;
  } catch (error) {
    throw error; 
  }
};
export const getScreenshots = async (): Promise<ScreenShotResponse[]> => {
  try {
    const response = await apiClient.get<ScreenShotResponse[]>('/auth/getscreenshot');
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getUserData = async (): Promise<any> => {
  try {
    const response = await apiClient.get<any>('/auth/getuserdata');
    return response.data;
  } catch (error) {
    throw error;
  }
};
// Optional helper
export const logout = async() => {
    try {
      const response = await apiClient.post<any>('auth/userlogout');
        return response.data;
    } catch (error) {
        throw error; 
    }
};
