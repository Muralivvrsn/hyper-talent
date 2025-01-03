import React, { useState, useEffect, useMemo } from 'react';
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Plus, Check, X, Trash2, Search, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { generateRandomColor } from '../utils/sheetUtils';
import { useTheme } from '../context/ThemeContext';

const LabelSearch = ({ searchQuery, setSearchQuery }) => (
  <div className="sticky top-0 bg-background pb-2 z-10">
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search labels..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="h-8 pl-8 text-xs"
      />
    </div>
  </div>
);

const LabelCreationForm = ({ newLabelName, setNewLabelName, handleCreateLabel, setIsCreating, loading }) => (
  <div className="space-y-2 p-2">
    <Input
      placeholder="Label name"
      value={newLabelName}
      onChange={(e) => setNewLabelName(e.target.value)}
      className="h-8 text-xs"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && newLabelName.trim()) {
          handleCreateLabel();
        }
      }}
    />
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setIsCreating(false);
          setNewLabelName('');
        }}
      >
        Cancel
      </Button>
      <Button
        size="sm"
        onClick={handleCreateLabel}
        disabled={loading || !newLabelName.trim()}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Create'
        )}
      </Button>
    </div>
  </div>
);


const LabelListItem = ({ name, data, profileId, handleToggleLabel, handleDeleteLabel, deletingLabel }) => (
  <div
    className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer group"
    onClick={() => handleToggleLabel(name)}
  >
    <div className="flex items-center gap-2 flex-1">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: data.color || '#366DA0' }}
      />
      <span className="text-xs">{name}</span>
    </div>
    <div className="flex items-center">
      {data.codes?.[profileId] && (
        <Check className="h-4 w-4 text-primary" />
      )}
      {deletingLabel === name ? (
        <Loader2 className="h-4 w-4 animate-spin ml-2" />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
          onClick={(e) => handleDeleteLabel(name, e)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  </div>
);

const LabelBadge = ({ label, handleToggleLabel, loading, isDark }) => (
  <Badge
    variant="outline"
    className="text-xs flex items-center gap-1 group"
    style={{
      ...(isDark
        ? { borderColor: label.color || '#000000' }
        : {
          backgroundColor: label.color,
          borderColor: label.color || '#000000',
          color: 'white'
        }
      )
    }}
  >
    {label.name}
    <Button
      variant="ghost"
      size="sm"
      className="h-0 w-0 p-0 hover:bg-transparent opacity-0 group-hover:opacity-100 group-hover:h-4 group-hover:w-4 transition-all"
      onClick={() => handleToggleLabel(label.name)}
      disabled={loading}
    >
      <X className="h-[0.8rem] w-[0.8rem]" />
    </Button>
  </Badge>
);

const ProfileLabels = ({ labels, profileData, profileId, getLabels, onIDBUpdate }) => {
  const { user } = useAuth();
  const [allLabels, setAllLabels] = useState({});
  const [visibleLabels, setVisibleLabels] = useState(labels || []);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingLabel, setDeletingLabel] = useState(null);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const filteredLabels = useMemo(() => {
    return Object.entries(allLabels).filter(([name]) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allLabels, searchQuery]);

  useEffect(() => {
    loadAllLabels();
    const unsubscribe = onIDBUpdate((update) => {
      if (update.type === 'labels') {
        if (update.data && update.data.labels) {
          setAllLabels(update.data.labels);
          const updatedVisibleLabels = visibleLabels.filter(label =>
            update.data.labels[label.name] &&
            update.data.labels[label.name].codes?.[profileId]
          ).map(label => ({
            name: label.name,
            color: update.data.labels[label.name].color
          }));
          setVisibleLabels(updatedVisibleLabels);
        }
      }
    });
    return () => unsubscribe();
  }, [visibleLabels, profileId]);

  useEffect(() => {
    setVisibleLabels(labels || []);
  }, [labels]);

  const loadAllLabels = async () => {
    try {
      const labelsData = await getLabels();
      if (labelsData && labelsData.labels) {
        setAllLabels(labelsData.labels);
      }
    } catch (error) {
      console.error('Error loading labels:', error);
    }
  };

  const handleToggleLabel = async (labelName) => {
    if (!user || !profileId) return;
    setLoading(true);
    try {
      const db = getFirestore();
      const labelsRef = doc(db, 'labels', user.uid);
      const updatedLabels = { ...allLabels };
      const isRemoving = updatedLabels[labelName]?.codes?.[profileId];

      if (isRemoving) {
        delete updatedLabels[labelName].codes[profileId];
        setVisibleLabels(visibleLabels.filter(label => label.name !== labelName));
      } else {
        if (!updatedLabels[labelName]) {
          updatedLabels[labelName] = {
            codes: {},
            color: generateRandomColor(),
            createdAt: new Date().toISOString()
          };
        }
        updatedLabels[labelName].codes[profileId] = {
          addedAt: new Date().toISOString(),
          code: profileData?.imageUrl,
          name: profileData?.name,
          url: profileData?.url
        };
        setVisibleLabels([
          ...visibleLabels,
          {
            name: labelName,
            color: updatedLabels[labelName].color
          }
        ]);
      }

      await updateDoc(labelsRef, { labels: updatedLabels });
      setAllLabels(updatedLabels);
    } catch (error) {
      console.error('Error toggling label:', error);
      setVisibleLabels(labels || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !user) return;
    setLoading(true);
    try {
      const db = getFirestore();
      const labelsRef = doc(db, 'labels', user.uid);
      const updatedLabels = { ...allLabels };
      const color = generateRandomColor();

      updatedLabels[newLabelName] = {
        codes: {
          [profileId]: {
            addedAt: new Date().toISOString(),
            code: profileData?.imageUrl,
            name: profileData?.name,
            url: profileData?.url
          }
        },
        color,
        createdAt: new Date().toISOString()
      };

      await updateDoc(labelsRef, { labels: updatedLabels });
      setAllLabels(updatedLabels);
      setVisibleLabels([
        ...visibleLabels,
        {
          name: newLabelName,
          color
        }
      ]);
      setNewLabelName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating label:', error);
      await loadAllLabels();
      setVisibleLabels(labels || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLabel = async (labelName, e) => {
    e.stopPropagation();
    if (!user || !labelName) return;
    setDeletingLabel(labelName);
    try {
      const db = getFirestore();
      const labelsRef = doc(db, 'labels', user.uid);
      const updatedLabels = { ...allLabels };
      delete updatedLabels[labelName];
      await updateDoc(labelsRef, { labels: updatedLabels });
      setAllLabels(updatedLabels);
      setVisibleLabels(visibleLabels.filter(label => label.name !== labelName));
    } catch (error) {
      console.error('Error deleting label:', error);
    } finally {
      setDeletingLabel(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Labels</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 mr-4">
            <div className="flex flex-col h-[280px]">
              <LabelSearch 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
              />

              <div className="overflow-y-auto flex-1 space-y-2">
                {filteredLabels.map(([name, data]) => (
                  <LabelListItem
                    key={name}
                    name={name}
                    data={data}
                    profileId={profileId}
                    handleToggleLabel={handleToggleLabel}
                    handleDeleteLabel={handleDeleteLabel}
                    deletingLabel={deletingLabel}
                  />
                ))}
              </div>

              <div className="pt-2 border-t mt-2 bg-background sticky bottom-0">
                {isCreating ? (
                  <LabelCreationForm
                    newLabelName={newLabelName}
                    setNewLabelName={setNewLabelName}
                    handleCreateLabel={handleCreateLabel}
                    setIsCreating={setIsCreating}
                    loading={loading}
                  />
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create new label
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {visibleLabels.length > 0 ? (
          visibleLabels.map((label, index) => (
            <LabelBadge
              key={index}
              label={label}
              handleToggleLabel={handleToggleLabel}
              loading={loading}
              isDark={isDark}
            />
          ))
        ) : (
          <span className="text-xs text-muted-foreground">
            No labels assigned
          </span>
        )}
      </div>
    </div>
  );
};

export default ProfileLabels;