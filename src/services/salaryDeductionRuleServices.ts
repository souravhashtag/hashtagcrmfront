import { api } from './api';


export type RuleModeUI = 'fixed' | 'percent_of_basic' | 'percent_of_gross';

export interface DeductionRule {
  _id: string;
  name: string;
  code: string;
  type: string;
  active: boolean;
  is_applicable: boolean;
  tax_slab: any[];
  compute: {
    mode: RuleModeUI;
    fixedAmount?: number;
    percent?: number;
  };
}

// Backend shape (what your API returns)
export type CalculationMode = 'fixed' | 'percent';
export interface SalaryDeductionRule {
  _id: string;
  name: string;
  code: string;
  is_applicable: boolean;
  calculation_mode: CalculationMode;
  amount: number;        // fixed or percent value
  tax_slab: any[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Map backend -> UI
const mapToUIRule = (r: SalaryDeductionRule): DeductionRule => {
  const known = ['tax', 'hInsurance', 'pf', 'esi', 'pTax', 'tds', 'loan', 'advance'] as const;
  const type = (known as readonly string[]).includes(r.code) ? (r.code as DeductionRule['type']) : 'other';

  return {
    _id: r._id,
    name: r.name,
    code: r.code,
    type,
    active: r.active,

    // ✅ Preserve these
    is_applicable: !!r.is_applicable,
    tax_slab: Array.isArray(r.tax_slab) ? r.tax_slab : [],

    compute:
      r.calculation_mode === 'fixed'
        ? { mode: 'fixed', fixedAmount: r.amount }
        : { mode: 'percent_of_gross', percent: r.amount }, // or swap to your real base if you store it
  };
};


export interface SalaryDeductionRule {
  _id: string;
  name: string;
  code: string;
  is_applicable: boolean;
  calculation_mode: CalculationMode;
  amount: number;           // fixed or percent value
  tax_slab: any[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const salaryDeductionRuleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listDeductionRules: builder.query<{ success: boolean; data: DeductionRule[] }, void>({
      query: () => `/salary-deductions`,
      transformResponse: (resp: { success: boolean; data: SalaryDeductionRule[] }) => ({
        success: resp.success,
        data: (resp.data || []).map(mapToUIRule),
      }),
      providesTags: ['DeductionRules' as any],
    }),

    createDeductionRule: builder.mutation<{ success: boolean; data: DeductionRule }, {
      code: string; name: string; calculation_mode: CalculationMode; amount: number;
      is_applicable?: boolean; active?: boolean; tax_slab?: any[];
    }>({
      query: (body) => ({ url: `/salary-deductions`, method: 'POST', body }),
      transformResponse: (resp: { success: boolean; data: SalaryDeductionRule }) => ({
        success: resp.success,
        data: mapToUIRule(resp.data),
      }),
      invalidatesTags: ['DeductionRules' as any],
    }),

    upsertPercentRule: builder.mutation<{ success: boolean; data: DeductionRule }, {
      code: string; percent: number; name?: string; is_applicable?: boolean; active?: boolean; tax_slab?: any[];
    }>({
      query: (body) => ({ url: `/salary-deductions/percent`, method: 'POST', body }),
      transformResponse: (resp: { success: boolean; data: SalaryDeductionRule }) => ({
        success: resp.success,
        data: mapToUIRule(resp.data),
      }),
      invalidatesTags: ['DeductionRules' as any],
    }),

    getRuleById: builder.query<{ success: boolean; data: DeductionRule }, string>({
      query: (id) => `/salary-deductions/${id}`,
      transformResponse: (resp: { success: boolean; data: SalaryDeductionRule }) => ({
        success: resp.success,
        data: mapToUIRule(resp.data),
      }),
      providesTags: (_r, _e, id) => [{ type: 'DeductionRules' as any, id }],
    }),

    updatePercentRuleById: builder.mutation<{ success: boolean; data: DeductionRule }, {
      id: string; percent: number; name?: string; is_applicable?: boolean; active?: boolean; tax_slab?: any[];
    }>({
      query: ({ id, ...body }) => ({ url: `/salary-deductions/${id}/percent`, method: 'PATCH', body }),
      transformResponse: (resp: { success: boolean; data: SalaryDeductionRule }) => ({
        success: resp.success,
        data: mapToUIRule(resp.data),
      }),
      invalidatesTags: ['DeductionRules' as any],
    }),

    deleteDeductionRule: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/salary-deductions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['DeductionRules' as any],
    }),
  }),
});

export const {
  useListDeductionRulesQuery,
  useCreateDeductionRuleMutation,
  useUpsertPercentRuleMutation,
  useGetRuleByIdQuery,
  useUpdatePercentRuleByIdMutation,
  useDeleteDeductionRuleMutation,
} = salaryDeductionRuleApi;
