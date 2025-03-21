import React from 'react';
import { X, Bug, Rocket, MessageSquare, RefreshCw } from 'lucide-react';
import { collection, getDocs, query, orderBy, getFirestore } from 'firebase/firestore';

const UpdateModal = ({ isOpen, onClose, currentVersion, previousVersion }) => {
  const [updates, setUpdates] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [latestVersion, setLatestVersion] = React.useState(null);
  const [updateUrl, setUpdateUrl] = React.useState('');

  React.useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const db = getFirestore();
        const updatesRef = collection(db, 'updates');
        const q = query(updatesRef, orderBy('version', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const updateData = [];
        querySnapshot.forEach((doc) => {
          updateData.push({ id: doc.id, ...doc.data() });
        });

        setUpdates(updateData);
        
        // Set latest version from the first item (since ordered by desc)
        if (updateData.length > 0) {
          setLatestVersion(updateData[0].version);
        }

        // Set update URL based on browser
        const browserType = detectBrowser();
        const extensionId = 'pipmlmbjpcdfdbblbifeeegfjbndbjbf'; // Replace with your actual extension ID
        
        const urls = {
          chrome: `https://chrome.google.com/webstore/detail/${extensionId}`,
          firefox: `https://addons.mozilla.org/en-US/firefox/addon/${extensionId}`,
          edge: `https://microsoftedge.microsoft.com/addons/detail/${extensionId}`,
          brave: `https://chrome.google.com/webstore/detail/${extensionId}`, // Brave uses Chrome Web Store
        };

        setUpdateUrl(urls[browserType] || urls.chrome);
      } catch (error) {
        console.error('Error fetching updates:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUpdates();
    }
  }, [isOpen]);

  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('edg')) return 'edge';
    if (userAgent.includes('brave')) return 'brave';
    return 'chrome';
  };

  const handleUpdate = () => {
    // Open store page in new tab
    window.open(updateUrl, '_blank');
    
    // Show instructions based on browser
    const browser = detectBrowser();
    let instructions = '';
    
    switch(browser) {
      case 'chrome':
      case 'brave':
        instructions = '1. Click the Update button on the extension page\n2. Refresh this page after update';
        break;
      case 'firefox':
        instructions = '1. Click the Update button on the add-on page\n2. Restart Firefox to complete the update';
        break;
      case 'edge':
        instructions = '1. Click the Update button on the extension page\n2. Refresh this page after update';
        break;
      default:
        instructions = 'Please update the extension from your browser\'s extension store';
    }
    
    alert(`Update Instructions:\n${instructions}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-background rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">What's New</h2>
            <button
              onClick={handleUpdate}
              className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Update
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {updates.map((update) => (
                <div 
                  key={update.id}
                  className={`border rounded-lg p-4 ${
                    update.version === currentVersion ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      Version {update.version}
                      {update.version === currentVersion && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          Current
                        </span>
                      )}
                      {update.version === latestVersion && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                          Latest
                        </span>
                      )}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {new Date(update.releaseDate?.seconds * 1000).toLocaleDateString()}
                    </span>
                  </div>

                  {update.features?.length > 0 && (
                    <div className="mb-3">
                      <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Rocket className="w-4 h-4 text-blue-500" />
                        New Features
                      </h4>
                      <ul className="space-y-1 ml-6">
                        {update.features.map((feature, index) => (
                          <li key={index} className="text-sm list-disc text-muted-foreground">
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {update.bugs?.length > 0 && (
                    <div className="mb-3">
                      <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Bug className="w-4 h-4 text-red-500" />
                        Bug Fixes
                      </h4>
                      <ul className="space-y-1 ml-6">
                        {update.bugs.map((bug, index) => (
                          <li key={index} className="text-sm list-disc text-muted-foreground">
                            {bug}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {update.suggestions?.length > 0 && (
                    <div className="mb-3">
                      <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                        <MessageSquare className="w-4 h-4 text-green-500" />
                        Implemented Suggestions
                      </h4>
                      <ul className="space-y-1 ml-6">
                        {update.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm list-disc text-muted-foreground">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateModal;