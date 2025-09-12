import { createContext, useContext } from 'react';
import { EditorEngine } from './index';

const EditorEngineContext = createContext<EditorEngine | null>(null);

export const EditorEngineProvider = EditorEngineContext.Provider;

export function useEditorEngine(): EditorEngine {
    const context = useContext(EditorEngineContext);
    if (!context) {
        throw new Error('useEditorEngine must be used within an EditorEngineProvider');
    }
    return context;
}
