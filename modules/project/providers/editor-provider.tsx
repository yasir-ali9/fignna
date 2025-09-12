'use client';

import { EditorEngine } from '@/lib/stores/editor';
import { EditorEngineProvider } from '@/lib/stores/editor/hooks';
import { ReactNode, useMemo } from 'react';

interface EditorProviderProps {
    children: ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps) {
    const editorEngine = useMemo(() => new EditorEngine(), []);

    return (
        <EditorEngineProvider value={editorEngine}>
            {children}
        </EditorEngineProvider>
    );
}
