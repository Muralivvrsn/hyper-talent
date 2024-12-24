import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Edit2, Trash2, Save, X, MessageSquarePlus, Loader2 } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { formatDistanceToNow } from 'date-fns';

const CandidateMessages = () => {
  const { messages, loading, error, addMessage, editMessage, deleteMessage } = useData();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMessage, setNewMessage] = useState({ title: '', content: '' });

  const handleAdd = async () => {
    const success = await addMessage(newMessage);
    if (success) {
      setShowAddForm(false);
      setNewMessage({ title: '', content: '' });
    }
  };

  const handleEdit = async (id) => {
    const success = await editMessage(id, editForm);
    if (success) {
      setEditingId(null);
      setEditForm({ title: '', content: '' });
    }
  };

  const handleDelete = async (id) => {
    await deleteMessage(id);
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
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
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

        {/* Add Form */}
        {showAddForm && (
          <Card className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Title"
              className="w-full rounded-lg border bg-muted p-2 text-sm"
              value={newMessage.title}
              onChange={(e) => setNewMessage(prev => ({ ...prev, title: e.target.value }))}
            />
            <textarea
              placeholder="Content"
              className="w-full rounded-lg border bg-muted p-2 text-sm min-h-[100px]"
              value={newMessage.content}
              onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="text-sm font-light" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button onClick={handleAdd} className="text-sm font-semibold">Save</Button>
            </div>
          </Card>
        )}

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
              <div key={message.id}>
                {editingId === message.id ? (
                  <Card className="p-4 space-y-4">
                    <input
                      type="text"
                      className="w-full rounded-lg border bg-muted p-2 text-sm"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <textarea
                      className="w-full rounded-lg border bg-muted p-2 text-sm min-h-[100px]"
                      value={editForm.content}
                      onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={() => handleEdit(message.id)}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <button
                    className="flex w-full flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all hover:bg-accent bg-muted"
                    onClick={() => {
                      setEditingId(message.id);
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
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(message.id);
                          setEditForm({
                            title: message.title,
                            content: message.content
                          });
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(message.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateMessages;