import React, { useState } from 'react';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { 
  PlusCircle, 
  MinusCircle, 
  Save, 
  AlertCircle,
  Lightbulb,
  Heart,
  Loader2
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

// Import Shadcn UI components
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";

const UpdatesTab = () => {
  const { updates, loading, error } = useAdmin();
  
  // Form state
  const [version, setVersion] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [bugInput, setBugInput] = useState('');
  const [suggestionInput, setSuggestionInput] = useState('');
  const [features, setFeatures] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form handlers
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
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

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

      setFormSuccess('Update published successfully!');

      // Reset all fields
      setVersion('');
      setFeatureInput('');
      setBugInput('');
      setSuggestionInput('');
      setFeatures([]);
      setBugs([]);
      setSuggestions([]);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-8">
      {/* Create New Update Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Update</CardTitle>
          <CardDescription>
            Publish a new version with features, bug fixes, and implemented suggestions
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Version */}
            <div className="space-y-2">
              <Label htmlFor="version">Version Number</Label>
              <Input
                id="version"
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g., 1.0.0"
              />
            </div>

            {/* Features */}
            <div className="space-y-4">
              <Label>New Features</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={handleFeatureKeyPress}
                  placeholder="Add a new feature"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={addFeature} 
                  size="icon" 
                  variant="outline"
                  className="text-green-500 hover:text-green-700 hover:bg-green-50"
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
              
              {features.length > 0 && (
                <ScrollArea className="h-40 rounded-md border">
                  <div className="p-2 space-y-2">
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-card rounded-lg border shadow-sm"
                      >
                        <span className="flex-1 text-sm">{feature}</span>
                        <Button
                          type="button"
                          onClick={() => removeFeature(index)}
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Bugs */}
            <div className="space-y-4">
              <Label>Bug Fixes</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={bugInput}
                  onChange={(e) => setBugInput(e.target.value)}
                  onKeyDown={handleBugKeyPress}
                  placeholder="Add a bug fix"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={addBug} 
                  size="icon" 
                  variant="outline"
                  className="text-green-500 hover:text-green-700 hover:bg-green-50"
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
              
              {bugs.length > 0 && (
                <ScrollArea className="h-40 rounded-md border">
                  <div className="p-2 space-y-2">
                    {bugs.map((bug, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-card rounded-lg border shadow-sm"
                      >
                        <span className="flex-1 text-sm">{bug}</span>
                        <Button
                          type="button"
                          onClick={() => removeBug(index)}
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Suggestions */}
            <div className="space-y-4">
              <Label>Implemented Suggestions</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={suggestionInput}
                  onChange={(e) => setSuggestionInput(e.target.value)}
                  onKeyDown={handleSuggestionKeyPress}
                  placeholder="Add an implemented suggestion"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={addSuggestion} 
                  size="icon" 
                  variant="outline"
                  className="text-green-500 hover:text-green-700 hover:bg-green-50"
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
              
              {suggestions.length > 0 && (
                <ScrollArea className="h-40 rounded-md border">
                  <div className="p-2 space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-card rounded-lg border shadow-sm"
                      >
                        <span className="flex-1 text-sm">{suggestion}</span>
                        <Button
                          type="button"
                          onClick={() => removeSuggestion(index)}
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Error and Success Messages */}
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {formSuccess && (
              <Alert variant="success" className="bg-green-50 text-green-600 border-green-200">
                <AlertDescription>{formSuccess}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={formLoading} 
            className="w-full"
          >
            {formLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                Publishing...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Publish Update
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Updates List */}
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            Previous releases and their details
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading.updates ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error.updates ? (
            <Alert variant="destructive">
              <AlertDescription>{error.updates}</AlertDescription>
            </Alert>
          ) : updates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No updates found
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-6 p-1">
                {updates.map((update) => (
                  <Card key={update.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50 py-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">v{update.version}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Released: {formatDate(update.releaseDate)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 space-y-4">
                      {update.features && update.features.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-blue-500" />
                            <h4 className="font-medium">New Features</h4>
                          </div>
                          <ul className="list-disc pl-6 space-y-1">
                            {update.features.map((feature, idx) => (
                              <li key={idx} className="text-sm">{feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {update.bugs && update.bugs.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <h4 className="font-medium">Bug Fixes</h4>
                          </div>
                          <ul className="list-disc pl-6 space-y-1">
                            {update.bugs.map((bug, idx) => (
                              <li key={idx} className="text-sm">{bug}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {update.suggestions && update.suggestions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Heart className="h-4 w-4 text-green-500" />
                            <h4 className="font-medium">Implemented Suggestions</h4>
                          </div>
                          <ul className="list-disc pl-6 space-y-1">
                            {update.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="text-sm">{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatesTab;