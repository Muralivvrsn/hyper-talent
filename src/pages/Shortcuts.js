import React from 'react';
import { Keyboard } from 'lucide-react';

const Shortcuts = () => {
  const shortcuts = [
    { title: "Archive", keys: "⌘ + ⇧ + A", description: "Archive conversation" },
    { title: "Mark as unread", keys: "⌘ + U", description: "Mark conversation as unread" },
    { title: "Mark as read", keys: "⌘ + I", description: "Mark conversation as read" },
    { title: "Delete conversation", keys: "⌘ + D", description: "Delete conversation" },
    { title: "Mute", keys: "⌘ + M", description: "Mute conversation" },
    { title: "Unmute", keys: "⌘ + ⇧ + M", description: "Unmute conversation" },
    { title: "Star", keys: "⌘ + S", description: "Star conversation" },
    { title: "Remove star", keys: "⌘ + ⇧ + S", description: "Remove star from conversation" },
    { title: "Move to Other", keys: "⌘ + ⇧ + B", description: "Move conversation to Other folder" },
    { title: "Toggle floating panel", keys: "⌘ + ⇧ + L", description: "Toggle floating panel" },
    { title: "Navigate Up", keys: "⌘ + ↑", description: "Go to previous conversation" },
    { title: "Navigate Down", keys: "⌘ + ↓", description: "Go to next conversation" },
    { title: "Open Profile", keys: "⌘ + O", description: "Open profile in new tab" },
    { title: "Show Shortcuts", keys: "⌘ + ⌥ + S", description: "Show keyboard shortcuts" }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed at top */}
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Keyboard className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Keyboard Shortcuts</h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {/* Shortcuts Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors duration-200"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-medium">{shortcut.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {shortcut.description}
                  </p>
                </div>
                <div className="ml-4">
                  <kbd className="px-2 py-1 text-xs font-mono bg-secondary rounded border shadow-sm whitespace-nowrap">
                    {shortcut.keys}
                  </kbd>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Tip */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Pro tip:</span> Press{' '}
            <kbd className="px-2 py-1 text-xs font-mono bg-secondary rounded border shadow-sm">
              ⌘ + K
            </kbd>{' '}
            anywhere to quickly search for shortcuts
          </p>
        </div>
      </div>
    </div>
  );
};

export default Shortcuts;