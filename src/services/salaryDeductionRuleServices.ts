// services/salaryDeductionRuleServices.ts
import { api } from './api';

export interface DeductionRule {
  _id: string;
  name: string;
  code: string;
  type: 'tax' | 'hInsurance' | 'pf' | 'esi' | 'pTax' | 'tds' | 'loan' | 'advance' | 'other';
  active: boolean;
  compute: {
    mode: 'fixed' | 'percent_of_basic' | 'percent_of_gross';
    fixedAmount?: number;
    percent?: number;
  };
}

export const salaryDeductionRuleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listDeductionRules: builder.query<{ success: boolean; data: DeductionRule[] }, { activeOnly?: boolean } | void>({
      query: (arg) => {
        const activeOnly = (arg as any)?.activeOnly ?? true;
        // If your backend supports ?active=true, great; otherwise we'll filter client-side.
        return `/salary-deduct-rule${activeOnly ? '?active=true' : ''}`;
      },
      providesTags: ['DeductionRules' as any],
      transformResponse: (resp: any) => resp
    }),
  }),
});

export const { useListDeductionRulesQuery } = salaryDeductionRuleApi;
