import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth from './baseQueryWithReauth';
export const tagTypes = [
  'Role',
  'Menu',
  'Employee',
  'Permission',
  'Leave',
  'Assignment',
  'Event',
  'Notice',
  'Company',
  'Country',
  'Payroll',  
  'Roster',
  'RosterStats',
  'DeductionRules'
] as const;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes,
  endpoints: () => ({}),
});