import React, { useEffect, useState, useMemo } from 'react';
import { Keyboard, Search } from 'lucide-react';

const usePlatform = () => {
  const [isMac, setIsMac] = useState(true);
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);
  return isMac;
};

const KeySymbol = ({ symbol }) => {
  const isMac = usePlatform();
  const keyMap = {
    '⌘': isMac ? '⌘' : 'Ctrl',
    '⇧': 'Shift',
    '⌥': isMac ? '⌥' : 'Alt',
    '↑': '↑',
    '↓': '↓'
  };
  return <span>{keyMap[symbol] || symbol}</span>;
};

const ShortcutCard = ({ shortcut }) => (
  <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors duration-200">
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <h3 className="font-medium text-sm">{shortcut.title}</h3>
        <p className="text-xs text-muted-foreground">
          {shortcut.description}
        </p>
      </div>
      <div className="ml-4">
        <kbd className="px-2 py-1 text-xs font-mono bg-secondary rounded border shadow-sm whitespace-nowrap">
          {shortcut.keys.map((key, index) => (
            <React.Fragment key={index}>
              {index > 0 && ' + '}
              <KeySymbol symbol={key} />
            </React.Fragment>
          ))}
        </kbd>
      </div>
    </div>
  </div>
);

const ShortcutCategory = ({ title, shortcuts }) => (
  <div>
    <h2 className="text-base font-semibold pb-2">{title}</h2>
    <div className="grid gap-4 md:grid-cols-2">
      {shortcuts.map((shortcut, index) => (
        <ShortcutCard key={index} shortcut={shortcut} />
      ))}
    </div>
  </div>
);

const Shortcuts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState({});

  const shortcutCategories = {
    essential: {
      title: "Essential Actions",
      shortcuts: [
        { title: "Open Profile", keys: ["O"], description: "Open profile in new tab", priority: "high" },
        // { title: "Show Shortcuts", keys: ["⌘", "⌥", "S"], description: "Show keyboard shortcuts" },
        // { title: "Quick Search", keys: ["⌘", "K"], description: "Search shortcuts" }
      ]
    },
    navigation: {
      title: "Navigation",
      shortcuts: [
        { title: "Navigate Up", keys: ["⌘", "↑"], description: "Go to previous conversation" },
        { title: "Navigate Down", keys: ["⌘", "↓"], description: "Go to next conversation" },
        // { title: "Toggle Panel", keys: ["⌘", "⇧", "L"], description: "Toggle floating panel" }
      ]
    },
    conversation: {
      title: "Conversation Management",
      shortcuts: [
        { title: "Archive", keys: ["E"], description: "Archive conversation" },
        { title: "Mark as read", keys: ["⇧", "I"], description: "Mark conversation as read" },
        { title: "Mark as unread", keys: ["⇧", "U"], description: "Mark conversation as unread" },
        { title: "Delete", keys: ["⇧", "D"], description: "Delete conversation" }
      ]
    },
    flags: {
      title: "Flags & States",
      shortcuts: [
        { title: "Mute", keys: ["M"], description: "Mute conversation" },
        { title: "Unmute", keys: ["⇧", "M"], description: "Unmute conversation" },
        { title: "Star", keys: ["S"], description: "Star conversation" },
        { title: "Remove star", keys: ["⇧", "S"], description: "Remove star from conversation" }
      ]
    }
  };

  // Memoized search function to prevent unnecessary re-renders
  const filterShortcuts = useMemo(() => {
    if (!searchQuery.trim()) {
      return shortcutCategories;
    }

    const query = searchQuery.toLowerCase();
    const filtered = {};

    Object.entries(shortcutCategories).forEach(([key, category]) => {
      // Check if category title matches
      const categoryMatches = category.title.toLowerCase().includes(query);
      
      // Filter shortcuts within category
      const matchingShortcuts = category.shortcuts.filter(shortcut => 
        shortcut.title.toLowerCase().includes(query) ||
        shortcut.description.toLowerCase().includes(query) ||
        categoryMatches
      );

      if (matchingShortcuts.length > 0) {
        filtered[key] = {
          ...category,
          shortcuts: matchingShortcuts
        };
      }
    });

    return filtered;
  }, [searchQuery]);

  // Update filtered results whenever search query changes
  useEffect(() => {
    setFilteredCategories(filterShortcuts);
  }, [filterShortcuts]);

  // Handle keyboard shortcut for search focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('shortcut-search').focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="pb-3 space-y-3 sticky top-0 z-10">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold">Keyboard Shortcuts</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 text-sm" />
          <input
            id="shortcut-search"
            type="text"
            placeholder="Search shortcuts (⌘ + K)"
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-4">
        {Object.keys(filteredCategories).length > 0 ? (
          Object.entries(filteredCategories).map(([key, category]) => (
            <ShortcutCategory 
              key={key}
              title={category.title}
              shortcuts={category.shortcuts}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No shortcuts found matching your search.
          </div>
        )}

        {/* <div className="mt-8 p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Pro tip:</span> Press{' '}
            <kbd className="px-2 py-1 text-xs font-mono bg-secondary rounded border shadow-sm">
              <KeySymbol symbol="⌘" /> + K
            </kbd>{' '}
            to focus the search box
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default Shortcuts;