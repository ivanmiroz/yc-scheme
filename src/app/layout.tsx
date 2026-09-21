import type {Metadata} from 'next';
import localFont from 'next/font/local';
import {App} from '../components/App';

import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';
import '../styles/globals.scss';

// Шрифт для основного текста
const ysText = localFont({
    src: '../fonts/YS-Text-Regular.woff2',
    weight: '400',
    style: 'normal',
    variable: '--font-ys-text',
    display: 'swap',
});

const ysDisplay = localFont({
    src: [
        {
            path: '../fonts/YS-Display-Regular.woff2',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../fonts/YS-Display-Medium.woff2',
            weight: '500',
            style: 'normal',
        },
        {
            path: '../fonts/YS-Display-Bold.woff2',
            weight: '700',
            style: 'normal',
        },
        {
            path: '../fonts/YS-Display-Heavy.woff2',
            weight: '800',
            style: 'normal',
        },
    ],
    variable: '--font-ys-display', // Создаем свою переменную
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Масштабируйтесь безопасно',
    description: 'Гибридная инфраструктура',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="ru">
            <body className={`g-root g-root_theme_light ${ysDisplay.variable} ${ysText.variable}`}>
                <App>{children}</App>
            </body>
        </html>
    );
}
