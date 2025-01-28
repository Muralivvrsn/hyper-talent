import React, { useState, useCallback } from 'react';
import { useLabels } from '../context/LabelContext';
import { useOtherUsers } from '../context/OtherUsersContext';
import { 
    Alert, 
    AlertDescription, 
    AlertTitle 
} from './ui/alert';
import { Button } from './ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from './ui/sheet';
import { Bell, Check, X, Loader2 } from 'lucide-react';
import { getFirestore, doc, runTransaction } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const PendingLabelsAlert = () => {
    const { pendingSharedLabels } = useLabels();
    const { getUserById } = useOtherUsers();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [processing, setProcessing] = useState('');
    const db = getFirestore();

    const handleLabelResponse = useCallback(async (labelId, accept) => {
        if (!user?.uid || processing) return;

        setProcessing(labelId);
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) {
                    throw new Error('User document not found');
                }

                const userData = userDoc.data();
                const currentSharedLabels = userData.d?.sl || [];
                
                // Update the shared labels array
                const updatedSharedLabels = currentSharedLabels.map(label => 
                    label.l === labelId ? { ...label, a: accept } : label
                );

                // Update the document with the new array
                transaction.update(userRef, {
                    'd.sl': updatedSharedLabels
                });
            });

            // Close sheet if no more pending labels will remain
            const pendingCount = Object.keys(pendingSharedLabels).length;
            if (pendingCount === 1) {
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Error updating label status:', error);
        } finally {
            setProcessing('');
        }
    }, [user, processing, db, pendingSharedLabels]);

    const getSharedByUser = useCallback((createdBy) => {
        if (!createdBy) return 'Unknown User';
        const sharedByUser = getUserById(createdBy);
        return sharedByUser?.name || 'Unknown User';
    }, [getUserById]);

    const pendingLabelsCount = Object.keys(pendingSharedLabels).length;

    // Early return after all hooks are declared
    if (pendingLabelsCount === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Alert className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <Bell className="h-4 w-4" />
                        <AlertTitle>Pending Label Invitations</AlertTitle>
                        <AlertDescription>
                            You have {pendingLabelsCount} pending label{pendingLabelsCount > 1 ? 's' : ''} to review
                        </AlertDescription>
                    </Alert>
                </SheetTrigger>
                
                <SheetContent side="bottom" className="h-[400px]">
                    <SheetHeader>
                        <SheetTitle>Pending Label Invitations</SheetTitle>
                    </SheetHeader>
                    
                    <div className="mt-4 space-y-4 overflow-auto max-h-[300px]">
                        {Object.entries(pendingSharedLabels).map(([labelId, label]) => (
                            <div 
                                key={labelId}
                                className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: label.color }}
                                    />
                                    <div>
                                        <h4 className="font-medium">{label.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Shared by {getSharedByUser(label.createdBy)}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1"
                                        onClick={() => handleLabelResponse(labelId, false)}
                                        disabled={processing === labelId}
                                    >
                                        {processing === labelId ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <X className="h-4 w-4" />
                                        )}
                                        Decline
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="gap-1"
                                        onClick={() => handleLabelResponse(labelId, true)}
                                        disabled={processing === labelId}
                                    >
                                        {processing === labelId ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                        Accept
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default PendingLabelsAlert;