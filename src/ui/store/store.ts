import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';
import authReducer from '../features/auth/slices/authSlice';
import bucketReducer from '../features/bucket/slices/bucketSlice';
import incomeReducer from '../features/income/slices/incomeSlice';

// Import API slices to ensure they're registered
import '../features/auth/api/authApi';
import '../features/bucket/api/bucketApi';
import '../features/income/api/incomeSourceApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bucket: bucketReducer,
    income: incomeReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
