import { baseApi } from '../../../store/baseApi';

export const userPreferencesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardLayout: builder.query<DashboardLayoutPreference | null, void>({
      queryFn: async () => {
        try {
          const preference = await window.electron.getUserPreference({
            preference_key: 'dashboard_layout',
          });

          if (!preference) {
            return { data: null };
          }

          return {
            data: preference.preference_value as DashboardLayoutPreference,
          };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['UserPreferences'],
    }),
    saveDashboardLayout: builder.mutation<
      UserPreference,
      DashboardLayoutPreference
    >({
      queryFn: async (layout) => {
        try {
          const preference = await window.electron.upsertUserPreference({
            preference_key: 'dashboard_layout',
            preference_value: layout,
          });
          return { data: preference };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['UserPreferences'],
    }),
  }),
});

export const {
  useGetDashboardLayoutQuery,
  useSaveDashboardLayoutMutation,
} = userPreferencesApi;
