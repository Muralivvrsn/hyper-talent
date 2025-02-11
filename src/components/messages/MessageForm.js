import React, { useRef, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from "../ui/button";
import TemplateButtons from './TemplateButtons';

const MessageForm = ({ 
  isEdit, 
  message,
  onClose,
  onSave,
  onDelete,
  isSaving 
}) => {
  const [formData, setFormData] = useState({
    title: message?.title || '',
    content: message?.content || ''
  });
  const contentRef = useRef(null);
  const [isContentFocused, setIsContentFocused] = useState(false);

  const handleTextareaChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, content: value }));
  };

  const insertTemplate = (template) => {
    // If not focused, focus the textarea first
    if (!contentRef.current.matches(':focus')) {
      contentRef.current.focus();
    }
  
    // Get the current cursor position
    const start = contentRef.current.selectionStart;
    const end = contentRef.current.selectionEnd;
    const currentContent = formData.content;
    
    // Create the new content with the template inserted
    const newContent = 
      currentContent.substring(0, start) + 
      template + 
      currentContent.substring(end);
  
    // Update the content
    setFormData(prev => ({
      ...prev,
      content: newContent
    }));
  
    // Ensure the cursor is placed right after the inserted template
    // Wrap in both requestAnimationFrame and setTimeout for cross-browser reliability
    requestAnimationFrame(() => {
      setTimeout(() => {
        contentRef.current.focus();
        contentRef.current.setSelectionRange(
          start + template.length,
          start + template.length
        );
      }, 0);
    });
  };

  return (
    <div className="w-full h-full bg-background">
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {isEdit ? 'Edit Message' : 'New Message'}
          </h2>
        </div>
        {isEdit && (
          <Button
            variant="ghost"
            onClick={onDelete}
            disabled={isSaving}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        )}
      </div>

      <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Content <span className="text-destructive">*</span>
            </label>
            <textarea
              ref={contentRef}
              placeholder="Enter content"
              className="w-full min-h-[calc(100vh-450px)] rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              value={formData.content}
              onChange={handleTextareaChange}
              onFocus={() => setIsContentFocused(true)}
              onBlur={() => setIsContentFocused(false)}
            />
            <TemplateButtons 
              onInsert={insertTemplate}
            //   isActive={isContentFocused}
            />
          </div>

          <div className="pt-4">
            <Button
              className="w-full"
              onClick={() => onSave(formData)}
              disabled={isSaving || !formData.title || !formData.content}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default MessageForm