import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import MessageForm from '../components/messages/MessageForm';
import MessageCard from '../components/messages/MessageCard';
import EmptyState from '../components/messages/EmptyState';
import { useUserAction } from '../context/UserActionContext';

const StandardizedReplies = () => {
  const { templates, error, addTemplate, editTemplate, deleteTemplate } = useData();
  const { addUserAction } = useUserAction();
  const [editingMessage, setEditingMessage] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleFormClose = (formData) => {
    if (!editingMessage && formData.title === '' && formData.content === '') {
      closeForm();
    } else if (editingMessage &&
      formData.title === editingMessage.title &&
      formData.content === editingMessage.content) {
      closeForm();
    } else {
      setShowExitDialog(true);
    }
  };

  const closeForm = () => {
    setTimeout(() => {
      setEditingMessage(null);
      setShowAddForm(false);
    }, 300);
  };

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      const success = editingMessage
        ? await editTemplate(editingMessage.id, formData)
        : await addTemplate(formData);

      if (success) {
        if (editingMessage) {
          addUserAction("Extension: Edited standardized reply");
        } else {
          addUserAction("Extension: Created new standardized reply");
        }
        closeForm();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRequest = () => {
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!editingMessage) return;
    setIsSaving(true);
    try {
      await deleteTemplate(editingMessage.id);
      addUserAction(`Extension: Deleted standardized reply`);
      setShowDeleteDialog(false);
      closeForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddButtonClick = () => {
    addUserAction("Extension: Clicked create new standardized reply button");
    setShowAddForm(true);
  };

  const handleMessageCardClick = (message) => {
    addUserAction(`Extension: Opened standardized reply`);
    setEditingMessage(message);
  };

  const handleCancelDelete = () => {
    addUserAction("Extension: Canceled delete dialog");
    setShowDeleteDialog(false);
  };

  return (
    <div className="h-full bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-semibold">Standardized Replies</h1>
          <Button
            onClick={handleAddButtonClick}
            className="h-9 w-9 rounded-full p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {templates.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="h-[80vh] overflow-auto space-y-3">
            {templates.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                onClick={() => {
                  handleMessageCardClick(message);
                }}
              />
            ))}
          </div>
        )}

        <AnimatePresence>
          {(showAddForm || editingMessage) && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className='absolute z-50 inset-0'
            >
              <MessageForm
                isEdit={!!editingMessage}
                message={editingMessage}
                onClose={handleFormClose}
                onSave={handleSave}
                onDelete={handleDeleteRequest}
                isSaving={isSaving}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unsaved Changes Dialog */}
        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard changes?</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to exit?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowExitDialog(false);
                  closeForm();
                }}
              >
                Discard
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete message?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the message.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default StandardizedReplies;