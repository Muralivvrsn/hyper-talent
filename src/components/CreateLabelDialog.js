import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Plus, Loader2, Search, Tag, Trash2, X } from 'lucide-react';
import { getFirestore } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { createLabel, deleteLabel } from '../utils/labelUtils';
import { toast } from 'react-hot-toast';
import { ScrollArea } from './ui/scroll-area';

const CreateLabelDialog = ({ ownedLabels, sharedLabels, addUserAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [labelName, setLabelName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAuth();
    const db = getFirestore();

    const handleCreateLabel = async () => {
        if (isCreating || !labelName.trim()) return;

        setIsCreating(true);
        try {
            const result = await createLabel(labelName, user?.uid, db);
            if (result) {
                await addUserAction("Extension: Created new label")
                toast.success(`Label "${labelName}" created successfully`);
                setIsOpen(false);
                setLabelName('');
                setSearchTerm('');
            } else {
                toast.error('Label with this name already exists');
            }
        } catch (error) {
            toast.error('Failed to create label');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteLabel = async (labelId, isShared) => {
        if (isCreating) return;
        setIsDeleting(true);
        try {
            await deleteLabel(labelId, user?.uid, isShared, db);
            await addUserAction("Extension: Deleted label")
            toast.success('Label deleted successfully');
        } catch (error) {
            toast.error('Failed to delete label');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleCreateLabel();
        }
    };

    const filterLabels = (labels) => labels.filter(label =>
        label.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));

    const filteredOwnedLabels = filterLabels(ownedLabels);
    const filteredSharedLabels = filterLabels(sharedLabels);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setLabelName(e.target.value);
    };

    const renderLabelList = (labels, isShared) => (
        labels.map(label => (
            <div
                key={label.id}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent/50 relative group"
            >
                <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: label.color }}
                />
                <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-xs break-words">
                        {label.name}
                    </span>
                </div>
                {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : !isShared ? (
                    <Trash2
                        className="h-4 w-4 text-red-500 cursor-pointer opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteLabel(label.id, isShared)}
                    />
                ) : (
                    <X
                        className="h-4 w-4 cursor-pointer opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteLabel(label.id, isShared)}
                    />
                )}
                <span className='w-7 h-7 rounded-full bg-muted flex justify-center items-center text-[10px]'>{label.profileCount}</span>
            </div>
        ))
    );

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Tag className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3">
                <div className="space-y-4">
                    <h4 className="font-medium text-sm">Create New Label</h4>

                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="create label..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={handleKeyDown}
                            className="pl-8 h-8 text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            {filteredOwnedLabels.length + filteredSharedLabels.length} labels
                        </span>
                        <Button
                            size="sm"
                            onClick={handleCreateLabel}
                            disabled={!labelName.trim() || isCreating}
                            className="gap-1"
                        >
                            {isCreating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            Create
                        </Button>
                    </div>

                    <ScrollArea className="h-[200px] pr-4">
                        <div className="space-y-2">
                            {searchTerm ? (
                                <>
                                    {filteredOwnedLabels.length > 0 && (
                                        <>
                                            {filteredSharedLabels.length > 0 &&
                                                <div className="text-sm">Your Labels <small>({filteredOwnedLabels.length})</small></div>
                                            }
                                            {renderLabelList(filteredOwnedLabels, false)}
                                        </>
                                    )}

                                    {filteredSharedLabels.length > 0 && (
                                        <>
                                            <div className="text-sm mt-4">Shared Labels <small>({filteredSharedLabels.length})</small></div>
                                            {renderLabelList(filteredSharedLabels, true)}
                                        </>
                                    )}

                                    {filteredOwnedLabels.length === 0 && filteredSharedLabels.length === 0 && (
                                        <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                                            <p>No matching labels</p>
                                            <p className="mt-1">Press Enter to create new label</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {ownedLabels.length > 0 && (
                                        <>
                                            {sharedLabels.length > 0 &&
                                                <div className="text-sm">Your Labels <small>({ownedLabels.length})</small></div>
                                            }
                                            {renderLabelList(ownedLabels, false)}
                                        </>
                                    )}

                                    {sharedLabels.length > 0 && (
                                        <>
                                            <div className="text-sm mt-4">Shared Labels <small>({sharedLabels.length})</small></div>
                                            {renderLabelList(sharedLabels, true)}
                                        </>
                                    )}

                                    {ownedLabels.length === 0 && sharedLabels.length === 0 && (
                                        <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                                            <p>No labels available</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default CreateLabelDialog;