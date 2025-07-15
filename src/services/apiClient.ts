import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

interface RefreshResponse {
  accessToken: string;
}

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token !== null && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token found');

        const refreshResponse = await axios.post<RefreshResponse>(
          `${process.env.REACT_APP_API_URL}/auth/refresh-token`,
          { refreshToken }
        );

        const newAccessToken = refreshResponse.data.accessToken;
        localStorage.setItem('token', newAccessToken);

        if (error.config && error.config.headers) {
          error.config.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return axios(error.config);
        }

      } catch (refreshError) {
        console.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
