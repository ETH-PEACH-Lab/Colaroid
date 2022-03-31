import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export interface CodeData {
  content: string,
  format: string,
  title: string,
}

export interface CellData {
    message: string,
    hash: string,
    result: CodeData[],
    recording: string
}

export const notebookSlice = createSlice({
    name: 'notebook',
    initialState: {
      value: 0,
      content: [],
      activeEdit: -1,
      viewOption: '1',
      experimentCondition: '1',
      experimentSetting: {
        video: '',
        article: ''
      }
    },
    reducers: {
      initState: (state, action) => {
        state.content = action.payload.content
      },
      appendContent: (state, action) => {
          state.content.push(action.payload);
      },
      deleteCell: (state,  action) => {
          const content = state.content.filter(cell => cell.hash!=action.payload);
          state.content = content
      },
      cleanContent: (state, action) => {
          state.content = []
      },
      updateActiveEdit: (state, action) => {
        state.activeEdit = action.payload;
      },
      changeMarkdown: (state, action) => {
          state.content.forEach(e => {
            if(e.hash === action.payload.hash) {
              e.message = action.payload.message;
            }
          });
      },
      moveCellDown: (state, action) => {
        let target = state.content[action.payload];
        state.content[action.payload] = state.content[action.payload + 1];
        state.content[action.payload + 1] = target;
      },
      moveCellUp: (state, action) => {
        let target = state.content[action.payload];
        state.content[action.payload] = state.content[action.payload - 1];
        state.content[action.payload - 1] = target;
      },
      increment: (state) => {
        // Redux Toolkit allows us to write "mutating" logic in reducers. It
        // doesn't actually mutate the state because it uses the Immer library,
        // which detects changes to a "draft state" and produces a brand new
        // immutable state based off those changes
        state.value += 1;
      },
      decrement: (state) => {
        state.value -= 1;
      },
      incrementByAmount: (state, action) => {
        state.value += action.payload;
      },
      updateViewOption: (state, action) => {
        state.viewOption = action.payload;
      },
      updateExperimentCondition: (state, action) => {
        state.experimentCondition = action.payload;
      },
      updateExperimentSetting: (state, action) => {
        state.experimentSetting = action.payload;
      }
    },
  });
  
  // Action creators are generated for each case reducer function
  export const { increment, decrement, incrementByAmount, appendContent, deleteCell, changeMarkdown, moveCellDown, moveCellUp, initState, cleanContent, updateActiveEdit, updateViewOption, updateExperimentSetting, updateExperimentCondition } = notebookSlice.actions;
  export const selectContent = (state: RootState) => state.notebook.content;
  export const selectActiveEdit = (state: RootState) => state.notebook.activeEdit;
  export const selectViewOption = (state: RootState) => state.notebook.viewOption;
  export const selectExperimentSetting = (state: RootState) => state.notebook.experimentSetting;
  export const selectExperimentCondition = (state: RootState) => state.notebook.experimentCondition;
  export default notebookSlice.reducer;