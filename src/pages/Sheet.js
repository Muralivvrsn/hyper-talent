import React, { useState } from 'react';
import { Button } from "../components/ui/button";
import { Upload, Database, FileSpreadsheet, Loader2, ExternalLink} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchCollectionData, createSheet, syncSheet, syncDatabase, processUploadLabels } from '../utils/sheetUtils';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { useSheet } from '../context/SheetContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

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
      label="Update Labels"
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

  const handleCreate = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, create: true }));
      const token = await getGoogleToken();
      const firstName = user.displayName.split(' ')[0];
      const data = await fetchCollectionData(user.uid);

      const sheet = await createSheet(token, `${firstName} - LinkedIn Manager`);
      await syncSheet(sheet.spreadsheetId, token, data);

      const newSheetData = {
        sheetUrl: `https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}`,
        spreadsheetId: sheet.spreadsheetId,
        createdAt: new Date().toISOString(),
        lastSync: new Date().toISOString()
      };

      await setDoc(doc(getFirestore(), 'sheets', user.uid), newSheetData);
      setSheetData(newSheetData);
      window.open(newSheetData.sheetUrl, '_blank');
    } catch (error) {
      console.error('Error creating sheet:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, create: false }));
    }
  };

  const handleSync = async (syncType) => {
    if (!sheetData?.spreadsheetId) return;
    const loadingKey = syncType === "Sheet" ? "syncSheet" : "syncDB";
    try {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
      const token = await getGoogleToken();
      const data = await fetchCollectionData(user.uid);

      if (syncType === "Sheet") {
        await syncSheet(sheetData.spreadsheetId, token, data);
      } else {
        await syncDatabase(sheetData.spreadsheetId, token, data, user.uid);
      }

      const updatedSheetData = {
        ...sheetData,
        lastSync: new Date().toISOString()
      };
      await setDoc(doc(getFirestore(), 'sheets', user.uid), updatedSheetData);
      setSheetData(updatedSheetData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleUpload = async () => {
    if (!sheetData?.spreadsheetId) return;
    try {
      setLoadingStates(prev => ({ ...prev, updateLabels: true }));
      const token = await getGoogleToken();

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetData.spreadsheetId}/values/Profile Data`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sheetResponse = await response.json();
      const sheetRows = sheetResponse.values || [];

      if (sheetRows.length === 0) {
        console.log('No data found in sheet');
        return;
      }

      const headerIndices = {};
      sheetRows[0].forEach((header, index) => {
        headerIndices[header] = index;
      });

      const updatedRowCount = await processUploadLabels(
        sheetRows,
        headerIndices,
        user.uid,
        sheetData.spreadsheetId,
        token
      );

      if (updatedRowCount > 0) {
        const updatedSheetData = {
          ...sheetData,
          lastSync: new Date().toISOString()
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
        Sync and manage your LinkedIn connections using Google Sheets. <b>Last synced: {sheetData?.lastSync ? formatDate(sheetData?.lastSync) : ""}</b>
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
            <div className="flex flex-col items-center gap-4 pb-4 border-b">
              <Button
                variant="outline"
                onClick={() => window.open(sheetData.sheetUrl, '_blank')}
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