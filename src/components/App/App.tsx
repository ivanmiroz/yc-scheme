// src/components/App/App.tsx
'use client';

import React from 'react';
import {ThemeProvider} from '@gravity-ui/uikit';

interface AppProps {
    children: React.ReactNode;
}

export const App: React.FC<AppProps> = ({children}) => {
    return (
        <ThemeProvider theme="light">
            <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>{children}</div>
        </ThemeProvider>
    );
};
