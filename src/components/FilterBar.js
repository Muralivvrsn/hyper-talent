import React, { useState } from 'react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ChevronDown, Filter, X } from 'lucide-react';

const FilterBar = ({ labels, selectedLabels, onLabelToggle, onSearchChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearchChange('');
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex gap-4 items-center">
        {/* Search Input */}
        <div className="flex-1 max-w-sm relative">
          <Input
            placeholder="Search profiles..."
            value={searchTerm}
            onChange={handleSearch}
            className="pr-10"
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

        {/* Filter Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-2">
              {labels.map(label => (
                <div
                  key={label.id}
                  className="flex items-center gap-2 hover:bg-accent p-2 rounded-md cursor-pointer"
                  onClick={() => onLabelToggle(label.id)}
                >
                  <span 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex-1">{label.name}</span>
                  {selectedLabels.includes(label.id) && (
                    <Badge variant="secondary" className="bg-primary/10">
                      Selected
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Labels */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLabels.map(labelId => {
            const label = labels.find(l => l.id === labelId);
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
                {label.name}
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