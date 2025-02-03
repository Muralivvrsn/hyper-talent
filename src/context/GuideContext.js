import React, { createContext, useContext, useState, useEffect } from 'react';
import { HelpCircle, X, Search } from 'lucide-react';
import welcomeDarkGif from '../asessts/welcome-dark.gif'
import welcomeLightGif from '../asessts/welcome-light.gif'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const GuideContext = createContext();

const GuideContent = [
    {
      id: 1,
      title: "Welcome to Your LinkedIn Helper",
      description: "Your personal assistant for better LinkedIn networking",
      topContent: "This extension will help you manage your LinkedIn connections more efficiently with powerful features designed to save your time.",
    //   steps: [
    //     "Easy message templates for quick responses",
    //     "Smart profile labeling and organization",
    //     "Powerful keyboard shortcuts",
    //     "Integration with Google Sheets and Slack",
    //     "Collaboration features for team networking"
    //   ],
      footerContent: "Click 'Next' to learn how to use these features and boost your LinkedIn productivity!",
      gifUrl: welcomeDarkGif,
      keywords: ["welcome", "start", "introduction", "begin", "overview", "features", "help"]
    },
    {
      id: 2,
      title: "Create Message Templates",
      description: "Save time with reusable message templates",
      topContent: "Message templates help you maintain consistent communication while saving time. You can use variables to personalize each message automatically.",
      steps: [
        "Click the 'Templates' tab in the extension",
        "Select 'New Template' and give it a name",
        "Write your message using variables like {firstName} for personalization",
        "Test your template using the 'Preview' button",
        "Save your template for future use"
      ],
      footerContent: "Pro tip: Create different templates for different types of connections or outreach purposes!",
      gifUrl: "/api/placeholder/400/250",
      keywords: ["template", "message", "create", "save", "write", "personalize", "variables", "customize", "draft"]
    },
    {
      id: 3,
      title: "Use Templates in Conversations",
      description: "Quickly insert templates while messaging",
      topContent: "Your saved templates are always just one click away when you're in a LinkedIn conversation.",
      steps: [
        "Open any LinkedIn message/conversation",
        "Click the template icon in the message box",
        "Choose your template from the dropdown",
        "The template will auto-fill with the recipient's info",
        "Edit the message if needed before sending"
      ],
      footerContent: "Quick Tip: Use Ctrl/Cmd + Space to quickly open template selector!",
      gifUrl: "/api/placeholder/400/250",
      keywords: ["insert", "use", "template", "message", "conversation", "chat", "shortcut", "quick", "apply"]
    },
    {
      id: 4,
      title: "Label and Tag Profiles",
      description: "Organize your network with custom labels",
      topContent: "Labels help you categorize and remember your connections better. Add notes to provide additional context about each connection.",
      steps: [
        "Visit any LinkedIn profile",
        "Click the 'Add Label' button at the top",
        "Create a new label or select existing ones",
        "Add optional notes for context",
        "Save to apply the labels"
      ],
      footerContent: "Pro tip: Use different colors for different categories of contacts to make visual identification easier!",
      gifUrl: "/api/placeholder/400/250",
      keywords: ["label", "tag", "profile", "organize", "categorize", "notes", "remove", "manage", "network", "color"]
    },
    {
      id: 5,
      title: "Filter Your Network",
      description: "Find profiles using labels and filters",
      topContent: "Quickly find relevant connections using our powerful filtering system, available both in the extension and on LinkedIn pages.",
      steps: [
        "In the Extension:",
        "• Open the 'Labels' tab",
        "• Use the search and filter options",
        "• Sort by label, date, or name",
        "In LinkedIn Browser:",
        "• Use the 'Filter' button on any LinkedIn page",
        "• Select labels to filter your search results",
        "• Combine multiple labels for precise filtering"
      ],
      gifUrl: "/api/placeholder/400/250",
      keywords: ["filter", "search", "find", "sort", "organize", "browse", "labels", "network", "discover"]
    },
    {
      id: 6,
      title: "Shortcuts & Customization",
      description: "Work faster with keyboard shortcuts",
      topContent: "Speed up your workflow with keyboard shortcuts and customize the extension's appearance to match your preferences.",
      steps: [
        "Essential shortcuts:",
        "• Ctrl/Cmd + Space: Open templates",
        "• Ctrl/Cmd + L: Add label to profile",
        "• Ctrl/Cmd + F: Open filters",
        "Theme Customization:",
        "• Click the settings icon",
        "• Choose between Light, Dark, or System theme",
        "• Your preference will be saved automatically"
      ],
      gifUrl: "/api/placeholder/400/250",
      keywords: ["shortcuts", "keyboard", "hotkeys", "theme", "customize", "dark mode", "light mode", "settings", "preference"]
    },
    {
      id: 7,
      title: "Connect with Your Tools",
      description: "Integrate with Sheets and Slack",
      topContent: "Extend the power of your LinkedIn network by connecting with your favorite productivity tools.",
      steps: [
        "Google Sheets Setup:",
        "• Go to 'Integrations' tab",
        "• Click 'Connect' under Google Sheets",
        "• Select your export preferences",
        "• Choose auto-sync or manual export",
        "Slack Setup:",
        "• Click 'Connect' under Slack",
        "• Choose your workspace",
        "• Select channels for notifications",
        "• Set up alert preferences"
      ],
      footerContent: "Note: You can always modify your integration settings later in the Integrations tab.",
      gifUrl: "/api/placeholder/400/250",
      keywords: ["integration", "sheets", "slack", "connect", "export", "sync", "workspace", "automation", "tools"]
    },
    {
      id: 8,
      title: "Share Labels with Team",
      description: "Collaborate on network organization",
      topContent: "Work together with your team by sharing labels and building a collaborative network database.",
      steps: [
        "To Share Labels:",
        "• Go to 'Labels' tab",
        "• Click 'Share' on any label",
        "• Enter team member's email",
        "• Set permission level (view/edit)",
        "To Accept Shared Labels:",
        "• Click the notification bell",
        "• Review shared label details",
        "• Accept or decline the share",
        "• Find shared labels in your 'Shared' section"
      ],
      footerContent: "Remember: You can always manage sharing permissions or revoke access in the Labels tab.",
      gifUrl: "/api/placeholder/400/250",
      keywords: ["share", "team", "collaborate", "permission", "accept", "invite", "network", "group", "access"]
    },
    {
      id: 9,
      title: "Submit Feedback",
      description: "Help us improve your experience",
      topContent: "Your feedback helps us make the extension better for everyone. Share your thoughts, report bugs, or request new features.",
      steps: [
        "Click the 'Feedback' tab",
        "Choose feedback type:",
        "• Bug report",
        "• Feature request",
        "• General feedback",
        "Describe your experience",
        "Add screenshots if needed",
        "Submit and track your feedback"
      ],
      footerContent: "We review all feedback and use it to prioritize new features and improvements!",
      gifUrl: "/api/placeholder/400/250",
      keywords: ["feedback", "suggestion", "bug", "report", "improve", "help", "support", "request", "feature"]
    }
  ];

  const FAQContent = [
    // Template Related
    {
      question: "How do I create a message template?",
      answer: "Go to the Templates tab, click 'New Template', enter your message, give it a name, and click Save. You can use variables like {firstName} for personalization.",
      keywords: ["template", "message", "create", "save", "new", "write"]
    },
    {
      question: "What variables can I use in templates?",
      answer: "You can use variables like {firstName}, {lastName}, {company}, and {position} in your templates. These will automatically fill with the recipient's information.",
      keywords: ["variables", "template", "personalization", "customize", "fields"]
    },
    {
      question: "How do I use a template in a conversation?",
      answer: "When in a LinkedIn message, click the template icon or use Ctrl/Cmd + Space to open the template selector. Choose your template and it will auto-fill with recipient's info.",
      keywords: ["template", "use", "conversation", "message", "insert"]
    },
  
    // Labels and Profile Management
    {
      question: "How do I add labels to a profile?",
      answer: "Visit any LinkedIn profile, click the 'Add Label' button at the top, then either create a new label or select from existing ones. You can also add optional notes.",
      keywords: ["label", "add", "profile", "tag", "create"]
    },
    {
      question: "Can I remove labels from a profile?",
      answer: "Yes, click the label icon on any profile and uncheck the labels you want to remove. Changes are saved automatically.",
      keywords: ["label", "remove", "delete", "profile", "untag"]
    },
    {
      question: "How do I search for profiles with specific labels?",
      answer: "Use the Labels tab in the extension to search and filter profiles by label, or use the Filter button on LinkedIn pages to filter search results by label.",
      keywords: ["search", "filter", "find", "label", "profile"]
    },
  
    // Integration Features
    {
      question: "How do I connect with Google Sheets?",
      answer: "Go to the Integrations tab, click 'Connect' under Google Sheets section, select your export preferences, and choose between auto-sync or manual export.",
      keywords: ["sheets", "google", "connect", "integration", "export"]
    },
    {
      question: "How do I set up Slack notifications?",
      answer: "In the Integrations tab, click 'Connect' under Slack, choose your workspace, select notification channels, and configure your alert preferences.",
      keywords: ["slack", "notifications", "connect", "integration", "alerts"]
    },
    {
      question: "Can I export my labeled profiles to Google Sheets?",
      answer: "Yes, once connected to Google Sheets, you can export your labeled profiles manually or set up automatic syncing in the Integrations tab.",
      keywords: ["export", "sheets", "profiles", "labels", "sync"]
    },
  
    // Collaboration and Sharing
    {
      question: "How do I share labels with my team?",
      answer: "Go to the Labels tab, click 'Share' on any label, enter team member's email, and set their permission level (view/edit).",
      keywords: ["share", "team", "labels", "collaborate", "permission"]
    },
    {
      question: "How do I accept shared labels?",
      answer: "When someone shares labels with you, you'll receive a notification. Click the notification bell, review the shared label details, and click Accept or Decline.",
      keywords: ["accept", "shared", "labels", "notification", "receive"]
    },
    {
      question: "Can I control who sees my shared labels?",
      answer: "Yes, you can manage sharing permissions for each label individually and revoke access at any time from the Labels tab.",
      keywords: ["permissions", "privacy", "share", "control", "access"]
    },
  
    // Shortcuts and Customization
    {
      question: "What keyboard shortcuts are available?",
      answer: "Key shortcuts include: Ctrl/Cmd + Space (open templates), Ctrl/Cmd + L (add label to profile), and Ctrl/Cmd + F (open filters).",
      keywords: ["shortcuts", "keyboard", "hotkeys", "commands"]
    },
    {
      question: "How do I change the theme?",
      answer: "Click the settings icon and choose between Light, Dark, or System theme. Your preference will be saved automatically.",
      keywords: ["theme", "dark mode", "light mode", "customize", "appearance"]
    },
  
    // Feedback and Support
    {
      question: "How do I report a bug?",
      answer: "Go to the Feedback tab, select 'Bug report' as the feedback type, describe the issue, add any relevant screenshots, and submit.",
      keywords: ["bug", "report", "issue", "problem", "feedback"]
    },
    {
      question: "How can I request a new feature?",
      answer: "Visit the Feedback tab, choose 'Feature request' as the feedback type, describe your desired feature, and submit your request.",
      keywords: ["feature", "request", "suggestion", "new", "feedback"]
    },
  
    // General Usage
    {
      question: "Can I use the extension on mobile?",
      answer: "Currently, the extension is only available for desktop Chrome browser. Mobile support may be added in future updates.",
      keywords: ["mobile", "phone", "tablet", "device", "browser"]
    },
    {
      question: "Does the extension work with LinkedIn Sales Navigator?",
      answer: "Yes, the extension works with both regular LinkedIn and Sales Navigator, providing the same labeling and template features.",
      keywords: ["sales navigator", "compatibility", "support", "version"]
    },
    {
      question: "Will others see my labels and notes?",
      answer: "No, your labels and notes are private by default. They're only visible to others if you explicitly share them using the sharing feature.",
      keywords: ["privacy", "visible", "private", "security", "visibility"]
    }
  ];

