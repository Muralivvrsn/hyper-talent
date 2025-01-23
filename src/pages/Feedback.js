import React, { useState, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from '../context/AuthContext';
import { Loader2, ExternalLink, PaperclipIcon, X, Image as ImageIcon, FileText, File } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { storage } from '../context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 } from 'uuid';

const SHEET_ID = '1IqkRZed_a9gFC4ZvAarpZjeRc1Buoi0ivZJ5KUY68f0';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;

const feedbackTypes = [
  { value: "Bug", label: "Bug Report", placeholder: "Describe the bug you encountered..." },
  { value: "Feature", label: "Feature Request", placeholder: "Describe the feature you'd like..." },
  { value: "Suggestion", label: "Suggestion", placeholder: "Share your suggestion..." }
];



const FilePreview = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = useState('');

  React.useEffect(() => {
    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file, isImage]);




  return (
    <div className="relative flex items-center p-2 bg-background rounded-md border border-gray-200">
      {isImage ? (
        <div className="w-12 h-12 flex-shrink-0">
          <img 
            src={preview} 
            alt={file.name}
            className="w-full h-full object-cover rounded"
          />
        </div>
      ) : (
        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded">
          {file.type.includes('pdf') ? (
            <FileText className="w-6 h-6 text-gray-400" />
          ) : (
            <File className="w-6 h-6 text-gray-400" />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0 mx-2">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-gray-500">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 h-8 w-8 rounded-full hover:bg-gray-200"
        onClick={() => onRemove(file)}
      >
        <X className="h-4 w-4 text-gray-500" />
      </Button>
    </div>
  );
};

const Feedback = () => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [selectedType, setSelectedType] = useState('Bug');
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const { user } = useAuth();
  const chrome = window.chrome;

  const getGoogleToken = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' });
      if (response.success) {
        return response.token;
      }
      throw new Error('Failed to get token');
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  };

  const createHiddenWindow = () => {
    chrome.runtime.sendMessage({ 
      type: 'CREATE_HIDDEN_WINDOW',
      url: window.location.href 
    });
  };


  const getLastRow = async (token) => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Feedback!A:Z`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      return data.values ? data.values.length + 1 : 1;
    } catch (error) {
      console.error('Error getting last row:', error);
      throw error;
    }
  };

  const uploadFiles = async (files) => {
    if (!files.length) return [];
    
    try {
      const uploadPromises = files.map(async (file) => {
        const fileName = file.name + v4();
        const fileRef = ref(storage, `feedback/${fileName}`);
        
        const snapshot = await uploadBytes(fileRef, file);
        const url = await getDownloadURL(snapshot.ref);
        return { url, name: file.name };
      });
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };

  const appendToSheet = async (token, values, rowNumber) => {
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Feedback!B${rowNumber}:F${rowNumber}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: `Feedback!B${rowNumber}:F${rowNumber}`,
            values: [values],
          }),
        }
      );
    } catch (error) {
      console.error('Error appending to sheet:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('');
    try {
      const fileUploads = await uploadFiles(files);

      // Create hyperlinks for sheets
      const fileLinks = fileUploads.map(({ url, name }) => 
        `=HYPERLINK("${url}","${name}")`
      );

      // Combine feedback text with file URLs if present
      let combinedFeedback = feedback;
      if (fileLinks.length > 0) {
        combinedFeedback += '\n\nAttached files:\n' + fileLinks.join('\n');
      }

      const token = await getGoogleToken();
      const lastRow = await getLastRow(token);
      const values = [user.displayName, user.email, selectedType, combinedFeedback];
      await appendToSheet(token, values, lastRow);

      setFeedback('');
      setFiles([]);
      setSubmitStatus('Submitted successfully');
      
      setTimeout(() => {
        setSubmitStatus('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus('Error submitting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const newFiles = Array.from(e.dataTransfer.files);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    e.target.value = ''; // Reset input
  };

  const removeFile = (fileToRemove) => {
    setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  };

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-4">Feedback</h1>
      
      {/* Type Selector */}
      <div className="mb-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select feedback type" />
          </SelectTrigger>
          <SelectContent>
            {feedbackTypes.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description Input with Drag & Drop */}
      <div 
        className={`relative space-y-4 ${isDragging ? 'after:absolute after:inset-0 after:bg-blue-50 after:bg-opacity-50 after:border-2 after:border-dashed after:border-blue-300 after:rounded-lg' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="relative">
          <Textarea 
            className="min-h-32 pr-12"
            placeholder={feedbackTypes.find(t => t.value === selectedType)?.placeholder}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={isSubmitting}
          />
          <div 
            className="absolute right-2 bottom-2 cursor-pointer"
            onClick={() => document.getElementById('file-input').click()}
          >
            <PaperclipIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        id="file-input"
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="*"
        multiple
      />

      {/* File Previews */}
      {files.length > 0 && (
        <div className="mt-2 space-y-2">
          {files.map((file, index) => (
            <FilePreview 
              key={`${file.name}-${index}`} 
              file={file} 
              onRemove={removeFile}
            />
          ))}
        </div>
      )}

      {/* Submit Buttons */}
      <div className="mt-4 space-y-2">
        <Button 
          className="w-full" 
          onClick={handleSubmit}
          disabled={isSubmitting || !feedback.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : submitStatus ? (
            submitStatus
          ) : (
            `Submit ${feedbackTypes.find(t => t.value === selectedType)?.label}`
          )}
        </Button>
        <Button 
          variant="outline" 
          className="w-full text-sm" 
          onClick={() => window.open(SHEET_URL, '_blank')}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View All Feedback Entries
        </Button>

        <Button variant="outline" 
          className="w-full text-sm"  onClick={createHiddenWindow}>
          Create window
        </Button>
      </div>
    </div>
  );
};

export default Feedback;