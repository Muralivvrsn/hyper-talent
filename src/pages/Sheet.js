import React, { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { useAuth } from '../context/AuthContext';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { ExternalLink, Loader2 } from 'lucide-react';
import { fetchCollectionData, createSheet, syncSheet, syncDatabase, processUploadLabels } from '../context/sheetContext';

const SheetPage = () => {
  const { user } = useAuth();
  const [sheetData, setSheetData] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    initial: true,
    create: false,
    syncSheet: false,
    syncDB: false,
    updateLabels: false
  });
  const db = getFirestore();
  const chrome = window.chrome;

  useEffect(() => {
    if (user?.uid) checkExistingSheet();
  }, [user]);

  const checkExistingSheet = async () => {
    try {
      const snap = await getDoc(doc(db, 'sheets', user.uid));
      if (snap.exists()) setSheetData(snap.data());
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStates(prev => ({ ...prev, initial: false }));
    }
  };

  const handleCreate = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, create: true }));
      const response = await chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' });
      const token = response.token;
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

      await setDoc(doc(db, 'sheets', user.uid), newSheetData);
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
      const response = await chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' });
      const token = response.token;
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
      await setDoc(doc(db, 'sheets', user.uid), updatedSheetData);
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
      const response = await chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' });
      const token = response.token;
      await processUploadLabels(sheetData.spreadsheetId, token, user.uid);

      const data = await fetchCollectionData(user.uid);
      await syncSheet(sheetData.spreadsheetId, token, data);

      const updatedSheetData = {
        ...sheetData,
        lastSync: new Date().toISOString()
      };
      await setDoc(doc(db, 'sheets', user.uid), updatedSheetData);
      setSheetData(updatedSheetData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStates(prev => ({ ...prev, updateLabels: false }));
    }
  };

  if (loadingStates.initial) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <CardHeader>
        <CardTitle className="text-2xl">LinkedIn Profile Manager</CardTitle>
        <CardDescription>
          Sync and manage your LinkedIn connections using Google Sheets
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          {!sheetData ? (
            <div className="space-y-4">
              <Button 
                className="w-full" 
                onClick={handleCreate}
                disabled={loadingStates.create}
              >
                {loadingStates.create ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create New Sheet
              </Button>
              <p className="text-sm text-muted-foreground px-2 text-center">
                Create a Google Sheet to manage your LinkedIn connections, notes, and labels
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <Button 
                  className="w-full" 
                  onClick={() => handleSync("Sheet")}
                  disabled={loadingStates.syncSheet}
                >
                  {loadingStates.syncSheet ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Update Google Sheet
                  </Button>
                  <p className="text-sm text-muted-foreground px-2 text-center">Update Google Sheet with latest data from your LinkedIn connections</p>

                <Button 
                  className="w-full" 
                  onClick={() => handleSync("Database")}
                  disabled={loadingStates.syncDB}
                >
                  {loadingStates.syncDB ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Update Database
                  </Button>
                  <p className="text-sm text-muted-foreground px-2 text-center">Update your database with changes made in Google Sheet</p>

                <Button 
                  className="w-full" 
                  onClick={handleUpload}
                  disabled={loadingStates.updateLabels}
                >
                  {loadingStates.updateLabels ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Update Labels
                  </Button>
                  <p className="text-sm text-muted-foreground px-2 text-center">Process and update labels from the Upload Labels sheet</p>
              </div>

              <div className="text-sm text-muted-foreground text-center">
                Last synced: {new Date(sheetData.lastSync).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {sheetData && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(sheetData.sheetUrl, '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Google Sheet
          </Button>
        )}
      </CardContent>
    </div>
  );
};

export default SheetPage;