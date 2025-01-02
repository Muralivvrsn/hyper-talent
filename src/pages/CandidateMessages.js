import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Trash2, MessageSquarePlus, Loader2 } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
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
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { formatDistanceToNow } from 'date-fns';

const CandidateMessages = () => {
  const { messages, loading, error, addMessage, editMessage, deleteMessage } = useData();
  const [editingMessage, setEditingMessage] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMessage, setNewMessage] = useState({ title: '', content: '' });
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!newMessage.title || !newMessage.content) return;
    setIsSaving(true);
    try {
      const success = await addMessage(newMessage);
      if (success) {
        setShowAddForm(false);
        setNewMessage({ title: '', content: '' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingMessage || !editForm.title || !editForm.content) return;

    setIsSaving(true);
    try {
      const success = await editMessage(editingMessage.id, editForm);
      if (success) {
        setEditingMessage(null);
        setEditForm({ title: '', content: '' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmMessage) return;

    setIsSaving(true);
    try {
      await deleteMessage(deleteConfirmMessage.id);
      setDeleteConfirmMessage(null);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full bg-background py-2 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-sm font-semibold">Messages</h1>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Message
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-destructive p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Add Message Dialog */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="w-[90%] max-w-full rounded-lg">
            <DialogHeader className="text-sm">
              <DialogTitle>Add New Message</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium leading-none">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  required
                  placeholder="Enter title"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={newMessage.title}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="content" className="text-sm font-medium leading-none">
                  Content <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="content"
                  required
                  placeholder="Enter content"
                  className="min-h-[300px] flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  <div 
                    onClick={() => setNewMessage(prev => ({ ...prev, content: prev.content + '<<first_name>>' }))}
                    className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
                  >
                    {'<<first_name>>'}
                  </div>
                  <div 
                    onClick={() => setNewMessage(prev => ({ ...prev, content: prev.content + '<<last_name>>' }))}
                    className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
                  >
                    {'<<last_name>>'}
                  </div>
                  <div 
                    onClick={() => setNewMessage(prev => ({ ...prev, content: prev.content + '<<name>>' }))}
                    className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
                  >
                    {'<<name>>'}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleAdd} 
                disabled={isSaving || !newMessage.title || !newMessage.content}
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Message Dialog */}
        <Dialog
          open={editingMessage !== null}
          onOpenChange={(open) => !open && setEditingMessage(null)}
        >
          <DialogContent className="w-[90%] max-w-full rounded-lg">
            <DialogHeader>
              <DialogTitle>Edit Message</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-title" className="text-sm font-medium leading-none">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="edit-title"
                  required
                  placeholder="Enter title"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-sm font-semibold"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-content" className="text-sm font-medium leading-none">
                  Content <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="edit-content"
                  required
                  placeholder="Enter content"
                  className="min-h-[300px] flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  <div 
                    onClick={() => setEditForm(prev => ({ ...prev, content: prev.content + '<<first_name>>' }))}
                    className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
                  >
                    {'<<first_name>>'}
                  </div>
                  <div 
                    onClick={() => setEditForm(prev => ({ ...prev, content: prev.content + '<<last_name>>' }))}
                    className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
                  >
                    {'<<last_name>>'}
                  </div>
                  <div 
                    onClick={() => setEditForm(prev => ({ ...prev, content: prev.content + '<<name>>' }))}
                    className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
                  >
                    {'<<name>>'}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleEdit} 
                disabled={isSaving || !editForm.title || !editForm.content}
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteConfirmMessage !== null}
          onOpenChange={(open) => !open && setDeleteConfirmMessage(null)}
        >
          <AlertDialogContent className="w-[90%] rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold leading-none tracking-tight">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                This action cannot be undone. This will permanently delete the
                message and remove it from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 h-9 px-4 py-2"
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Messages List */}
        {messages.length === 0 ? (
          <div className="text-center p-8">
            <MessageSquarePlus className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">No messages yet</h3>
            <p className="text-xs text-muted-foreground">Start creating messages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className="group flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent cursor-pointer"
                onClick={() => {
                  setEditingMessage(message);
                  setEditForm({
                    title: message.title,
                    content: message.content
                  });
                }}
              >
                <div className="flex w-full flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{message.title}</div>
                    <div className="text-xs text-foreground">
                      {formatDate(message.lastUpdate)}
                    </div>
                  </div>
                </div>
                <div className="line-clamp-2 text-xs text-muted-foreground">
                  {message.content}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmMessage(message);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateMessages;