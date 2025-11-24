import { baseApi } from '../../../store/baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUser: builder.query<AuthUser | null, void>({
      queryFn: async () => {
        try {
          const user = await window.electron.getUser();
          return { data: user };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Auth'],
    }),

    signIn: builder.mutation<AuthUser, SignInParams>({
      queryFn: async (credentials) => {
        try {
          const user = await window.electron.signIn(credentials);
          return { data: user };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Auth'],
    }),

    signUp: builder.mutation<AuthUser, SignUpParams>({
      queryFn: async (params) => {
        try {
          const user = await window.electron.signUp(params);
          return { data: user };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Auth'],
    }),

    signOut: builder.mutation<void, void>({
      queryFn: async () => {
        try {
          await window.electron.signOut();
          return { data: undefined };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const {
  useGetUserQuery,
  useSignInMutation,
  useSignUpMutation,
  useSignOutMutation,
} = authApi;
