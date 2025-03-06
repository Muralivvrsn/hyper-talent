import React, { useState } from 'react';
import { useOtherUsers } from '../context/OtherUsersContext';
import { useNotes } from '../context/NotesContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Search, Users, Loader2, Send } from 'lucide-react';
import { getFirestore, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ShareLabelsDialog = ({ ownedLabels, addUserAction }) => {
  const { otherUsers } = useOtherUsers();
  const { notes } = useNotes();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('labels');
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [labelSearchTerm, setLabelSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [sharingType, setSharingType] = useState('labels');
  const db = getFirestore();

  const { user, userProfile } = useAuth();

  const currentUser = {
    uid: user.uid,
    displayName: user.displayName || userProfile?.name || 'Unknown User'
  };
  const labelsList = ownedLabels || [];
  const noteIds = Object.keys(notes || {});

  const filteredUsers = searchTerm
    ? otherUsers.filter(user => {
      if (!user.email) return false;

      const userEmail = user.email.toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();

      if (searchTerm.includes('@')) {
        return userEmail === searchTermLower;
      }

      // return user.name?.toLowerCase() === searchTermLower;
    })
    : [];

  const filteredLabels = labelSearchTerm
    ? labelsList.filter(label =>
      label.name.toLowerCase().includes(labelSearchTerm.toLowerCase())
    )
    : labelsList;

  const handleLabelToggle = (labelId) => {
    setSelectedLabels(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleNext = () => {
    if (selectedLabels.length === 0) {
      return;
    }
    setStep('users');
  };

  const handleOpenDialog = (type) => {
    setSharingType(type);

    if (type === 'notes') {
      setSelectedLabels([]);
      setStep('users');
    } else {
      setStep('labels');
    }

    setIsOpen(true);
  };

  const handleBack = () => {
    setStep('labels');
    setSearchTerm('');
  };

  const handleCancel = () => {
    setIsOpen(false);
    setStep('labels');
    setSelectedLabels([]);
    setSelectedUsers([]);
    setSearchTerm('');
    setLabelSearchTerm('');
    setSharingType('labels');
  };

  const handleShare = async () => {
    if ((sharingType === 'labels' && selectedLabels.length === 0) || selectedUsers.length === 0) {
      return;
    }

    setIsSharing(true);
    try {
      await Promise.all(selectedUsers.map(async (userId) => {
        const userRef = doc(db, 'users_v2', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // For sharing labels:
          if (sharingType === 'labels') {
            await addUserAction("Extension: Shared labels with a user");
            const existingLabels = userData.d?.l || [];
            const newLabelsToShare = selectedLabels.filter(labelId =>
              !existingLabels.some(item => item.id === labelId)
            );

            if (newLabelsToShare.length > 0) {
              const sharedLabelObjects = newLabelsToShare.map(labelId => ({
                id: labelId,
                t: 'shared',
                a: null,
                ps: 'read',
                sa: Date.now(),
                sb: currentUser.uid,
                sbn: currentUser.displayName
              }));

              await updateDoc(userRef, {
                'd.l': arrayUnion(...sharedLabelObjects)
              });
            }
          } else if (sharingType === 'notes') {
            await addUserAction("Extension: Shared notes with a user");
            const existingNotes = userData.d?.n || [];
            const newNotesToShare = noteIds.filter(noteId =>
              !existingNotes.some(item => item.id === noteId)
            );

            if (newNotesToShare.length > 0) {
              const sharedNoteObjects = newNotesToShare.map(noteId => ({
                id: noteId,
                t: 'shared',
                a: null,
                ps: 'read',
                sa: Date.now(),
                sb: currentUser.uid,
                sbn: currentUser.displayName
              }));

              await updateDoc(userRef, {
                'd.n': arrayUnion(...sharedNoteObjects)
              });
            }
          }
        }
      }));

      toast.success(`${sharingType === 'labels' ? 'Labels' : 'Notes'} shared successfully`);
      handleCancel();
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error(`Failed to share ${sharingType === 'labels' ? 'labels' : 'notes'}`);
    } finally {
      setIsSharing(false);
    }
  };

  const getDialogTitle = () => {
    if (step === 'labels') {
      return 'Select Labels to Share';
    } else {
      return `Select Users to Share ${sharingType === 'labels' ? 'Labels' : 'Notes'}`;
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  };

  return (
    <div className="flex gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex gap-2">
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2" onClick={() => handleOpenDialog('labels')}>
              <Send className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {getDialogTitle()}
            </DialogTitle>
          </DialogHeader>

          {step === 'labels' && sharingType === 'labels' ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground text-sm" />
                  <Input
                    placeholder="Search labels..."
                    value={labelSearchTerm}
                    onChange={(e) => setLabelSearchTerm(e.target.value)}
                    className="pl-8 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
                {filteredLabels.map(label => (
                  <div
                    key={label.id}
                    className={`flex items-center space-x-2 p-2 rounded-md ${selectedLabels.includes(label.id)
                      ? 'bg-accent'
                      : 'hover:bg-accent/50'
                      }`}
                  >
                    <Checkbox
                      id={label.id}
                      checked={selectedLabels.includes(label.id)}
                      onCheckedChange={() => handleLabelToggle(label.id)}
                    />
                    <label
                      htmlFor={label.id}
                      className="flex-1 flex items-center space-x-2 cursor-pointer"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span>{label.name}</span>
                    </label>
                    <span className='w-7 h-7 rounded-full bg-muted flex justify-center items-center text-[10px]'>{label.profileCount}</span>
                  </div>
                ))}
                {filteredLabels.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No labels found
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant={sharingType === 'notes' ? 'secondary' : 'outline'}
                  onClick={() => handleOpenDialog('notes')}
                >
                  Share Notes
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleNext} disabled={selectedLabels.length === 0}>
                  Next
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground text-sm" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 text-sm"
                  />
                </div>
              </div>

              {searchTerm ? (
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className={`flex items-center space-x-2 p-2 rounded-md ${selectedUsers.includes(user.id)
                          ? 'bg-accent'
                          : 'hover:bg-accent/50'
                          }`}
                      >
                        <Checkbox
                          id={user.id}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleUserToggle(user.id)}
                        />
                        <label
                          htmlFor={user.id}
                          className="flex-1 flex items-center space-x-2 cursor-pointer"
                        >
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div>{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                          {isValidEmail(searchTerm) ? 'No users match this email' : 'Type a full email address to search'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Search for users to share with</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                {sharingType === 'labels' && (
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleShare}
                  disabled={selectedUsers.length === 0 || isSharing}
                >
                  {isSharing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    'Share'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShareLabelsDialog;