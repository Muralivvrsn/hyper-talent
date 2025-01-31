import React, { useState } from 'react';
import { useLabels } from '../context/LabelContext';
import { useOtherUsers } from '../context/OtherUsersContext';
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
import { Share, Search, Users, Loader2 } from 'lucide-react';
import { getFirestore, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';

const ShareLabelsDialog = () => {
  const { labels } = useLabels();
  const { otherUsers } = useOtherUsers();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('labels');
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [labelSearchTerm, setLabelSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const db = getFirestore();

  // Convert labels object to array for easier rendering
  const labelsList = Object.entries(labels).map(([id, label]) => ({
    id,
    name: label.name,
    color: label.color
  }));

  // Filter users based on search term
  const filteredUsers = searchTerm
    ? otherUsers.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
  };
  const handleShare = async () => {
    if (selectedLabels.length === 0 || selectedUsers.length === 0) {
      return;
    }

    setIsSharing(true);
    try {
      // Update each selected user's document
      await Promise.all(selectedUsers.map(async (userId) => {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const existingSharedLabels = userData.d?.sl || [];

          // Filter out labels that are already shared with this user
          const newLabelsToShare = selectedLabels.filter(labelId =>
            !existingSharedLabels.some(shared => shared.l === labelId)
          );

          if (newLabelsToShare.length > 0) {
            // Create shared label objects for new labels only
            const sharedLabelObjects = newLabelsToShare.map(labelId => ({
              l: labelId,
              a: null
            }));

            // Update user's sharedLabels array with only new labels
            await updateDoc(userRef, {
              'd.sl': arrayUnion(...sharedLabelObjects)
            });
          }
        }
      }));

      setIsOpen(false);
      setStep('labels');
      setSelectedLabels([]);
      setSelectedUsers([]);
      setSearchTerm('');
    } catch (error) {
      console.error('Error sharing labels:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share className="h-4 w-4" />
          Share Labels
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'labels' ? 'Select Labels to Share' : 'Select Users'}
          </DialogTitle>
        </DialogHeader>

        {step === 'labels' ? (
          // Labels Selection Step
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
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={selectedLabels.length === 0}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          // Users Selection Step
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
                    No users found
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
              <Button
                variant="outline"
                onClick={handleCancel} >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleBack}
              >
                Back
              </Button>
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
  );
};

export default ShareLabelsDialog;