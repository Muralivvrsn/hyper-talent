import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

const ProfileNotes = ({ 
    editedNote, 
    setEditedNote, 
    handleSaveNote, 
    handleClearNote,
    setIsEditing,
    originalNote,
    isSaving,
    hasChanges,
    profileInfo,
    isEditing,
    formatTimeAgo 
  }) => {
    return (
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Notes</h3>
          {profileInfo?.updatedAt && !isEditing && (
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(profileInfo.updatedAt)}
            </span>
          )}
        </div>
  
        <div className="space-y-2">
          <div className="space-y-2">
            <Textarea
              value={editedNote}
              onChange={(e) => setEditedNote(e.target.value)}
              rows={3}
              placeholder="Enter your notes here..."
              className="w-full text-xs resize-none"
            />
            <div className="flex gap-1.5">
              <Button
                onClick={handleSaveNote}
                disabled={isSaving || !hasChanges}
                size="sm"
                className="h-7 text-xs px-2"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={handleClearNote}
                disabled={isSaving}
                size="sm"
                className="h-7 text-xs px-2"
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setEditedNote(originalNote);
                }}
                disabled={isSaving}
                size="sm"
                className="h-7 text-xs px-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
};
  
export default ProfileNotes;