const MainGuide = ({ 
    currentStep, 
    isGuideOpen, 
    setIsGuideOpen, 
    handleGuideComplete,
    nextStep,
    previousStep 
  }) => {
    if (!isGuideOpen) return null;
  
    const currentContent = GuideContent[currentStep];
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-[90%] max-w-2xl bg-white dark:bg-gray-800 relative max-h-[90vh] flex flex-col">
          <button 
            onClick={() => setIsGuideOpen(false)}
            className="absolute right-4 top-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
          
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 p-4">
            <CardTitle className="text-lg font-semibold pr-4">
              {currentContent.title}
            </CardTitle>
            <CardDescription className="mt-2 text-sm">
              {currentContent.description}
            </CardDescription>
          </CardHeader>
  
          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* GIF Display */}
              <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img 
                  src={currentContent.gifUrl}
                  alt="Feature demonstration"
                  className="w-full h-full object-cover"
                />
              </div>
  
              {/* Top Content */}
              {currentContent.topContent && (
                <div className="px-1 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {currentContent.topContent}
                </div>
              )}
  
              {/* Steps Section */}
              {currentContent.steps && currentContent.steps.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-1 space-y-3">
                  {currentContent.steps.map((step, index) => (
                    <div 
                      key={index} 
                      className={`flex gap-3 ${
                        step.startsWith('•') ? 'pl-4' : ''
                      }`}
                    >
                      {!step.startsWith('•') && !step.startsWith('To') && !step.startsWith('In') && (
                        <span className="text-blue-500 font-medium min-w-[20px]">
                          {index + 1}.
                        </span>
                      )}
                      <span className="text-gray-700 dark:text-gray-300">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              )}
  
              {/* Footer Content */}
              {currentContent.footerContent && (
                <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-blue-800 dark:text-blue-200 text-xm">
                    {currentContent.footerContent}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
  
          <CardFooter className="border-t border-gray-100 dark:border-gray-700 mt-auto p-4">
            <div className="w-full flex justify-between flex-col sm:flex-row space-y-3 items-center">
              {/* Progress Indicators */}
              <div className="flex items-center space-x-2">
                {Array.from({ length: GuideContent.length }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                      index === currentStep
                        ? 'bg-blue-500'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex space-x-4">
                {currentStep > 0 && (
                  <Button
                    onClick={previousStep}
                    className="px-4 bg-background hover:bg-background text-black dark:text-white"
                  >
                    Previous
                  </Button>
                )}
                {currentStep < GuideContent.length - 1 ? (
                  <Button onClick={nextStep} className="px-6">
                    Next
                  </Button>
                ) : (
                  <Button onClick={handleGuideComplete} className="px-6">
                    Finish
                  </Button>
                )}
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  export default MainGuide;

const SearchDialog = ({ 
  isSearchOpen, 
  setIsSearchOpen, 
  searchQuery, 
  searchResults, 
  handleSearch 
}) => {
    useEffect(() => {
        if (isSearchOpen && searchResults.length === 0) {
          // Load initial content when dialog opens
          handleSearch('');
        }
      }, [isSearchOpen]);
    return (
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Search Help</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-[10px] h-4 w-4 text-sm text-gray-400" />
                <Input
                  placeholder="Search for features or help..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-4">
                {searchResults.map((result, index) => (
                  <Card key={index} className="p-4">
                    <h3 className="font-semibold text-sm">
                      {result.title || result.question}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                      {result.content || result.answer}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )
};

export const GuideProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);

  useEffect(() => {
    const hasSeenGuideStorage = localStorage.getItem('hasSeenGuide');
    setHasSeenGuide(!!hasSeenGuideStorage);
    
    if (!hasSeenGuideStorage) {
      setIsGuideOpen(true);
    }
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // Show all content when search is empty
      const results = [
        ...FAQContent.map(item => ({
          question: item.question,
          answer: item.answer
        }))
      ];
      setSearchResults(results);
    } else {
      // Filter content when there's a search query
      const results = [
        ...FAQContent.filter(item =>
          item.question.toLowerCase().includes(query.toLowerCase()) ||
          item.answer.toLowerCase().includes(query.toLowerCase()) ||
          item.keywords.some(keyword =>
            keyword.toLowerCase().includes(query.toLowerCase())
          )
        )
      ];
      setSearchResults(results);
    }
  };

  const handleGuideComplete = () => {
    localStorage.setItem('hasSeenGuide', 'true');
    setHasSeenGuide(true);
    setIsGuideOpen(false);
    setCurrentStep(0);
  };

  const resetGuide = () => {
    setCurrentStep(0);
    setIsGuideOpen(true);
  };

  const nextStep = () => {
    if (currentStep < GuideContent.length - 1) {
      setCurrentStep(curr => curr + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    setSearchQuery("");
    if (!isSearchOpen) {
      // Load all content when opening the dialog
      const allResults = [
        ...FAQContent.map(item => ({
          question: item.question,
          answer: item.answer
        }))
      ];
      setSearchResults(allResults);
    } else {
      setSearchResults([]);
    }
  };

  const value = {
    currentStep,
    isGuideOpen,
    isSearchOpen,
    searchQuery,
    searchResults,
    hasSeenGuide,
    resetGuide,
    toggleSearch
  };

  return (
    <GuideContext.Provider value={value}>
      {children}
      
      <MainGuide 
        currentStep={currentStep}
        isGuideOpen={isGuideOpen}
        setIsGuideOpen={setIsGuideOpen}
        handleGuideComplete={handleGuideComplete}
        nextStep={nextStep}
        previousStep={previousStep}
      />
      
      <SearchDialog 
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        searchQuery={searchQuery}
        searchResults={searchResults}
        handleSearch={handleSearch}
      />
      
      <button
        onClick={toggleSearch}
        className="fixed bottom-5 right-5 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-shadow z-40"
      >
        <HelpCircle className="h-6 w-6" />
      </button>
    </GuideContext.Provider>
  );
};

export const useGuide = () => {
  const context = useContext(GuideContext);
  if (!context) {
    throw new Error('useGuide must be used within a GuideProvider');
  }
  return context;
};
