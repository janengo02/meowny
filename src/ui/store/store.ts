import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';
import authReducer from '../features/auth/slices/authSlice';
import incomeReducer from '../features/income/slices/incomeSlice';
import accountReducer from '../features/account/slices/accountSlice';

// Import API slices to ensure they're registered
import '../features/auth/api/authApi';
import '../features/bucket/api/bucketApi';
import '../features/income/api/incomeSourceApi';
import '../features/account/api/accountApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    income: incomeReducer,
    account: accountReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
