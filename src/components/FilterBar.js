import React, { useState } from 'react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { ChevronDown, Filter, X, Users, Search, Check, Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import ShareLabelsDialog from './ShareLabelsDialog';
import CreateLabelDialog from './CreateLabelDialog';
import { createLabel } from '../utils/labelUtils';
import { getFirestore, doc, runTransaction } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const FilterBar = ({
  ownedLabels,
  sharedLabels,
  selectedLabels,
  onLabelToggle,
  onSearchChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [deletingLabels, setDeletingLabels] = useState(new Set());
  const [isCreatingFromSearch, setIsCreatingFromSearch] = useState(false);
  const { user } = useAuth();
  const db = getFirestore();

  const filterLabels = (labels) => {
    if (!filterSearch) return labels;
    return labels.filter(label =>
      label.name.toLowerCase().includes(filterSearch.toLowerCase())
    );
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearchChange('');
  };

  const handleFilterKeyDown = async (e) => {
    if (e.key === 'Enter' && filterSearch.trim() &&
      !filterLabels([...ownedLabels, ...sharedLabels]).length) {
      setIsCreatingFromSearch(true);
      try {
        const result = await createLabel(filterSearch, user?.uid, db);
        if (result || !result === null) {
          setFilterSearch('');
        }
      } finally {
        setIsCreatingFromSearch(false);
      }
    }
  };

  const handleDeleteSharedLabel = async (labelId, e) => {
    e.stopPropagation();
    if (!user?.uid || deletingLabels.has(labelId)) return;

    setDeletingLabels(prev => new Set([...prev, labelId]));
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error('User document not found');
        }

        const userData = userDoc.data();
        const currentSharedLabels = userData.d?.sl || [];

        const updatedSharedLabels = currentSharedLabels.map(label =>
          label.l === labelId ? { ...label, a: false } : label
        );

        transaction.update(userRef, {
          'd.sl': updatedSharedLabels
        });
      });

      if (selectedLabels.includes(labelId)) {
        onLabelToggle(labelId);
      }
    } catch (error) {
      console.error('Error updating shared label:', error);
    } finally {
      setDeletingLabels(prev => {
        const newSet = new Set(prev);
        newSet.delete(labelId);
        return newSet;
      });
    }
  };

  const getLabelStatus = (label) => {
    if (!label.isShared) return null;
    if (label.status === 'accepted') return 'accepted';
    if (label.status === 'declined') return 'declined';
    return 'pending';
  };

  const renderLabelStatus = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const renderLabelItem = (label) => {
    const isDeleting = deletingLabels.has(label.id);
    const labelStatus = getLabelStatus(label);

    return (
      <div
        key={label.id}
        onClick={() => onLabelToggle(label.id)}
        className={`flex items-center gap-2 p-2 rounded-md group cursor-pointer
          ${selectedLabels.includes(label.id) ? 'bg-accent' : 'hover:bg-accent/50'}`}
      >
        <div className="flex-1 flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: label.color }}
          />
          <span className="flex items-center gap-2">
            {label.name}
            {label.isShared && (
              <Users className="h-3 w-3 text-muted-foreground" />
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {labelStatus && renderLabelStatus(labelStatus)}

          {selectedLabels.includes(label.id) ? (
            <Check className="h-4 w-4 text-primary" />
          ) : label.isShared && (
            isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Trash2
                className="h-4 w-4 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteSharedLabel(label.id, e)}
              />
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="w-full lg:max-w-sm relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground text-sm" />
        <Input
          placeholder="Search profiles..."
          value={searchTerm}
          onChange={handleSearch}
          className="pl-8 h-8 text-sm"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          {/* <CreateLabelDialog /> */}
          <ShareLabelsDialog />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-64 p-3" align="end">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground text-sm" />
              <Input
                placeholder="Search labels..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                onKeyDown={handleFilterKeyDown}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="max-h-[400px] bg-background overflow-y-auto px-2 pb-2 mt-2">
              {filterLabels(ownedLabels).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium sticky top-0 bg-background py-1">My Labels</h4>
                  {filterLabels(ownedLabels).map(renderLabelItem)}
                </div>
              )}

              {filterLabels(ownedLabels).length > 0 && filterLabels(sharedLabels).length > 0 && (
                <Separator className="my-3" />
              )}

              {filterLabels(sharedLabels).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium sticky top-0 bg-background py-1 flex items-center gap-2">
                    Shared Labels
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </h4>
                  {filterLabels(sharedLabels).map(renderLabelItem)}
                </div>
              )}

              {filterSearch && filterLabels([...ownedLabels, ...sharedLabels]).length === 0 && (
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground">No labels found</p>
                  <p className="text-primary mt-1">
                    {isCreatingFromSearch ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      <>Press Enter to create "{filterSearch}"</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLabels.map(labelId => {
            const label = [...ownedLabels, ...sharedLabels].find(l => l.id === labelId);
            if (!label) return null;

            return (
              <Badge
                key={labelId}
                variant="secondary"
                className="pl-2 pr-1 py-1 flex items-center gap-1"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span className="flex items-center gap-1">
                  {label.name}
                  {label.isShared && (
                    <Users className="h-3 w-3 text-muted-foreground" />
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-transparent"
                  onClick={() => onLabelToggle(labelId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterBar;