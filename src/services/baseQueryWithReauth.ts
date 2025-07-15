import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const baseUrl = process.env.REACT_APP_API_URL as string;

const baseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      console.error('No refresh token. Logging out.');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return result;
    }

    const refreshResponse = await fetchBaseQuery({ baseUrl })(
      {
        url: '/auth/refresh-token',
        method: 'POST',
        body: { refreshToken }
      },
      api,
      extraOptions
    );

    if (refreshResponse.data) {
      const newAccessToken = (refreshResponse.data as any).accessToken;
      localStorage.setItem('token', newAccessToken);

      // Retry the original request with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      console.error('Refresh token invalid. Clearing storage.');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }

  return result;
};

export default baseQueryWithReauth;
