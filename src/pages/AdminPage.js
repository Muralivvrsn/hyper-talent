import React, { useState } from 'react';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { PlusCircle, MinusCircle, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMigration } from '../context/MigrationContext';
import Dashboard from '../components/Dashboard';
import ScreenRecorder from '../components/ScreenRecorder';
const AdminPage = () => {
  const { user } = useAuth();
  const { add_label_user } = useMigration();

  const handleMigration = async () => {
    const result = await add_label_user();
    if (result.success) {
      // console.log(`Migrated ${result.usersProcessed} users`);
    }
  };


  const ADMIN_EMAILS = ['murali.g@hyperverge.co', 'satish.d@hyperverge.co', 'muralivvrsn75683@gmail.com'];

  const [version, setVersion] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [bugInput, setBugInput] = useState('');
  const [suggestionInput, setSuggestionInput] = useState('');

  const [features, setFeatures] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errors, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!ADMIN_EMAILS.includes(user?.email)) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setFeatures([...features, featureInput.trim()]);
    setFeatureInput('');
  };

  const removeFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const addBug = () => {
    if (!bugInput.trim()) return;
    setBugs([...bugs, bugInput.trim()]);
    setBugInput('');
  };

  const removeBug = (index) => {
    setBugs(bugs.filter((_, i) => i !== index));
  };

  const addSuggestion = () => {
    if (!suggestionInput.trim()) return;
    setSuggestions([...suggestions, suggestionInput.trim()]);
    setSuggestionInput('');
  };

  const removeSuggestion = (index) => {
    setSuggestions(suggestions.filter((_, i) => i !== index));
  };

  const handleFeatureKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature();
    }
  };

  const handleBugKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBug();
    }
  };

  const handleSuggestionKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSuggestion();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const versionRegex = /^\d+\.\d+\.\d+$/;
      if (!versionRegex.test(version)) {
        throw new Error('Version must be in format x.x.x (e.g., 1.0.0)');
      }

      const data = {
        version,
        releaseDate: new Date(),
        features,
        bugs,
        suggestions
      };

      const db = getFirestore();
      await setDoc(doc(db, 'updates', version), data);

      setSuccess('Update published successfully!');

      // Reset all fields
      setVersion('');
      setFeatureInput('');
      setBugInput('');
      setSuggestionInput('');
      setFeatures([]);
      setBugs([]);
      setSuggestions([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <h1 className="text-lg font-semibold mb-2">Admin Update Manager</h1>
        <p className="text-muted-foreground">
          Publish new version updates and changes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Version */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Version Number
          </label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g., 1.0.0"
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Features */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            New Features
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={handleFeatureKeyPress}
              placeholder="Add a new feature"
              className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={addFeature}
              className="p-2 text-green-500 hover:text-green-700"
            >
              <PlusCircle className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-2 mt-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-card rounded-lg border shadow-sm"
              >
                <span className="flex-1 text-sm">{feature}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="ml-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                >
                  <MinusCircle className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bugs */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Bug Fixes
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={bugInput}
              onChange={(e) => setBugInput(e.target.value)}
              onKeyDown={handleBugKeyPress}
              placeholder="Add a bug fix"
              className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={addBug}
              className="p-2 text-green-500 hover:text-green-700"
            >
              <PlusCircle className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-2 mt-4">
            {bugs.map((bug, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-card rounded-lg border shadow-sm"
              >
                <span className="flex-1 text-sm">{bug}</span>
                <button
                  type="button"
                  onClick={() => removeBug(index)}
                  className="ml-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                >
                  <MinusCircle className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Implemented Suggestions
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={suggestionInput}
              onChange={(e) => setSuggestionInput(e.target.value)}
              onKeyDown={handleSuggestionKeyPress}
              placeholder="Add an implemented suggestion"
              className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={addSuggestion}
              className="p-2 text-green-500 hover:text-green-700"
            >
              <PlusCircle className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-2 mt-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-card rounded-lg border shadow-sm"
              >
                <span className="flex-1 text-sm">{suggestion}</span>
                <button
                  type="button"
                  onClick={() => removeSuggestion(index)}
                  className="ml-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                >
                  <MinusCircle className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {errors}
          </div>
        )} */}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Publish Update
            </>
          )}
        </button>
      </form>

      <div>
       {/* <Dashboard/> */}
       {/* <ScreenRecorder/> */}
      </div>
    </div>
  );
};

export default AdminPage;