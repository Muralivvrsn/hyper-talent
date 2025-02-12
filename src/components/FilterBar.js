import React, { useState } from 'react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Popover, PopoverTrigger } from './ui/popover';
import { Filter, X, Users, Search, ChevronUp, ChevronDown } from 'lucide-react';
import ShareLabelsDialog from './ShareLabelsDialog';
import CreateLabelDialog from './CreateLabelDialog';
import FilterPopover from './FilterPopover';
import { cn } from '../lib/utils';

const FilterBar = ({
  ownedLabels,
  sharedLabels,
  selectedLabels,
  onLabelToggle,
  onSearchChange,
  filterMode,
  onFilterModeChange,
  onNotesFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempSelectedLabels, setTempSelectedLabels] = useState(selectedLabels);
  const [hasNotesFilter, setHasNotesFilter] = useState(false);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearchChange('');
  };

  const handleApplyFilters = (labels, mode, hasNotes) => {
    selectedLabels.forEach(labelId => onLabelToggle(labelId));
    labels.forEach(labelId => onLabelToggle(labelId));
    onFilterModeChange(mode);
    onNotesFilterChange(hasNotes);
    setHasNotesFilter(hasNotes);
  };

  const handleClearFilters = () => {
    selectedLabels.forEach(labelId => onLabelToggle(labelId));
    onNotesFilterChange(false);
    setHasNotesFilter(false);
  };

  return (
    <div className={`flex flex-col gap-4 ${selectedLabels.length > 0 ? 'mb-0' : 'mb-2'}`}>
      <div className="w-full relative">
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

      <div className="flex justify-between items-center">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {(selectedLabels.length > 0 || hasNotesFilter) && (
                <Badge variant="secondary" className="ml-2">
                  {selectedLabels.length + (hasNotesFilter ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>

          <FilterPopover
            ownedLabels={ownedLabels}
            sharedLabels={sharedLabels}
            selectedLabels={selectedLabels}
            tempSelectedLabels={tempSelectedLabels}
            setTempSelectedLabels={setTempSelectedLabels}
            hasNotesFilter={hasNotesFilter}
            setHasNotesFilter={setHasNotesFilter}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            onClose={() => setIsOpen(false)}
          />
        </Popover>

        <div className="flex gap-2">
          <CreateLabelDialog
            ownedLabels={ownedLabels}
            sharedLabels={sharedLabels}
          />
          <ShareLabelsDialog ownedLabels={ownedLabels} />
        </div>
      </div>

      {(selectedLabels.length > 0 || hasNotesFilter) && (
        <div className="flex flex-col gap-2 pb-2 border-b-[1px]">
          <div
            className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>
              Showing profiles with{' '}
              {selectedLabels.length > 0 ? `${filterMode === 'all' ? 'all' : 'any'} of:` : ''}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
          <div className={cn(
            "flex flex-wrap gap-2 transition-all duration-200",
            !isExpanded && "max-h-8 overflow-hidden"
          )}>
            {selectedLabels.map(labelId => {
              const label = [...ownedLabels, ...sharedLabels].find(l => l.id === labelId);
              if (!label) return null;

              return (
                <Badge
                  key={labelId}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 flex items-center gap-1 font-normal text-xs"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex items-center gap-1 text-xs">
                    {label.name}
                    {label.isShared && (
                      <Users className="h-3 w-3 text-muted-foreground" />
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-transparent"
                    onClick={() => {
                      onLabelToggle(labelId);
                      setTempSelectedLabels(prev => prev.filter(id => id !== labelId));
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
            {hasNotesFilter && (
              <Badge
                variant="secondary"
                className="pl-2 pr-1 py-1 flex items-center gap-1 font-normal text-xs"
              >
                <span className="flex items-center gap-1 text-xs">
                  Has Notes
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-transparent"
                  onClick={() => {
                    onNotesFilterChange(false);
                    setHasNotesFilter(false);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;