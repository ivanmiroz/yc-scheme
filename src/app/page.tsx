// src/app/page.tsx
import {ScaleTabs} from '../components/ScaleTabs';
import {InfrastructureChoose} from '../components/InfrastructureChoose/InfrastructureChoose';

export default function Home() {
    return (
        <main style={{height: '100vh', width: '100%', overflow: 'hidden'}}>
            <ScaleTabs />
            <InfrastructureChoose />
        </main>
    );
}
