'use client';

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import nestFestTheme from '@/lib/theme';

interface MuiProviderProps {
  children: React.ReactNode;
}

export default function MuiProvider({ children }: MuiProviderProps) {
  return (
    <ThemeProvider theme={nestFestTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}