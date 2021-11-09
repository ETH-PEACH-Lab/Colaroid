import { configureStore } from '@reduxjs/toolkit';
import notebookReducer from '../features/notebook/notebookSlice';
export const store = configureStore({
  reducer: {
      notebook: notebookReducer
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;