import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Check,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Building2,
  Users,
  MessageSquare,
  Settings
} from 'lucide-react';
import { Button } from '../components/ui/button';
import EventIQIntel from '../components/EventIQIntel';

const EventIQPage = () => {
  const [toolKey, setToolKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState('loading');
  const [statusMessage, setStatusMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [stats, setStats] = useState(null);
  const [enabled, setEnabled] = useState(true);
  const [hasIntel, setHasIntel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Check if we have intel data to show
  useEffect(() => {
    const chrome = window.chrome;
    if (!chrome?.storage?.local) return;

    const checkIntel = () => {
      chrome.storage.local.get(['eventiq_intel'], (result) => {
        setHasIntel(!!result.eventiq_intel);
      });
    };

    checkIntel();

    const listener = (changes, area) => {
      if (area === 'local' && changes.eventiq_intel) {
        setHasIntel(!!changes.eventiq_intel.newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Load saved key and enabled state
  useEffect(() => {
    const chrome = window.chrome;
    if (!chrome?.storage?.sync) {
      setStatus('error');
      setStatusMessage('Chrome storage not available');
      return;
    }

    chrome.storage.sync.get(['eventiq_tool_key', 'eventiq_enabled'], (result) => {
      if (result.eventiq_tool_key) {
        setSavedKey(result.eventiq_tool_key);
        setToolKey(result.eventiq_tool_key);
        setEnabled(result.eventiq_enabled !== false);
        testConnection(result.eventiq_tool_key);
      } else {
        setStatus('disconnected');
        setStatusMessage('No API key configured');
      }
    });
  }, []);

  const testConnection = useCallback(async (key) => {
    if (!key) {
      setStatus('disconnected');
      setStatusMessage('No API key configured');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('https://us.hyperverge.space/api/tools/leader-match?name=test', {
        headers: { 'X-Tool-Key': key }
      });

      if (response.ok) {
        setStatus('connected');
        setStatusMessage('Connected to EventIQ');

        try {
          const statsRes = await fetch('https://us.hyperverge.space/api/stats', {
            headers: { 'X-Tool-Key': key }
          });
          if (statsRes.ok) {
            const data = await statsRes.json();
            setStats(data);
          }
        } catch (e) {}
      } else if (response.status === 401 || response.status === 403) {
        setStatus('error');
        setStatusMessage('Invalid API key');
      } else {
        setStatus('error');
        setStatusMessage(`Server error (${response.status})`);
      }
    } catch (err) {
      setStatus('error');
      setStatusMessage('Cannot reach EventIQ server');
    } finally {
      setTesting(false);
    }
  }, []);

  const handleSave = async () => {
    const chrome = window.chrome;
    if (!chrome?.storage?.sync) return;

    setSaving(true);

    chrome.storage.sync.set({
      eventiq_tool_key: toolKey,
      eventiq_enabled: enabled
    }, () => {
      setSavedKey(toolKey);

      if (window.EVENTIQ_CONFIG) {
        window.EVENTIQ_CONFIG.toolKey = toolKey;
        window.EVENTIQ_CONFIG.enabled = enabled;
      }

      setSaving(false);
      testConnection(toolKey);
    });
  };

  const handleDisconnect = () => {
    const chrome = window.chrome;
    if (!chrome?.storage?.sync) return;

    chrome.storage.sync.remove(['eventiq_tool_key', 'eventiq_enabled'], () => {
      setToolKey('');
      setSavedKey('');
      setStatus('disconnected');
      setStatusMessage('Disconnected');
      setStats(null);

      if (window.EVENTIQ_CONFIG) {
        window.EVENTIQ_CONFIG.toolKey = null;
        window.EVENTIQ_CONFIG.enabled = false;
      }
    });
  };

  const statusConfig = {
    loading: { color: 'text-muted-foreground', bg: 'bg-muted', icon: RefreshCw, iconClass: 'animate-spin' },
    connected: { color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', icon: Check, iconClass: '' },
    disconnected: { color: 'text-muted-foreground', bg: 'bg-muted', icon: AlertCircle, iconClass: '' },
    error: { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', icon: AlertCircle, iconClass: '' }
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;
  const hasChanges = toolKey !== savedKey;

  // If connected and we have intel, show the intel view with settings toggle
  if (status === 'connected' && hasIntel && !showSettings) {
    return (
      <div className="space-y-3 max-w-md mx-auto">
        {/* Compact header with settings toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold">EventIQ</span>
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Intel content */}
        <EventIQIntel />
      </div>
    );
  }

  // Settings view
  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">EventIQ</h1>
            <p className="text-xs text-muted-foreground">Company intelligence on LinkedIn</p>
          </div>
        </div>
        {hasIntel && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowSettings(false)}>
            Back to Intel
          </Button>
        )}
      </div>

      {/* Connection Status */}
      <div className={`flex items-center gap-3 p-3 rounded-lg ${currentStatus.bg}`}>
        <StatusIcon className={`h-4 w-4 ${currentStatus.color} ${currentStatus.iconClass}`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${currentStatus.color}`}>{statusMessage}</p>
        </div>
        {status === 'connected' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => testConnection(savedKey)}
            disabled={testing}
            className="h-7 text-xs"
          >
            {testing ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Refresh'}
          </Button>
        )}
      </div>

      {/* Stats (when connected) */}
      {status === 'connected' && stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border text-center">
            <Building2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{stats.totalCompanies || '\u2014'}</p>
            <p className="text-[10px] text-muted-foreground">Companies</p>
          </div>
          <div className="p-3 rounded-lg border text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{stats.totalLeaders || '\u2014'}</p>
            <p className="text-[10px] text-muted-foreground">Leaders</p>
          </div>
          <div className="p-3 rounded-lg border text-center">
            <MessageSquare className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{stats.recentEngagements || '\u2014'}</p>
            <p className="text-[10px] text-muted-foreground">Engagements</p>
          </div>
        </div>
      )}

      {/* API Key Configuration */}
      <div className="space-y-3">
        <label className="text-sm font-medium">API Key</label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={toolKey}
            onChange={(e) => setToolKey(e.target.value)}
            placeholder="Enter your EventIQ Tool Key"
            className="w-full h-9 px-3 pr-10 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Get your key from the EventIQ admin panel
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="text-sm font-medium">Show intel on LinkedIn</p>
          <p className="text-[11px] text-muted-foreground">Display company intel when viewing profiles</p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
            }`}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving || (!hasChanges && enabled === (savedKey ? true : false))}
          className="flex-1"
          size="sm"
        >
          {saving ? (
            <RefreshCw className="h-3 w-3 animate-spin mr-2" />
          ) : (
            <Check className="h-3 w-3 mr-2" />
          )}
          {saving ? 'Saving...' : hasChanges ? 'Save & Connect' : 'Save'}
        </Button>

        {savedKey && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Disconnect
          </Button>
        )}
      </div>

      {/* What it does */}
      <div className="space-y-2 pt-2 border-t">
        <p className="text-xs font-medium text-muted-foreground">What EventIQ shows on LinkedIn:</p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <Check className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
            Company priority, category, and description
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
            Leader background, hooks, and personal details
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
            Talking points and icebreakers for outreach
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
            Recent company news and engagement logging
          </li>
        </ul>
      </div>

      {/* Open EventIQ link */}
      <a
        href="https://us.hyperverge.space"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 text-xs text-blue-600 hover:text-blue-700 py-2"
      >
        Open EventIQ Dashboard
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
};

export default EventIQPage;
