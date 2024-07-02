import React, { useEffect, useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, CircularProgress } from '@mui/material';

function SheetDetails({ token, sheetId, onSelectColumn, onSelectSheet }) {
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`https://hypertalent-server.onrender.com/sheets/get-sheet-details?spreadsheetId=${sheetId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      const sheetNames = Object.keys(data);
      setSheets(sheetNames.map(name => ({ name, columns: data[name] })));
      setLoading(false);
    })
    .catch(error => {
      console.error('Error fetching sheet details', error);
      setLoading(false);
    });
  }, [token, sheetId]);

  useEffect(() => {
    if (selectedSheet) {
      const sheet = sheets.find(sheet => sheet.name === selectedSheet);
      setColumns(sheet ? sheet.columns : []);
      setSelectedColumn(''); // Reset selected column when sheet changes
    }
  }, [selectedSheet, sheets]);

  const handleSelectColumn = (column) => {
    setSelectedColumn(column);
    onSelectColumn(column);
  };

  const handleSelectSheet = (sheetName)=>{
    setSelectedSheet(sheetName);
    onSelectSheet(sheetName)
  }

  return (
    <Box>
      <FormControl fullWidth margin="normal">
        <InputLabel>Select Sheet</InputLabel>
        <Select
          value={selectedSheet}
          onChange={(e) => handleSelectSheet(e.target.value)}
          label="Select Sheet"
        >
          {sheets.map((sheet) => (
            <MenuItem key={sheet.name} value={sheet.name}>
              {sheet.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedSheet && !loading && (
        <FormControl fullWidth margin="normal">
          <InputLabel>Select Column</InputLabel>
          <Select
            value={selectedColumn}
            onChange={(e) => handleSelectColumn(e.target.value)}
            label="Select Column"
          >
            {columns.map((col, index) => (
              <MenuItem key={index} value={col}>
                {col}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}

export default SheetDetails;