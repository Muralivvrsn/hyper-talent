import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Search, Plus, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFirestore } from 'firebase/firestore';
import { useLabels } from '../context/LabelContext';
import { toast } from 'react-hot-toast';
import { createLabel, addLabelToProfile, removeLabelFromProfile, createNote, updateNote } from '../utils/labelUtils';

const ProfileActionManager = ({
  isOpen,
  actionType,
  onClose,
  profile,
  existingLabels = [],
  existingNote
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [noteContent, setNoteContent] = React.useState(existingNote?.content || '');
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedLabels, setSelectedLabels] = React.useState(
    new Set(existingLabels?.map(l => l.id) || [])
  );

  const { user } = useAuth();
  const db = getFirestore();
  const { labels: allLabels } = useLabels();

  React.useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setNoteContent(existingNote?.content || '');
      setIsLoading(false);
      setSelectedLabels(new Set(existingLabels?.map(l => l.id) || []));
    }
  }, [isOpen, existingNote, existingLabels]);

  const handleCreateLabel = async () => {
    if (!searchTerm.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const labelId = await createLabel(searchTerm, user?.uid, db);
      if (labelId) {
        await handleToggleLabel(labelId, true);
        setSearchTerm('');
        toast.success(`Label "${searchTerm}" created successfully`);
      } else {
        toast.error('Label with this name already exists');
      }
    } catch (error) {
      toast.error('Failed to create label');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLabel = async (labelId, isNew = false) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const isSelected = selectedLabels.has(labelId);
      let success;

      if (isSelected && !isNew) {
        success = await removeLabelFromProfile(labelId, profile.id, user?.uid, db);
        if (success) {
          toast.success('Label removed from profile');
        }
      } else {
        success = await addLabelToProfile(labelId, profile.id, user?.uid, db);
        if (success) {
          toast.success('Label added to profile');
        }
      }

      if (success) {
        setSelectedLabels(prev => {
          const next = new Set(prev);
          if (isSelected && !isNew) {
            next.delete(labelId);
          } else {
            next.add(labelId);
          }
          return next;
        });
      } else {
        toast.error('Failed to update label');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update label');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const toastPromise = existingNote?.id
        ? updateNote(existingNote.id, noteContent, user?.uid, db)
        : createNote(profile.id, noteContent, user?.uid, db);

      await toast.promise(
        toastPromise,
        {
          loading: 'Saving note...',
          success: () => {
            onClose();
            return existingNote?.id ? 'Note updated successfully' : 'Note created successfully';
          },
          error: (err) => err.message || 'Failed to save note'
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter') {
      if (filteredLabels.length === 1) {
        handleToggleLabel(filteredLabels[0].id);
      } else if (filteredLabels.length === 0 && searchTerm.trim()) {
        handleCreateLabel();
      }
    }
  };

  const filteredLabels = React.useMemo(() => {
    const userLabels = Object.entries(allLabels).map(([id, label]) => ({
      id,
      name: label.name,
      color: label.color
    }));

    if (!searchTerm) return userLabels;

    return userLabels.filter(label =>
      label.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allLabels, searchTerm]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {actionType === 'label' ? 'Manage Labels' : 'Manage Note'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex-1 min-h-0">
          {actionType === 'label' ? (
            <div className="flex flex-col h-full">
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search or create label..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleCreateLabel}
                  disabled={!searchTerm.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="min-h-0 flex-1 max-h-[300px] overflow-y-auto flex flex-col">
                <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                  {filteredLabels.length > 0 ? (
                    <div className="space-y-1">
                      {filteredLabels.map((label) => (
                        <button
                          key={label.id}
                          onClick={() => handleToggleLabel(label.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded-md text-sm ${selectedLabels.has(label.id)
                            ? 'bg-accent'
                            : 'hover:bg-accent/50'
                          }`}

                          disabled={isLoading}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="flex-1 text-left">{label.name}</span>
                          {selectedLabels.has(label.id) && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : searchTerm.trim() ? (
                    <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                      <p>No labels found</p>
                      <p className="mt-1">Press Enter to create "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                      Search for labels or create a new one
                    </div>
                  )}
                </div>

                {filteredLabels.length === 1 && (
                  <div className="mt-2 px-2 text-xs text-muted-foreground text-center">
                    Press Enter to {selectedLabels.has(filteredLabels[0].id) ? 'remove' : 'add'} this label
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Textarea
                placeholder="Write a note about this profile..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="min-h-[150px] text-sm"
                disabled={isLoading}
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveNote}
                  disabled={!noteContent.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Save Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileActionManager;