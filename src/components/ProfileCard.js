import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Users, ChevronDown, ChevronUp, MoreVertical, Tag, MessageSquarePlus, Loader2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Button } from './ui/button';
import ProfileActionManager from './ProfileActionManager';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFirestore } from 'firebase/firestore';
import { removeLabelFromProfile } from '../utils/labelUtils';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const ProfileCard = ({ profile, labels, note }) => {
  const [expanded, setExpanded] = useState(false);
  const [actionType, setActionType] = useState(null);
  const initials = profile.name?.slice(0, 2).toUpperCase() || '??';
  const [removingLabels, setRemovingLabels] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();
  const db = getFirestore();

  const handleAction = (type) => {
    setActionType(type);
  };

  const handleCloseAction = () => {
    setActionType(null);
  };

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

  return (
    <div className="flex items-start gap-3 p-4 border-b-[1px] hover:bg-muted/50 transition-colors group relative">
      <Avatar className="h-12 w-12 ring-1 ring-border">
        <AvatarImage src={profile.image} alt={profile.name} className="object-cover" />
        <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="text-base font-medium leading-none truncate flex items-center gap-1.5">
            <a
              href={profile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {profile.name || 'Unknown User'}
            </a>
            {labels?.some(label => label.isShared) && (
              <Users className="h-4 w-4 text-muted-foreground" />
            )}
          </h3>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() => handleAction('label')}
                >
                  <Tag className="h-4 w-4" />
                  Add Label
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() => handleAction('note')}
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  {note ? 'Edit Note' : 'Add Note'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {labels?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {labels.map((label) => (
              <div
                key={label.id}
                className="group/label relative inline-flex items-center text-[10px] px-3 py-0.5 rounded-full transition-all duration-200 font-semibold"
                style={{
                  backgroundColor: theme === "dark" ? `${label.color}60` : `${label.color}20`,
                  borderWidth: theme === "dark" ? "1px" : "0px",
                  borderStyle: "solid",
                  borderColor: theme === "dark" ? label.color : "transparent",
                  color: theme === "dark" ? "#FFFFFF" : label.color,
                }}
              >
                <span className="truncate">{label.name}</span>
                <div className="ml-1 w-0 group-hover/label:w-2 overflow-hidden transition-all duration-200 flex items-center justify-center z-50">
                  {removingLabels[label.id] ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <button
                      onClick={(e) => handleRemoveLabel(label.id, e)}
                      className="rounded-full flex items-center justify-center"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {note && (
          <div>
            <p className={`text-sm text-muted-foreground ${expanded ? '' : 'line-clamp-2'}`}>
              {note.content}
            </p>
            {note.content.length > 100 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="text-xs text-muted-foreground hover:text-primary mt-1 flex items-center gap-1"
              >
                {expanded ? (
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
          </div>
        )}
      </div>

      <ProfileActionManager
        isOpen={!!actionType}
        actionType={actionType}
        onClose={handleCloseAction}
        profile={profile}
        existingLabels={labels}
        existingNote={note}
      />
    </div>
  );
};

export default ProfileCard;