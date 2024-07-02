import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import SheetsDropdown from '../components/SheetsDropdown';
import SheetDetails from '../components/SheetDetails';

const Highlight = ({token}) => {
  const [selectedSheetId, setSelectedSheetId] = useState(null);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectSheet = (sheetId, sheetName) => {
    setSelectedSheetId(sheetId);
    setSelectedSheetName(sheetName);
  };

  const handleSelectColumn = (column) => {
    setSelectedColumn(column);
  };

  const handleSubmit = () => {
    // Handle submit logic here
    console.log(`Selected Sheet ID: ${selectedSheetId}`);
    console.log(`Selected Sheet Name: ${selectedSheetName}`);
    console.log(`Selected Column: ${selectedColumn}`);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 5 }}>
      <Typography variant="h4" className="text-blue-600" gutterBottom>
        Highlight
      </Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Spreadsheet and Column
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <SheetsDropdown token={token} onSelectSheet={handleSelectSheet} />
            {selectedSheetId && (
              <SheetDetails token={token} sheetId={selectedSheetId} onSelectColumn={handleSelectColumn} />
            )}
            {selectedColumn && (
              <Box sx={{ mt: 3 }}>
                <Button variant="contained" color="primary" onClick={handleSubmit}>
                  Submit
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Highlight;