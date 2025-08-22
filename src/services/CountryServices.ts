import { api } from './api';

export interface Country {
  _id: string;
  name: string;
  code2: string;        // ✅ Changed from 'code' to 'code2'
  code3: string;        // ✅ Added code3
  capital?: string;     // ✅ Added optional capital
  region?: string;      // ✅ Added optional region
  subregion?: string;   // ✅ Added optional subregion
  states: State[];
  createdAt: string;
  updatedAt: string;
}

export interface State {
  code: string;         // ✅ Your states do have 'code' field
  name: string;
  key?: string;         // ✅ Made key optional since you're using code as primary identifier
}

export interface CountryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const countryServices = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all countries
    getCountries: builder.query<any, CountryQueryParams>({
      query: ({ page = 1, limit = 100, search = '' }) => {
        let url = `/countries?page=${page}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      providesTags: ['Country'],
    }),

    // Get country by ID or code
    getCountryById: builder.query<any, string>({
      query: (idOrCode) => `/countries/${idOrCode}`,
      providesTags: (result, error, id) => [{ type: 'Country', id }],
    }),

    // Create new country
    createCountry: builder.mutation<any, {
      name: string;
      code2: string;      // ✅ Updated to use code2
      code3?: string;     // ✅ Added optional code3
      states?: State[];
    }>({
      query: (body) => ({
        url: '/countries',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Country'],
    }),

    // Update country
    updateCountry: builder.mutation<any, { 
      idOrCode: string; 
      data: Partial<{
        name: string;
        code2: string;    // ✅ Updated to use code2
        code3?: string;   // ✅ Added optional code3
        states?: State[];
      }> 
    }>({
      query: ({ idOrCode, data }) => ({
        url: `/countries/${idOrCode}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { idOrCode }) => [
        { type: 'Country', id: idOrCode },
        'Country',
      ],
    }),

    // Delete country
    deleteCountry: builder.mutation<any, string>({
      query: (idOrCode) => ({
        url: `/countries/${idOrCode}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Country'],
    }),

    // Add or update state in country
    addOrUpdateState: builder.mutation<any, {
      countryIdOrCode: string;
      stateData: State;
    }>({
      query: ({ countryIdOrCode, stateData }) => ({
        url: `/countries/${countryIdOrCode}/states`,
        method: 'POST',
        body: stateData,
      }),
      invalidatesTags: (result, error, { countryIdOrCode }) => [
        { type: 'Country', id: countryIdOrCode },
        'Country',
      ],
    }),

    // Remove state from country
    removeState: builder.mutation<any, {
      countryIdOrCode: string;
      stateKey: string;
    }>({
      query: ({ countryIdOrCode, stateKey }) => ({
        url: `/countries/${countryIdOrCode}/states/${stateKey}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { countryIdOrCode }) => [
        { type: 'Country', id: countryIdOrCode },
        'Country',
      ],
    }),

    // Bulk upsert countries
    bulkUpsertCountries: builder.mutation<any, {
      countries: Array<{
        name: string;
        code2: string;    // ✅ Updated to use code2
        code3?: string;   // ✅ Added optional code3
        states?: State[];
      }>;
    }>({
      query: (body) => ({
        url: '/countries/bulk/upsert',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Country'],
    }),
  }),
});

export const {
  useGetCountriesQuery,
  useGetCountryByIdQuery,
  useCreateCountryMutation,
  useUpdateCountryMutation,
  useDeleteCountryMutation,
  useAddOrUpdateStateMutation,
  useRemoveStateMutation,
  useBulkUpsertCountriesMutation,
} = countryServices;