import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Save, X, MessageSquarePlus } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Loader2 } from 'lucide-react';

const CandidateMessages = () => {
    const { user } = useAuth();
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

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Your Messages</h1>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-5 w-5 mr-2" />
            New Message
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full p-3 rounded-lg border border-destructive">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <input
                  type="text"
                  value={newMessage.title}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Title"
                  className="w-full p-2 border rounded-lg"
                />
                <textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Content"
                  rows={4}
                  className="w-full p-2 border rounded-lg"
                />
                <div className="flex justify-end space-x-2">
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages List */}
        {messages.length === 0 ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center space-y-4">
              <MessageSquarePlus className="h-16 w-16 text-muted-foreground" />
              <h3 className="text-xl font-semibold">No Messages Yet</h3>
              <p className="text-muted-foreground">Create your first message to get started!</p>
              <Button onClick={() => setShowAddForm(true)}>
                Create Message
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              <Card key={message.id}>
                <CardContent className="p-6">
                  {editingId === message.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full p-2 border rounded-lg"
                      />
                      <textarea
                        value={editForm.content}
                        onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                        rows={4}
                        className="w-full p-2 border rounded-lg"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          onClick={() => setEditingId(null)}
                          variant="outline"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={() => handleEdit(message.id)}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{message.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Last updated: {new Date(message.lastUpdate).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
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
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(message.id)}
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap">{message.content}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateMessages;