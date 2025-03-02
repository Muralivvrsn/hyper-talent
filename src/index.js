import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { ProfileNoteProvider } from './context/ProfileNoteContext';
import { SheetProvider } from './context/SheetContext';
import { MigrationProvider } from './context/MigrationContext';
import { LabelProvider } from './context/LabelContext';
import { NotesProvider } from './context/NotesContext';
import { OtherUsersProvider } from './context/OtherUsersContext';
import { UserActionProvider } from './context/UserActionContext';
import { GuideProvider } from './context/GuideContext';
import { FeedbackProvider } from './context/FeedbackContext'
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <AuthProvider>
        <DataProvider>
            <MigrationProvider>
                <OtherUsersProvider>
                    <UserActionProvider>
                        <ThemeProvider>
                            <FeedbackProvider>
                                <GuideProvider>
                                    <LabelProvider>
                                        <NotesProvider>
                                            <ProfileNoteProvider>
                                                <SheetProvider>
                                                    <App />
                                                </SheetProvider>
                                            </ProfileNoteProvider>
                                        </NotesProvider>
                                    </LabelProvider>
                                </GuideProvider>
                            </FeedbackProvider>
                        </ThemeProvider>
                    </UserActionProvider>
                </OtherUsersProvider>
            </MigrationProvider>
        </DataProvider>
    </AuthProvider>
);

