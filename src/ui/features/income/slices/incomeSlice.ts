import { createSlice } from '@reduxjs/toolkit';
import { incomeSourceApi } from '../api/incomeSourceApi';
import { incomeCategoryApi } from '../api/incomeCategoryApi';
import { incomeHistoryApi } from '../api/incomeHistoryApi';

interface IncomeState {
  incomeSources: IncomeSource[];
  incomeCategories: IncomeCategory[];
  incomeHistories: IncomeHistory[];
}

const initialState: IncomeState = {
  incomeSources: [],
  incomeCategories: [],
  incomeHistories: [],
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
      )
      // Income History matchers
      .addMatcher(
        incomeHistoryApi.endpoints.getIncomeHistories.matchFulfilled,
        (state, action) => {
          state.incomeHistories = action.payload;
        },
      )
      .addMatcher(
        incomeHistoryApi.endpoints.getIncomeHistoriesBySource.matchFulfilled,
        (state, action) => {
          state.incomeHistories = action.payload;
        },
      )
      .addMatcher(
        incomeHistoryApi.endpoints.createIncomeHistory.matchFulfilled,
        (state, action) => {
          state.incomeHistories.push(action.payload);
        },
      )
      .addMatcher(
        incomeHistoryApi.endpoints.updateIncomeHistory.matchFulfilled,
        (state, action) => {
          const index = state.incomeHistories.findIndex(
            (h) => h.id === action.payload.id,
          );
          if (index !== -1) {
            state.incomeHistories[index] = action.payload;
          }
        },
      )
      .addMatcher(
        incomeHistoryApi.endpoints.deleteIncomeHistory.matchFulfilled,
        (state, action) => {
          state.incomeHistories = state.incomeHistories.filter(
            (h) => h.id !== action.meta.arg.originalArgs,
          );
        },
      );
  },
});

export default incomeSlice.reducer;
