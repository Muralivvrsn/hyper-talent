import React, { useState, useCallback } from 'react';
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Loader2, PaperclipIcon, X, FileText, File, LinkIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';
import { useFeedback } from '../context/FeedbackContext';
import toast from 'react-hot-toast';

const feedbackTypes = [
  { value: "Bug", label: "Bug Report", placeholder: "Describe the bug you encountered..." },
  { value: "Feature", label: "Feature Request", placeholder: "Describe the feature you'd like..." },
  { value: "Suggestion", label: "Suggestion", placeholder: "Share your suggestion..." }
];

const statusConfig = {
  'ns': {
    label: 'New',
    style: 'bg-gray-100 text-gray-800 hover:none',
    description: "🌱 Fresh as a daisy - waiting to bloom!"
  },
  'ip': {
    label: 'In Progress',
    style: 'bg-blue-100 text-blue-800',
    description: "🏃 We're on it like a superhero on a mission!"
  },
  'ur': {
    label: 'Under Review',
    style: 'bg-purple-100 text-purple-800',
    description: "🔍 Our experts are examining it with their finest monocles"
  },
  'it': {
    label: 'In Testing',
    style: 'bg-yellow-100 text-yellow-800',
    description: "🧪 Being poked and prodded (gently, we promise)"
  },
  'rs': {
    label: 'Resolved',
    style: 'bg-green-100 text-green-800',
    description: "✨ Fixed and polished until it sparkles!"
  },
  'dc': {
    label: 'Declined',
    style: 'bg-red-100 text-red-800',
    description: "🤔 Not this time - but we appreciate the thought!"
  },
  'df': {
    label: 'Deferred',
    style: 'bg-orange-100 text-orange-800',
    description: "⏳ On the back burner, but not forgotten"
  },
  'cp': {
    label: 'Completed',
    style: 'bg-emerald-100 text-emerald-800',
    description: "🎉 Done and dusted - high fives all around!"
  }
};

const getStatusBadge = (status) => {
  console.log(status)
  return statusConfig[status]?.style || statusConfig.ns.style;
};

const StatusBadge = ({ status }) => {
  const statusInfo = statusConfig[status] || statusConfig.ns;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge 
            className={`${getStatusBadge(status)} hover:bg-background-800`}
          >
            {statusInfo.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{statusInfo.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
const FeedbackItem = ({ data, id }) => {
  const statusMap = {
    'b': 'Bug',
    'f': 'Feature',
    's': 'Suggestion'
  };

  return (
    <div className="px-4 py-3 border-b hover:bg-accent/5 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {statusMap[data.t] || 'Unknown'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(data.ca), { addSuffix: true })}
          </span>
        </div>
        <StatusBadge status={data.s || 'ns'} />
      </div>
      
      <p className="text-sm text-foreground">{data.d}</p>
      
      {data.u && data.u.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {data.u.map((url, index) => (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
            >
              <LinkIcon className="h-3 w-3 mr-1" />
              Attachment {index + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};


// FilePreview component remains the same
const FilePreview = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = useState('');

  React.useEffect(() => {
    if (isImage) {
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error creating file preview:', error);
      }
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

// Main Feedback component remains largely the same
const Feedback = () => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState('Bug');
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const { 
    feedbackItems, 
    isLoading, 
    submitFeedback, 
    validateFile, 
    ALLOWED_FILE_TYPES 
  } = useFeedback();

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await submitFeedback(selectedType, feedback, files);
      setFeedback('');
      setFiles([]);
      toast.success('Feedback submitted successfully');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.message || 'Error submitting feedback');
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
    
    try {
      const newFiles = Array.from(e.dataTransfer.files);
      newFiles.forEach(file => validateFile(file));
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    } catch (error) {
      toast.error(error.message);
    }
  }, [validateFile]);

  const handleFileChange = (e) => {
    try {
      const newFiles = Array.from(e.target.files);
      newFiles.forEach(file => validateFile(file));
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      e.target.value = '';
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeFile = (fileToRemove) => {
    setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  };

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Feedback</h1>
      
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

      <div 
        className={`relative space-y-4 ${isDragging ? 'after:absolute after:inset-0 after:bg-blue-50 after:bg-opacity-50 after:border-2 after:border-dashed after:border-blue-300 after:rounded-lg' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="relative">
          <Textarea 
            className="min-h-32 pr-12 text-sm"
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

      <input
        id="file-input"
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept={ALLOWED_FILE_TYPES.join(',')}
        multiple
      />

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

      <div className="mt-4">
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
          ) : (
            `Submit ${feedbackTypes.find(t => t.value === selectedType)?.label}`
          )}
        </Button>
      </div>

      <div className="mt-8">
    <h2 className="text-base font-medium pr-4 mb-4">Your Feedback History</h2>
    
    <ScrollArea className="h-[calc(100vh-12rem)]">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : feedbackItems.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 px-4">
          No feedback submitted yet
        </div>
      ) : (
        <div className="divide-y divide-border">
          {feedbackItems.map((item) => (
            <FeedbackItem 
              key={item.id} 
              data={item} 
              id={item.id}
            />
          ))}
        </div>
      )}
    </ScrollArea>
  </div>
    </div>
  );
};

export default Feedback;