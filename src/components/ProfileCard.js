import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Users, ChevronDown, ChevronUp, MoreVertical, Tag, MessageSquarePlus, Loader2, ChevronRight, Plus } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Button } from './ui/button';
import ProfileActionManager from './ProfileActionManager';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFirestore } from 'firebase/firestore';
import { removeLabelFromProfile } from '../utils/labelUtils';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

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
      if (!hslValues) return '#000000'; // Default to black if parsing fails
      h = hslValues.h;
      s = hslValues.s;
      l = hslValues.l;
    }

    // For very light colors (high lightness), use black text
    // For darker colors, use white text
    // We can also consider saturation in the calculation
    const threshold = 65; // Adjust this value to fine-tune the switch point

    // If the color is very light (high lightness) or has very low saturation, use black
    if (l > threshold || (l > 60 && s < 15)) {
      return '#000000';
    }
    return '#FFFFFF';
  }
  const hexToHSL=(hex) =>{
    // Remove the # if present
    hex = hex.replace(/^#/, '');

    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  const parseHSL = (hslString) => {
    const matches = hslString.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
    if (!matches) return null;
    return {
      h: parseInt(matches[1]),
      s: parseInt(matches[2]),
      l: parseInt(matches[3])
    };
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {labels.map((label) => (
        <div
          key={label.id}
          className="group/label relative inline-flex items-center text-[10px] px-3 py-0.5 rounded-full transition-all duration-200 font-semibold"
          style={{
            backgroundColor: theme === "dark" ? label.color : 'transparent',
            borderWidth: theme === "dark" ? "0px" : "1px",
            borderStyle: "solid",
            borderColor: theme === "dark" ? "transparent" : label.color,
            color: generateTextColor(label.color),
          }}
        >
          <span className="truncate">{label.name}</span>
          <div className="ml-1 w-0 group-hover/label:w-2 overflow-hidden transition-all duration-200 flex items-center justify-center z-50">
            {isRemoving[label.id] ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <button
                onClick={(e) => onRemove(label.id, e)}
                className="rounded-full flex items-center justify-center"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>
      ))}
      {/* <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
        onClick={onAddLabel}
      >
        <Plus className="h-3 w-3" /> Add
      </Button> */}
    </div>
  );
};

const Note = ({ content, isExpanded, onToggle, isShared = false }) => {
  if (!content && !isShared) return null;

  const renderContent = () => {
    if (isShared && !isExpanded) return null;

    const contentElement = (
      <>
        <p className={`text-sm text-muted-foreground ${isExpanded || isShared ? '' : 'line-clamp-2'}`}>
          {content}
        </p>
        {!isShared && content?.length > 60 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="text-xs text-muted-foreground hover:text-primary mt-1 flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                Show less
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Show more
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </>
    );
    return contentElement;
  };

  return renderContent()
};

const NotesSection = ({
  note,
  sharedNotes,
  expanded,
  expandedNotes,
  setExpanded,
  toggleNoteExpanded,
  setActionType
}) => {
  const [activeTab, setActiveTab] = useState('primary');
  const hasSharedNotes = sharedNotes?.length > 0;
  const hasPrimaryNote = !!note?.content;

  // Helper to render primary note or empty state
  const renderPrimaryNote = () => (
    <div className="w-full">
      {hasPrimaryNote && (
        <Note
          content={note.content}
          isExpanded={expanded}
          onToggle={() => setExpanded(!expanded)}
        />
      )}
    </div>
  );

  // Helper to render shared notes
  const renderSharedNotes = () => (
    <div className="w-full">
      <div className="space-y-2">
        {sharedNotes.map((note) => (
          <div key={note.id} className="overflow-hidden">
            <div
              className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/30"
              onClick={() => toggleNoteExpanded(note.id)}
            >
              {expandedNotes[note.id] ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <h4 className="text-sm font-medium flex-1">
                {note.sbn}
              </h4>
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
    <div className="w-full mt-2">
      <div className="flex  border-b mb-2">
        <button
          className={`px-3 py-1 text-sm font-medium ${activeTab === 'primary'
            ? 'border-b-2 border-primary text-primary'
            : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('primary')}
        >
          My Notes
        </button>
        <button
          className={`px-3 py-1 text-sm font-medium flex items-center gap-1.5 ${activeTab === 'shared'
            ? 'border-b-2 border-primary text-primary'
            : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('shared')}
        >
          Shared Notes
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-muted">
            {sharedNotes.length}
          </span>
        </button>
      </div>

      <div className="pt-1">
        {activeTab === 'primary' ? renderPrimaryNote() : renderSharedNotes()}
      </div>
    </div>
  );
};

const ProfileCard = ({ profile, labels, note, sharedNotes }) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [actionType, setActionType] = useState(null);
  const [removingLabels, setRemovingLabels] = useState({});
  const { user } = useAuth();
  const { theme } = useTheme();
  const db = getFirestore();


  const handleRemoveLabel = async (labelId, e) => {
    e.stopPropagation();
    const label = labels.find(l => l.id === labelId);
    setRemovingLabels(prev => ({ ...prev, [labelId]: true }));

    try {
      const success = await removeLabelFromProfile(labelId, profile.id, user?.uid, db);
      if (success) {
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
            <h3 className="text-base font-medium leading-none truncate flex items-center gap-1.5">
              <a href={profile.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {profile.name || 'Unknown User'}
              </a>
              {labels?.some(label => label.isShared) && (
                <Users className="h-4 w-4 text-muted-foreground" />
              )}
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
        setActionType={setActionType}
      />

      <ProfileActionManager
        isOpen={!!actionType}
        actionType={actionType}
        onClose={() => setActionType(null)}
        profile={profile}
        existingLabels={labels}
        existingNote={note}
      />
    </div>
  );
};

export default ProfileCard;