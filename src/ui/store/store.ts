import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';
import authReducer from '../features/auth/slices/authSlice';
import bucketReducer from '../features/bucket/slices/bucketSlice';

// Import API slices to ensure they're registered
import '../features/auth/api/authApi';
import '../features/bucket/api/bucketApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bucket: bucketReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
