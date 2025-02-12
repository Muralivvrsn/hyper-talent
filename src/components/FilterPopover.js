import React, { useEffect, useState } from 'react';
import { PopoverContent } from './ui/popover';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Users, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Checkbox } from './ui/checkbox';
const FilterType = {
    MY_LABELS: 'my_labels',
    SHARED_LABELS: 'shared_labels',
    NOTES: 'notes',
};

const FilterMode = {
    ANY: 'any',
    ALL: 'all',
};

const FilterPopover = ({
    ownedLabels,
    sharedLabels,
    selectedLabels,
    tempSelectedLabels,
    setTempSelectedLabels,
    hasNotesFilter,
    setHasNotesFilter,
    onApplyFilters,
    onClearFilters,
    onClose
}) => {
    const [activeFilter, setActiveFilter] = useState(FilterType.MY_LABELS);
    const [filterSearch, setFilterSearch] = useState('');
    const [filterMode, setFilterMode] = useState(FilterMode.ANY);
    const [tempHasNotesFilter, setTempHasNotesFilter] = useState(hasNotesFilter);

    useEffect(() => {
        setTempHasNotesFilter(hasNotesFilter);
    }, [hasNotesFilter]);

    const hasActiveFilters = selectedLabels.length > 0 || hasNotesFilter;

    const filterLabels = (labels) => {
        if (!filterSearch) return labels;
        return labels.filter(label =>
            label.name.toLowerCase().includes(filterSearch.toLowerCase())
        );
    };

    const handleApplyFilters = () => {
        onApplyFilters(tempSelectedLabels, filterMode, tempHasNotesFilter);
        onClose?.();
    };

    const handleClearFilters = () => {
        setTempSelectedLabels([]);
        setTempHasNotesFilter(false);
        onClearFilters();
        onClose?.();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (tempSelectedLabels.length > 0 || tempHasNotesFilter)) {
            handleApplyFilters();
        }
    };

    const toggleLabel = (labelId) => {
        setTempSelectedLabels(prev =>
            prev.includes(labelId)
                ? prev.filter(id => id !== labelId)
                : [...prev, labelId]
        );
    };

    const renderLabels = () => {
        const labels = activeFilter === FilterType.MY_LABELS ? ownedLabels : sharedLabels;

        return filterLabels(labels).map(label => (
            <label
                key={label.id}
                className={cn(
                    "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent/50",
                    tempSelectedLabels.includes(label.id) && "bg-accent"
                )}
            >
                <input
                    type="checkbox"
                    className="hidden"
                    checked={tempSelectedLabels.includes(label.id)}
                    onChange={() => toggleLabel(label.id)}
                />
                <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: label.color }}
                />
                <span className="flex-1 flex items-center gap-2">
                    {label.name}
                    {label.isShared && <Users className="h-3 w-3 text-muted-foreground" />}
                </span>
                {tempSelectedLabels.includes(label.id) && (
                    <Check className="h-4 w-4 text-primary" />
                )}
            </label>
        ));
    };

    return (
        <PopoverContent
            className="w-[280px] p-0 sm:w-[320px]"
            align="start"
            side="bottom"
            onKeyDown={handleKeyDown}
        >
            <div className="flex flex-col h-[400px]">
                {/* Search */}
                <div className="p-2 border-b sticky top-0 bg-background z-10">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search labels..."
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-8 h-8 text-sm"
                        />
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="grid grid-cols-3 border-b">
                    <Button
                        variant={activeFilter === FilterType.MY_LABELS ? "secondary" : "ghost"}
                        className="h-8 rounded-none text-xs"
                        onClick={() => setActiveFilter(FilterType.MY_LABELS)}
                    >
                        My Labels
                    </Button>
                    <Button
                        variant={activeFilter === FilterType.SHARED_LABELS ? "secondary" : "ghost"}
                        className="h-8 rounded-none text-xs"
                        onClick={() => setActiveFilter(FilterType.SHARED_LABELS)}
                    >
                        Shared
                    </Button>
                    <Button
                        variant={activeFilter === FilterType.NOTES ? "secondary" : "ghost"}
                        className="h-8 rounded-none text-xs"
                        onClick={() => setActiveFilter(FilterType.NOTES)}
                    >
                        Notes
                    </Button>
                </div>

                {/* Label List */}
                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-1 p-2">
                        {activeFilter === FilterType.NOTES ? (
                            <>
                                <label
                                    className={cn(
                                        "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent/50",
                                        tempHasNotesFilter && "bg-accent"
                                    )}
                                >
                                    <Checkbox
                                        checked={tempHasNotesFilter}
                                        onCheckedChange={() => setTempHasNotesFilter(!tempHasNotesFilter)}
                                        className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                    />
                                    <div className="flex-1 flex items-center gap-2">
                                        <span className="text-sm">Show profiles with notes</span>
                                    </div>
                                </label>
                                <p className="mt-2 text-xs text-muted-foreground px-2">
                                    Filter profiles that have any notes added to them
                                </p>
                            </>
                        ) : (
                            renderLabels()
                        )}
                    </div>
                </div>
                {/* Filter Mode */}
                {tempSelectedLabels.length > 0 && (
                    <div className="p-2 border-t">
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={filterMode === FilterMode.ANY ? "secondary" : "ghost"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setFilterMode(FilterMode.ANY)}
                            >
                                Match any label
                            </Button>
                            <Button
                                variant={filterMode === FilterMode.ALL ? "secondary" : "ghost"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setFilterMode(FilterMode.ALL)}
                            >
                                Match All label
                            </Button>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="p-2 border-t sticky bottom-0 bg-background">
                    <div className="flex gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            className="flex-1 h-8"
                            onClick={handleApplyFilters}
                        >
                            Apply
                        </Button>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3"
                                onClick={handleClearFilters}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </PopoverContent>
    );
};

export default FilterPopover;