import React, { useState } from 'react';
import { Button } from "../components/ui/button";
import { Upload, FileSpreadsheet, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createSheet, syncSheet, processUploadLabels } from '../utils/sheetUtils';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { useLabels } from '../context/LabelContext';
import { useNotes } from '../context/NotesContext';
import { useData } from '../context/DataContext';
import { useSheet } from '../context/SheetContext';
import { useUserAction } from '../context/UserActionContext'

const ActionButton = ({ icon: Icon, label, description, onClick, loading, disabled, anyLoading }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          onClick={onClick}
          disabled={disabled || loading || anyLoading}
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

const NoSheetView = ({ onCreateSheet, isLoading, access }) => (
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
      {access === 'create' ? "Create New" : "Connect"} Sheet
    </Button>
  </div>
);

const formatDate = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

const SheetActions = ({ loadingStates, onSync, onUpload }) => {
  const isAnyLoading = Object.values(loadingStates).some(state => state);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-3">
      <ActionButton
        icon={FileSpreadsheet}
        label="Update Sheet"
        description="Sync latest LinkedIn data to Google Sheet"
        onClick={() => onSync("Sheet")}
        loading={loadingStates.syncSheet}
        anyLoading={isAnyLoading && !loadingStates.syncSheet}
      />
      {/* <ActionButton
        icon={Database}
        label="Update Database"
        description="Sync Google Sheet changes to database"
        onClick={() => onSync("Database")}
        loading={loadingStates.syncDB}
        anyLoading={isAnyLoading && !loadingStates.syncDB}
      /> */}
      <ActionButton
        icon={Upload}
        label="Upload Labels"
        description="Process and update connection labels"
        onClick={onUpload}
        loading={loadingStates.updateLabels}
        anyLoading={isAnyLoading && !loadingStates.updateLabels}
      />
    </div>
  );
};

const SheetPage = () => {
  const { user, signIn } = useAuth();
  const { addUserAction } = useUserAction()
  const { sheetData, getGoogleToken, access, checkPermission, updateSheetData } = useSheet();
  const [loadingStates, setLoadingStates] = useState({
    create: false,
    syncSheet: false,
    syncDB: false,
    updateLabels: false
  });

  const { labels, activeSharedLabels, getLabelProfiles } = useLabels();
  const { notes, getNoteWithProfile } = useNotes();
  const { templates } = useData();

  const db = getFirestore();

  const handleCreate = async () => {
    await signIn(true);
    try {
      setLoadingStates(prev => ({ ...prev, create: true }));
      const token = await getGoogleToken();
      
      if (sheetData?.id) {
        window.open(`https://docs.google.com/spreadsheets/d/${sheetData.id}`, '_blank');
        await addUserAction("Extension: Connected to existing sheet");
        await checkPermission();
        return;
      }
      
      const firstName = user.displayName.split(' ')[0];
      const sheet = await createSheet(token, `${firstName} - LinkedIn Manager`);
      const currentTime = new Date().toISOString();
      const newSheetData = {
        id: sheet.spreadsheetId,
        ca: currentTime,
        ls: currentTime
      };
      
      // Update Firestore
      const userDocRef = doc(db, 'users_v2', user.uid);
      await updateDoc(userDocRef, {
        'd.sd': newSheetData
      });
      
      updateSheetData(newSheetData);
      
      window.open(`https://docs.google.com/spreadsheets/d/${newSheetData.id}`, '_blank');
      await addUserAction("Extension: Created new google sheet");
    } catch (error) {
      console.error('Error creating/connecting sheet:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, create: false }));
    }
  };

  const handleSync = async (syncType) => {
    if (!sheetData?.id) return;
    const loadingKey = syncType === "Sheet" ? "syncSheet" : "syncDB";

    try {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
      await addUserAction(`Extension: Synced ${syncType}`);
      const token = await getGoogleToken();
      console.log(token)

      const data = {
        labels: { labels },
        sharedLabels: activeSharedLabels,
        notes,
        shortcuts: templates
      };

      if (syncType === "Sheet") {
        await syncSheet(sheetData.id, token, { ...data, getLabelProfiles, getNoteWithProfile });

      } else {
        // await syncDatabase(sheetData.id, token, user.uid, data);
      }

      const userDocRef = doc(db, 'users_v2', user.uid);
      await updateDoc(userDocRef, {
        'd.sd.ls': new Date().toISOString()
      });

    } catch (error) {
      console.log('sheet error')
      console.error(error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleUpload = async () => {
    if (!sheetData?.id) return;
    try {
      setLoadingStates(prev => ({ ...prev, updateLabels: true }));
      await addUserAction("Extension: Uploaded labels");
      const token = await getGoogleToken();

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetData.id}/values/Profile Data`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sheetResponse = await response.json();
      const sheetRows = sheetResponse.values || [];

      if (sheetRows.length === 0) return;

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
        const userDocRef = doc(db, 'users_v2', user.uid);
        await updateDoc(userDocRef, {
          'd.sd.ls': new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Error processing upload:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, updateLabels: false }));
    }
  };

  const handleOpenSheet = async () => {
    await addUserAction("Extension: Opened google sheet");
    window.open(`https://docs.google.com/spreadsheets/d/${sheetData?.id}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-lg font-semibold mb-2">Sheet Manager</h1>
      <span className="text-muted-foreground mb-2">
        Sync and manage your LinkedIn connections using Google Sheets. {sheetData?.lastSynced && <b>Last synced: {formatDate(sheetData?.lastSynced)}</b>}
      </span>
      <div>
        {access !== 'accepted' ? (
          <NoSheetView
            onCreateSheet={handleCreate}
            isLoading={loadingStates.create}
            access={access}
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
                onClick={handleOpenSheet}
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