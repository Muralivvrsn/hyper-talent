import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { X, ChevronDown, ChevronUp, MoreVertical, Tag, MessageSquarePlus, Loader2, ChevronRight, Plus, ArrowDownLeft, Trash2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Button } from './ui/button';
import ProfileActionManager from './ProfileActionManager';
import { } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFirestore } from 'firebase/firestore';
import { deleteNote, hexToHSL, parseHSL, removeLabelFromProfile } from '../utils/labelUtils';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const ProfileActionsMenu = ({ onAction, hasNote }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-48 p-2" align="end">
      <div className="flex flex-col gap-1">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sm" onClick={() => onAction('label')}>
          <Tag className="h-4 w-4" />
          Add Label
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sm" onClick={() => onAction('note')}>
          <MessageSquarePlus className="h-4 w-4" />
          {hasNote ? 'Edit Note' : 'Add Note'}
        </Button>
      </div>
    </PopoverContent>
  </Popover>
);

const ProfileLabels = ({ labels, onRemove, isRemoving, theme, onAddLabel }) => {
  if (!labels || labels.length === 0) {
    return (
      <div className="flex mt-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
          onClick={onAddLabel}
        >
          <Plus className="h-3 w-3" /> Add label
        </Button>
      </div>
    );
  }

  const generateTextColor = (backgroundColor) => {
    let h, s, l;

    if (backgroundColor.startsWith('#')) {
      const hsl = hexToHSL(backgroundColor);
      h = hsl.h;
      s = hsl.s;
      l = hsl.l;
    } else {
      const hslValues = parseHSL(backgroundColor);
      if (!hslValues) return '#000000';
      h = hslValues.h;
      s = hslValues.s;
      l = hslValues.l;
    }

    const threshold = 65;

    if (l > threshold || (l > 60 && s < 15)) {
      return '#000000';
    }
    return '#FFFFFF';
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {labels.map((label) => (
        <div
          key={label.id}
          className="group/label relative inline-flex items-center text-[10px] px-3 py-0.5 rounded-full transition-all duration-200 font-semibold"
          style={{
            backgroundColor: label.color,
            color: generateTextColor(label.color),
            maxWidth: '-webkit-fill-available'
          }}
        >
          {!label.isShared && (
            <div className="absolute -top-1.5 -right-1.5 z-50 opacity-0 group-hover/label:opacity-100 transition-opacity duration-300">
              {isRemoving[label.id] ? (
                <div className={`rounded-full p-0.5 shadow-sm bg-zinc-900`}>
                  <Loader2 className="h-3 w-3 animate-spin" />
                </div>
              ) : (
                <button
                  onClick={(e) => onRemove(label.id, e)}
                  className={`rounded-full p-0.5 shadow transition-all duration-300 ease-in-out bg-zinc-900 hover:bg-zinc-800 hover:scale-110`}
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
            </div>
          )}
          <span className="truncate block">{label.name}</span>
          {label.isShared && (
            <ArrowDownLeft className="h-3 w-3 ml-1 opacity-70 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
};

const Note = ({ content, isExpanded, onToggle, isShared = false, onDelete, isDeleting, isOwned }) => {
  if (!content && !isShared) return null;

  const renderDeleteButton = () => {
    if (!isOwned) return null;

    if (isDeleting) {
      return (
        <div className="opacity-0 group-hover/note:opacity-100 transition-opacity">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      );
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover/note:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    );
  };

  const renderContent = () => {
    if (isShared && !isExpanded) return null;

    return (
      <div className="group/note relative">
        <p className={`text-sm text-muted-foreground ${isExpanded || isShared ? '' : 'line-clamp-2'}`}>
          {content}
        </p>
        <div className="absolute right-0 top-0">
          {renderDeleteButton()}
        </div>
        {!isShared && content?.length > 60 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="text-xs text-muted-foreground hover:text-primary mt-1 flex items-center gap-1"
          >
            {isExpanded ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Show more <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>
    );
  };

  return renderContent();
};

const NotesSection = ({
  note,
  sharedNotes,
  expanded,
  expandedNotes,
  setExpanded,
  toggleNoteExpanded,
  onDeleteNote,
  onRemoveSharedNote,
  isDeletingNote,
  isDeletingSharedNote
}) => {
  const hasSharedNotes = sharedNotes?.length > 0;
  const hasPrimaryNote = !!note?.content;

  const renderPrimaryNote = () => (
    <div className="w-full">
      {hasPrimaryNote && (
        <Note
          content={note.content}
          isExpanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          onDelete={() => onDeleteNote(note.id)}
          isDeleting={isDeletingNote}
          isOwned={true}
        />
      )}
    </div>
  );

  const renderSharedNotes = () => (
    <div className="w-full">
      <div className="space-y-2">
        {sharedNotes.map((note) => (
          <div key={note.id} className="overflow-hidden group/note">
            <div className="flex items-center gap-2 py-1 hover:bg-muted/30">
              <div
                className="flex-1 cursor-pointer flex items-center gap-2"
                onClick={() => toggleNoteExpanded(note.id)}
              >
                {expandedNotes[note.id] ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <h4 className="text-sm font-medium">{note.sbn}</h4>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {isDeletingSharedNote[note.id] ? (
                      <div className="h-6 w-6 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover/note:opacity-100 transition-opacity"
                        onClick={() => onRemoveSharedNote(note.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    Remove shared note
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {expandedNotes[note.id] && (
              <div className="pl-6 pt-1">
                <Note
                  content={note.content}
                  isExpanded={true}
                  onToggle={() => { }}
                  isShared={true}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (!hasSharedNotes) {
    return renderPrimaryNote();
  }

  if (!hasPrimaryNote) {
    return renderSharedNotes();
  }

  return (
    <div className="w-full">
      <Tabs defaultValue="primary" className="w-full">
        <TabsList className="w-full border-b">
          <TabsTrigger
            value="primary"
            className="flex-1 px-4 py-2"
          >
            My Notes
          </TabsTrigger>
          <TabsTrigger
            value="shared"
            className="flex-1 px-4 py-2"
          >
            <div className="flex items-center gap-2">
              Shared Notes
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-muted">
                {sharedNotes.length}
              </span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="primary">
          {renderPrimaryNote()}
        </TabsContent>

        <TabsContent value="shared">
          {renderSharedNotes()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ProfileCard = ({ profile, labels, note, sharedNotes, addUserAction }) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [actionType, setActionType] = useState(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [isDeletingSharedNote, setIsDeletingSharedNote] = useState({});
  const [removingLabels, setRemovingLabels] = useState({});
  const { user } = useAuth();
  const { theme } = useTheme();
  const db = getFirestore();


  const handleDeleteNote = async (noteId) => {
    setIsDeletingNote(true);
    try {
      const success = await deleteNote(noteId, user?.uid, false, db);
      if (success) {
        await addUserAction("Extension: Deleted owned note");
        toast.success('Note deleted successfully');
      } else {
        toast.error('Failed to delete note');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete note');
    } finally {
      setIsDeletingNote(false);
    }
  };

  const handleRemoveSharedNote = async (noteId) => {
    setIsDeletingSharedNote(prev => ({ ...prev, [noteId]: true }));
    try {
      const success = await deleteNote(noteId, user?.uid, true, db);
      if (success) {
        await addUserAction("Extension: Removed shared note");
        toast.success('Shared note removed');
      } else {
        toast.error('Failed to remove shared note');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to remove shared note');
    } finally {
      setIsDeletingSharedNote(prev => ({ ...prev, [noteId]: false }));
    }
  };

  const handleRemoveLabel = async (labelId, e) => {
    e.stopPropagation();
    const label = labels.find(l => l.id === labelId);
    setRemovingLabels(prev => ({ ...prev, [labelId]: true }));

    try {
      const success = await removeLabelFromProfile(labelId, profile.id, user?.uid, db);
      if (success) {
        await addUserAction("Extension: Removed label from profile")
        toast.success(`Removed "${label.name}" from profile`);
      } else {
        toast.error('Failed to remove label');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to remove label');
    } finally {
      setRemovingLabels(prev => ({ ...prev, [labelId]: false }));
    }
  };

  const toggleNoteExpanded = (noteId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [noteId]: !prev[noteId]
    }));
  };

  const getProfileInitials = (profile) => {
    if (profile.name) {
      return profile.name.split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    return '??';
  };

  return (
    <div className="flex flex-col p-4 border-b-[1px] hover:bg-muted/50 transition-colors group relative">
      <div className="flex items-start gap-3 w-full mb-3">
        <Avatar className="h-12 w-12 ring-1 ring-border">
          {profile.image && !profile.image.startsWith('data') ? (
            <AvatarImage src={profile.image} alt={profile.name} className="object-cover" />
          ) : (
            <AvatarFallback className="text-sm font-medium">
              {getProfileInitials(profile)}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Profile Header */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-medium truncate flex items-center gap-1.5">
              <a href={profile.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                {profile.name || 'Unknown User'}
              </a>
            </h3>

            <ProfileActionsMenu
              onAction={setActionType}
              hasNote={!!note}
            />
          </div>

          {/* Labels */}
          <ProfileLabels
            labels={labels}
            onRemove={handleRemoveLabel}
            isRemoving={removingLabels}
            theme={theme}
            onAddLabel={() => setActionType('label')}
          />
        </div>
      </div>

      {/* Notes Section */}
      <NotesSection
        note={note}
        sharedNotes={sharedNotes}
        expanded={expanded}
        expandedNotes={expandedNotes}
        setExpanded={setExpanded}
        toggleNoteExpanded={toggleNoteExpanded}
        onDeleteNote={handleDeleteNote}
        onRemoveSharedNote={handleRemoveSharedNote}
        isDeletingNote={isDeletingNote}
        isDeletingSharedNote={isDeletingSharedNote}
      />

      <ProfileActionManager
        isOpen={!!actionType}
        actionType={actionType}
        onClose={() => setActionType(null)}
        profile={profile}
        existingLabels={labels}
        existingNote={note}
        addUserAction={addUserAction}
      />
    </div>
  );
};

export default ProfileCard;