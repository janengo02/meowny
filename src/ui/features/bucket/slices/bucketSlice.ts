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
    builder.addMatcher(
      bucketApi.endpoints.createBucket.matchFulfilled,
      (state, action) => {
        state.buckets.push(action.payload);
      }
    );
  },
});

export default bucketSlice.reducer;
