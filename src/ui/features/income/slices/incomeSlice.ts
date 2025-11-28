import { createSlice } from '@reduxjs/toolkit';
import { incomeSourceApi } from '../api/incomeSourceApi';

interface IncomeState {
  incomeSources: IncomeSource[];
}

const initialState: IncomeState = {
  incomeSources: [],
};

const incomeSlice = createSlice({
  name: 'income',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(
        incomeSourceApi.endpoints.getIncomeSources.matchFulfilled,
        (state, action) => {
          state.incomeSources = action.payload;
        },
      )
      .addMatcher(
        incomeSourceApi.endpoints.createIncomeSource.matchFulfilled,
        (state, action) => {
          state.incomeSources.push(action.payload);
        },
      )
      .addMatcher(
        incomeSourceApi.endpoints.updateIncomeSource.matchFulfilled,
        (state, action) => {
          const index = state.incomeSources.findIndex(
            (i) => i.id === action.payload.id,
          );
          if (index !== -1) {
            state.incomeSources[index] = action.payload;
          }
        },
      );
  },
});

export default incomeSlice.reducer;
