import { createSlice } from '@reduxjs/toolkit';
import { bucketApi } from '../api/bucketApi';

interface BucketState {
  buckets: Bucket[];
}

const initialState: BucketState = {
  buckets: [],
};

const bucketSlice = createSlice({
  name: 'bucket',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(
        bucketApi.endpoints.getBuckets.matchFulfilled,
        (state, action) => {
          state.buckets = action.payload;
        },
      )
      .addMatcher(
        bucketApi.endpoints.createBucket.matchFulfilled,
        (state, action) => {
          state.buckets.push(action.payload);
        },
      )
      .addMatcher(
        bucketApi.endpoints.updateBucket.matchFulfilled,
        (state, action) => {
          const index = state.buckets.findIndex(
            (b) => b.id === action.payload.id,
          );
          if (index !== -1) {
            state.buckets[index] = action.payload;
          }
        },
      );
  },
});

export default bucketSlice.reducer;
