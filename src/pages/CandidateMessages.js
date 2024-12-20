import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Save, X, MessageSquarePlus, Loader2, Sun, Moon } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../context/ThemeContext';

const CandidateMessages = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMessage, setNewMessage] = useState({ title: '', content: '' });

  const db = getFirestore();

  useEffect(() => {
    if (user?.uid) {
      fetchMessages();
    }
  }, [user]);


  const fetchMessages = async () => {
    try {
      const docRef = doc(db, 'shortcuts', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const messagesList = Object.entries(data.shortcuts || {}).map(([id, message]) => ({
          id,
          ...message
        }));

        const sortedMessages = messagesList.sort((a, b) =>
          new Date(b.lastUpdate) - new Date(a.lastUpdate)
        );

        setMessages(sortedMessages);
      } else {
        await setDoc(docRef, { shortcuts: {} });
        setMessages([]);
      }
    } catch (err) {
      setError('Failed to fetch messages');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const docRef = doc(db, 'shortcuts', user.uid);
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.data() || { shortcuts: {} };

      const newId = crypto.randomUUID();
      const newData = {
        ...currentData,
        shortcuts: {
          ...currentData.shortcuts,
          [newId]: {
            title: newMessage.title,
            content: newMessage.content,
            lastUpdate: new Date().toISOString()
          }
        }
      };

      await setDoc(docRef, newData);

      setMessages(prev => [{
        id: newId,
        title: newMessage.title,
        content: newMessage.content,
        lastUpdate: new Date().toISOString()
      }, ...prev]);

      setShowAddForm(false);
      setNewMessage({ title: '', content: '' });
    } catch (err) {
      setError('Failed to add message');
      console.error('Add error:', err);
    }
  };

  const handleEdit = async (id) => {
    try {
      const docRef = doc(db, 'shortcuts', user.uid);
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.data();

      const updatedShortcuts = {
        ...currentData.shortcuts,
        [id]: {
          title: editForm.title,
          content: editForm.content,
          lastUpdate: new Date().toISOString()
        }
      };

      await updateDoc(docRef, { shortcuts: updatedShortcuts });

      setMessages(prev => prev.map(msg =>
        msg.id === id
          ? {
            ...msg,
            title: editForm.title,
            content: editForm.content,
            lastUpdate: new Date().toISOString()
          }
          : msg
      ));

      setEditingId(null);
      setEditForm({ title: '', content: '' });
    } catch (err) {
      setError('Failed to update message');
      console.error('Update error:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const docRef = doc(db, 'shortcuts', user.uid);
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.data();

      const { [id]: removed, ...remainingShortcuts } = currentData.shortcuts;
      await updateDoc(docRef, { shortcuts: remainingShortcuts });

      setMessages(prev => prev.filter(msg => msg.id !== id));
    } catch (err) {
      setError('Failed to delete message');
      console.error('Delete error:', err);
    }
  };

  const formatDate = (date) => {
    const formattedDistance = formatDistanceToNow(new Date(date), { addSuffix: true });
    const exactDate = new Date(date).toLocaleString();
    return { distance: formattedDistance, exact: exactDate };
  };

  return (
    <div className="h-full bg-background p-4 sm:p-6">
      {
        loading ? 
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
         : <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-sm">Messages</h1>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowAddForm(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Message
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full p-4 rounded border border-destructive bg-destructive/10">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Add Form */}
          {showAddForm && (
            <Card className="border border-border">
              <CardContent className="p-6 space-y-4">
                <input
                  type="text"
                  value={newMessage.title}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Title"
                  className="w-full p-3 rounded-md border border-input bg-background text-sm"
                />
                <textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Content"
                  rows={4}
                  className="w-full p-3 rounded-md border border-input bg-background text-sm resize-none"
                />
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setShowAddForm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAdd}>
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messages List */}
          {messages.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="py-16 flex flex-col items-center gap-4">
                <MessageSquarePlus className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-sm">No Messages Yet</h3>
                <p className="text-muted-foreground">Create your first message to get started!</p>
                <Button onClick={() => setShowAddForm(true)}>
                  Create Message
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {messages.map(message => {
                const dateInfo = formatDate(message.lastUpdate);
                console.log(dateInfo)

                return (
                  <Card key={message.id} className="border border-border">
                    <CardContent className="p-6">
                      {editingId === message.id ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full p-3 rounded-md border border-input bg-background text-sm"
                          />
                          <textarea
                            value={editForm.content}
                            onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                            rows={4}
                            className="w-full p-3 rounded-md border border-input bg-background text-sm resize-none"
                          />
                          <div className="flex justify-end gap-3">
                            <Button
                              onClick={() => setEditingId(null)}
                              variant="outline"
                              className="gap-2"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleEdit(message.id)}
                              className="gap-2"
                            >
                              <Save className="h-4 w-4" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-sm mb-1">{message.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {dateInfo.distance}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  setEditingId(message.id);
                                  setEditForm({
                                    title: message.title,
                                    content: message.content
                                  });
                                }}
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(message.id)}
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      }

    </div>
  );
};

export default CandidateMessages;