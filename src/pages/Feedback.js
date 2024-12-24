import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from '../context/AuthContext';
import { Loader2, ExternalLink } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const SHEET_ID = '1IqkRZed_a9gFC4ZvAarpZjeRc1Buoi0ivZJ5KUY68f0';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;

const feedbackTypes = [
  { value: "Bug", label: "Bug Report", placeholder: "Describe the bug you encountered..." },
  { value: "Feature", label: "Feature Request", placeholder: "Describe the feature you'd like..." },
  { value: "Suggestion", label: "Suggestion", placeholder: "Share your suggestion..." }
];

const Feedback = () => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [selectedType, setSelectedType] = useState('Bug');
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

  const appendToSheet = async (token, values, rowNumber) => {
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Feedback!B${rowNumber}:E${rowNumber}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: `Feedback!B${rowNumber}:E${rowNumber}`,
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
      const token = await getGoogleToken();
      const lastRow = await getLastRow(token);
      const values = [user.displayName, user.email, selectedType, feedback];
      await appendToSheet(token, values, lastRow);

      setFeedback('');
      setSubmitStatus('Submitted successfully');
      
      setTimeout(() => {
        setSubmitStatus('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mobile view selector
  const MobileSelector = () => (
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
  );

  // Desktop view selector
  const DesktopSelector = () => (
    <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        {feedbackTypes.map(({ value, label }) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-4">Feedback</h1>
      
      {/* Type Selector */}
      <div className="mb-4">
        <div className="min-[500px]:hidden">
          <MobileSelector />
        </div>
        <div className="hidden min-[500px]:block">
          <DesktopSelector />
        </div>
      </div>

      {/* Persistent Textarea */}
      <div className="space-y-4">
        <Textarea 
          className="min-h-32"
          placeholder={feedbackTypes.find(t => t.value === selectedType)?.placeholder}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          disabled={isSubmitting}
        />
        
        {/* Submit Buttons */}
        <div className="space-y-2">
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
        </div>
      </div>
    </div>
  );
};

export default Feedback;