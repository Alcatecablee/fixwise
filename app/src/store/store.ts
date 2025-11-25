// Warning: Potential circular dependency detected
// Consider refactoring to avoid circular imports

// Warning: Potential circular dependency detected
// Consider refactoring to avoid circular imports

// Warning: Potential circular dependency detected
// Consider refactoring to avoid circular imports

// Warning: Potential circular dependency detected
// Consider refactoring to avoid circular imports

// Warning: Potential circular dependency detected
// Consider refactoring to avoid circular imports

// Warning: Potential circular dependency detected
// Consider refactoring to avoid circular imports

// Warning: Potential circular dependency detected
// Consider refactoring to avoid circular imports

// Warning: Potential circular dependency detected
// Consider refactoring to avoid circular imports

import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 