import { createSlice } from '@reduxjs/toolkit';
import { incomeSourceApi } from '../api/incomeSourceApi';
import { incomeCategoryApi } from '../api/incomeCategoryApi';

interface IncomeState {
  incomeSources: IncomeSource[];
  incomeCategories: IncomeCategory[];
}

const initialState: IncomeState = {
  incomeSources: [],
  incomeCategories: [],
};

const incomeSlice = createSlice({
  name: 'income',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Income Source matchers
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
      )
      // Income Category matchers
      .addMatcher(
        incomeCategoryApi.endpoints.getIncomeCategories.matchFulfilled,
        (state, action) => {
          state.incomeCategories = action.payload;
        },
      )
      .addMatcher(
        incomeCategoryApi.endpoints.createIncomeCategory.matchFulfilled,
        (state, action) => {
          state.incomeCategories.push(action.payload);
        },
      )
      .addMatcher(
        incomeCategoryApi.endpoints.updateIncomeCategory.matchFulfilled,
        (state, action) => {
          const index = state.incomeCategories.findIndex(
            (c) => c.id === action.payload.id,
          );
          if (index !== -1) {
            state.incomeCategories[index] = action.payload;
          }
        },
      );
  },
});

export default incomeSlice.reducer;
