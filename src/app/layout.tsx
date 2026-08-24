import type {Metadata} from 'next';
import {App} from '../components/App';

import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';
import '../styles/globals.scss';

export const metadata: Metadata = {
    title: 'Масштабируйтесь безопасно',
    description: 'Gravity UI – Next.js App Example',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="ru">
            <body className="g-root g-root_theme_light">
                <App>{children}</App>
            </body>
        </html>
    );
}
