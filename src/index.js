import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { ProfileNoteProvider } from './context/ProfileNoteContext';
import { SheetProvider } from './context/SheetContext';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

    <AuthProvider>
        <DataProvider><ProfileNoteProvider><ThemeProvider><SheetProvider><App /></SheetProvider></ThemeProvider></ProfileNoteProvider></DataProvider>
    </AuthProvider>

);

