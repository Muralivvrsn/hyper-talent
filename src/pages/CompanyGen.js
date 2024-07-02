import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography, Paper } from '@mui/material';
import SheetsDropdown from '../components/SheetsDropdown';
import SheetDetails from '../components/SheetDetails';
import axios from 'axios';

const CompanyGen = ({ token }) => {
  const [selectedSheetId, setSelectedSheetId] = useState(null);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectSheet = (sheetId) => {
    setSelectedSheetId(sheetId);
  };

  const handleSelectColumn = (column) => {
    setSelectedColumn(column);
  };

  const handleSubmit = async () => {
    if (!selectedSheetId || !selectedSheetName || !selectedColumn) {
      alert('Please select all required fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'https://hypertalent-server.onrender.com/sheets/generate-company-ids-location',
        {
          spreadsheetId: selectedSheetId,
          sheetName: selectedSheetName,
          columnName: selectedColumn,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      console.log('API response:', response.data);
      alert('Company IDs and Locations generated successfully.');
    } catch (error) {
      console.error('Error calling API:', error);
      alert('An error occurred while generating company IDs and locations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 5 }}>
      <Typography variant="h4" sx={{ fontSize: '23px', '@media (max-width:600px)': { fontSize: '20px' } }} className="text-blue-600" gutterBottom>
        Company Generation
      </Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" sx={{ fontSize: '23px', '@media (max-width:600px)': { fontSize: '20px' } }} gutterBottom>
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
              <SheetDetails token={token} sheetId={selectedSheetId} onSelectColumn={handleSelectColumn} onSelectSheet={setSelectedSheetName} />
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

export default CompanyGen;