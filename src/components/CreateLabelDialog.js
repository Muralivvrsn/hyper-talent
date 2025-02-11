import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { getFirestore } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { createLabel } from '../utils/labelUtils';

const CreateLabelDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [labelName, setLabelName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const { user } = useAuth();
    const db = getFirestore();

    const handleCreateLabel = async () => {
        if (isCreating) return;

        setIsCreating(true);
        try {
            const result = await createLabel(labelName, user?.uid, db);
            if (result || !result === null) {
                setIsOpen(false);
                setLabelName('');
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleCreateLabel();
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Create New Label</h4>
                    <Input
                        placeholder="Enter label name..."
                        value={labelName}
                        onChange={(e) => setLabelName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-sm"
                    />
                    <div className="flex justify-end">
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
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default CreateLabelDialog;