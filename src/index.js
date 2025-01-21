import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { ProfileNoteProvider } from './context/ProfileNoteContext';
import { SheetProvider } from './context/SheetContext';
import { MigrationProvider } from './context/MigrationContext';
import { LabelProvider } from './context/LabelContext';
import { NotesProvider } from './context/NotesContext';
import { TemplateProvider } from './context/TemplateContext';
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(

    <AuthProvider>
        <DataProvider>
        <MigrationProvider>
            <SheetProvider>
            <ThemeProvider>
                <LabelProvider>
                    <NotesProvider>
                        <TemplateProvider>
                            <ProfileNoteProvider>
                            <App />
                            </ProfileNoteProvider>
                        </TemplateProvider>
                    </NotesProvider>
                </LabelProvider>
            </ThemeProvider>
            </SheetProvider>
        </MigrationProvider>
        </DataProvider>
    </AuthProvider>

);

