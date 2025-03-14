import React, { useState, useCallback } from 'react';
import { useLabels } from '../context/LabelContext';
import { useTheme } from '../context/ThemeContext';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
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

const PendingLabelsAlert = ({addUserAction}) => {
    const { pendingSharedLabels } = useLabels();
    const { user } = useAuth();
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedLabels, setSelectedLabels] = useState([]);
    const db = getFirestore();

    const handleLabelResponse = useCallback(async (accept) => {
        if (!user?.uid || processing || selectedLabels.length === 0) return;

        setProcessing(true);
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users_v2', user.uid);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) {
                    throw new Error('User document not found');
                }

                const userData = userDoc.data();
                const allLabels = userData.d?.l || [];

                let updatedLabels;

                if (accept) {
                    await addUserAction("Extension: Accepted shared labels")
                    updatedLabels = allLabels.map(label =>
                        (selectedLabels.includes(label.id) && label.t === 'shared')
                            ? { ...label, a: true }
                            : label
                    );
                } else {
                    await addUserAction("Extension: Declined shared labels");
                    updatedLabels = allLabels.filter(label =>
                        !(selectedLabels.includes(label.id) && label.t === 'shared')
                    );
                }

                transaction.update(userRef, {
                    'd.l': updatedLabels
                });
            });

            if (selectedLabels.length === Object.keys(pendingSharedLabels).length) {
                setIsOpen(false);
            }
            setSelectedLabels([]);
        } catch (error) {
            console.error('Error updating label status:', error);
        } finally {
            setProcessing(false);
        }
    }, [user, processing, db, pendingSharedLabels, selectedLabels]);

    const toggleLabelSelection = (labelId) => {
        setSelectedLabels(prev =>
            prev.includes(labelId)
                ? prev.filter(id => id !== labelId)
                : [...prev, labelId]
        );
    };

    const pendingLabelsCount = Object.keys(pendingSharedLabels).length;

    if (pendingLabelsCount === 0) {
        return null;
    }

    // Define theme-specific styles for better visibility
    const alertStyles = theme === "dark"
        ? "border-2 border-blue-400 bg-slate-800 shadow-lg shadow-blue-500/20"
        : "border-2 border-blue-500 bg-white shadow-lg shadow-blue-500/20";

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Alert
                        className={`cursor-pointer hover:bg-accent transition-colors ${alertStyles} transform hover:scale-105 transition-all duration-200`}
                    >
                        <div className="relative flex items-center">
                            <Bell className="h-5 w-5 text-blue-500 animate-pulse" />
                            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-red-500 rounded-full text-white text-xs font-bold">{pendingLabelsCount}</span>
                            <div className="ml-2">
                                <AlertTitle className={`font-semibold ${theme === "dark" ? "text-white" : "text-slate-800"}`}>
                                    Pending Label Invitations
                                </AlertTitle>
                                <AlertDescription className={`text-xs ${theme === "dark" ? "text-blue-200" : "text-blue-600"}`}>
                                    You have {pendingLabelsCount} pending label{pendingLabelsCount > 1 ? 's' : ''} to review
                                </AlertDescription>
                            </div>
                        </div>

                    </Alert>
                </SheetTrigger>

                <SheetContent side="bottom" className="h-[400px] flex flex-col">
                    <SheetHeader>
                        <SheetTitle>Pending Label Invitations ({pendingLabelsCount})</SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-auto py-4">
                        <div className="space-y-2">
                            {Object.entries(pendingSharedLabels).map(([labelId, label]) => (
                                <div
                                    key={labelId}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedLabels.includes(labelId)
                                        ? theme === "dark" ? 'bg-slate-700' : 'bg-accent'
                                        : theme === "dark" ? 'hover:bg-slate-800' : 'hover:bg-accent/50'
                                        }`}
                                    onClick={() => toggleLabelSelection(labelId)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={selectedLabels.includes(labelId)}
                                            onCheckedChange={() => toggleLabelSelection(labelId)}
                                            id={`label-${labelId}`}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <span
                                            className="w-3 h-3 rounded-full text-lg"
                                            style={{ backgroundColor: label.color }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium">{label.name}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                Shared by {label.sharedByName || 'Unknown User'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t pt-4 bg-background">
                        <div className="flex gap-2 justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => handleLabelResponse(false)}
                                disabled={selectedLabels.length === 0 || processing}
                            >
                                {processing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <X className="h-4 w-4" />
                                )}
                                Decline Selected
                            </Button>
                            <Button
                                size="sm"
                                className="gap-1"
                                onClick={() => handleLabelResponse(true)}
                                disabled={selectedLabels.length === 0 || processing}
                            >
                                {processing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4" />
                                )}
                                Accept Selected
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default PendingLabelsAlert;