import React, { useState } from 'react';
import { Button } from "../components/ui/button";
import { Upload, Database, FileSpreadsheet, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createSheet, syncSheet, syncDatabase, processUploadLabels } from '../utils/sheetUtils';
import { doc, setDoc, getFirestore, updateDoc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { useLabels } from '../context/LabelContext';
import { useNotes } from '../context/NotesContext';
import { useTemplates } from '../context/TemplateContext';
import { useSheet } from '../context/SheetContext';

const ActionButton = ({ icon: Icon, label, description, onClick, loading, disabled }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          onClick={onClick}
          disabled={disabled || loading}
          className="h-auto p-3 flex gap-3 items-center w-full rounded-lg shadow-sm hover:shadow-md transition-all border text-sm"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
          <span className="text-sm">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-sm">{description}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const NoSheetView = ({ onCreateSheet, isLoading }) => (
  <div className="flex flex-col items-center justify-center space-y-6 p-8">
    <FileSpreadsheet className="h-16 w-16 text-muted-foreground" />
    <div className="text-center space-y-2">
      <h3 className="text-xl font-semibold">No Sheet Connected</h3>
      <p className="text-muted-foreground">Create a Google Sheet to manage your LinkedIn connections</p>
    </div>
    <Button
      size="lg"
      onClick={onCreateSheet}
      disabled={isLoading}
      className="w-full max-w-md"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : null}
      Create New Sheet
    </Button>
  </div>
);

const formatDate = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

const SheetActions = ({ loadingStates, onSync, onUpload }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-3">
    <ActionButton
      icon={FileSpreadsheet}
      label="Update Sheet"
      description="Sync latest LinkedIn data to Google Sheet"
      onClick={() => onSync("Sheet")}
      loading={loadingStates.syncSheet}
    />
    <ActionButton
      icon={Database}
      label="Update Database"
      description="Sync Google Sheet changes to database"
      onClick={() => onSync("Database")}
      loading={loadingStates.syncDB}
    />
    <ActionButton
      icon={Upload}
      label="Upload Labels"
      description="Process and update connection labels"
      onClick={onUpload}
      loading={loadingStates.updateLabels}
    />
  </div>
);

const SheetPage = () => {
  const { user } = useAuth();
  const { sheetData, setSheetData, isLoading: contextLoading, getGoogleToken } = useSheet();
  const [loadingStates, setLoadingStates] = useState({
    create: false,
    syncSheet: false,
    syncDB: false,
    updateLabels: false
  });

  const { labels, activeSharedLabels, getLabelProfiles } = useLabels();
  const { notes, getNoteWithProfile } = useNotes();
  const { templates } = useTemplates();

  const handleCreate = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, create: true }));
      const token = await getGoogleToken();
      const firstName = user.displayName.split(' ')[0];

      const sheet = await createSheet(token, `${firstName} - LinkedIn Manager`);
      const currentTime = new Date().toISOString();

      const newSheetData = {
        sd: {
          id: sheet.spreadsheetId,
          ca: currentTime,
          ls: currentTime
        }
      };

      await updateDoc(doc(getFirestore(), 'users', user.uid), newSheetData);
      setSheetData(newSheetData.sd);

      window.open(`https://docs.google.com/spreadsheets/d/${newSheetData.sd.id}`, '_blank');
    } catch (error) {
      console.error('Error creating sheet:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, create: false }));
    }
  };

  const handleSync = async (syncType) => {
    if (!sheetData?.id) return;
    const loadingKey = syncType === "Sheet" ? "syncSheet" : "syncDB";

    try {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
      const token = await getGoogleToken();

      const data = {
        labels: { labels },
        sharedLabels: activeSharedLabels,
        notes,
        shortcuts: templates
      };

      if (syncType === "Sheet") {
        await syncSheet(sheetData?.id, token, { ...data, getLabelProfiles, getNoteWithProfile });
      } else {
        await syncDatabase(sheetData?.id, token, user.uid, data);
      }

      const updatedSheetData = {
        ...sheetData,
        ls: new Date().toISOString()
      };

      await updateDoc(doc(getFirestore(), 'users', user.uid), {
        sd: updatedSheetData
      });

      setSheetData(updatedSheetData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleUpload = async () => {
    if (!sheetData?.id) return;
    try {
      setLoadingStates(prev => ({ ...prev, updateLabels: true }));
      const token = await getGoogleToken();

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetData.id}/values/Profile Data`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sheetResponse = await response.json();
      const sheetRows = sheetResponse.values || [];

      if (sheetRows.length === 0) return

      const headerIndices = {};
      sheetRows[0].forEach((header, index) => {
        headerIndices[header] = index;
      });

      const updatedRowCount = await processUploadLabels(
        sheetRows,
        headerIndices,
        user.uid,
        sheetData.id,
        token
      );

      if (updatedRowCount > 0) {
        const updatedSheetData = {
          ...sheetData,
          ls: new Date().toISOString()
        };

        await setDoc(doc(getFirestore(), 'sheets', user.uid), updatedSheetData);
        setSheetData(updatedSheetData);
      }

    } catch (error) {
      console.error('Error processing upload:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, updateLabels: false }));
    }
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-lg font-semibold mb-2">Sheet Manager</h1>
      <span className="text-muted-foreground mb-2">
        Sync and manage your LinkedIn connections using Google Sheets. {sheetData && <b>Last synced: {formatDate(sheetData.ls)}</b> }
      </span>
      <div>
        {!sheetData ? (
          <NoSheetView
            onCreateSheet={handleCreate}
            isLoading={loadingStates.create}
          />
        ) : (
          <div>
            <SheetActions
              loadingStates={loadingStates}
              onSync={handleSync}
              onUpload={handleUpload}
            />
            <div className="flex flex-col items-center gap-4 pb-4">
              <Button
                variant="outline"
                onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${sheetData?.id}`, '_blank')}
                className="w-full max-w-md p-6"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Google Sheet
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetPage;