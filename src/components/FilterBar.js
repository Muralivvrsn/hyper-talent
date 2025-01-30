import React, { useState } from 'react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { ChevronDown, Filter, X, Users, Search } from 'lucide-react';
import ShareLabelsDialog from './ShareLabelsDialog';

const FilterBar = ({
  ownedLabels,
  sharedLabels,
  selectedLabels,
  onLabelToggle,
  onSearchChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

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

  const renderLabelItem = (label) => (
    <div
      key={label.id}
      className="flex items-center gap-2 hover:bg-accent p-2 rounded-md cursor-pointer"
      onClick={() => onLabelToggle(label.id)}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: label.color }}
      />
      <span className="flex-1 flex items-center gap-2">
        {label.name}
        {label.isShared && (
          <Users className="h-3 w-3 text-muted-foreground" />
        )}
      </span>
      {selectedLabels.includes(label.id) && (
        <Badge variant="secondary" className="bg-primary/10">
          Selected
        </Badge>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center ">
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
        <div>
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
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="max-h-[400px] bg-background overflow-y-auto px-2 pb-2 mt-2">
              {/* Owned Labels */}
              {filterLabels(ownedLabels).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium sticky top-0 bg-background py-1">My Labels</h4>
                  {filterLabels(ownedLabels).map(renderLabelItem)}
                </div>
              )}

              {/* Separator if both types exist */}
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
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No labels found
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