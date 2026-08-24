'use client';

import React from 'react';
import {ThemeProvider} from '@gravity-ui/uikit';

interface AppProps {
    children: React.ReactNode;
}

export const App: React.FC<AppProps> = ({children}) => {
    return (
        <ThemeProvider theme="light">
            {children}
        </ThemeProvider>
    );
};
