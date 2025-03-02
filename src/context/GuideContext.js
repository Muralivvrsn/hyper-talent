import React, { createContext, useContext, useState, useEffect } from 'react';
import { HelpCircle, X, Search } from 'lucide-react';
import welcomeDarkGif from '../asessts/welcome-dark.gif'
import message_template_add from '../asessts/message_template_add.gif'
import message_template_usecase from '../asessts/message_template_usecase.gif'
import label_creation_deletion from '../asessts/label_creation_deletion.gif'
import feedback from '../asessts/feedback.gif'
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
import { useData } from './DataContext';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

const GuideContext = createContext();

const GuideContent = [
    {
        id: 1,
        title: "Tag & Track Your LinkedIn Network",
        description: "Smart profile tagging across LinkedIn",
        topContent: "Tag profiles, add notes, and filter your network directly on LinkedIn. Works seamlessly in profile views, messages, and search results.",
        footerContent: "Ready to organize your network? Let's get started!",
        gifUrl: welcomeDarkGif,
        keywords: ["tag", "organize", "filter", "notes", "share", "search", "sync"]
    },
    {
        id: 2,
        title: "Save Your Favorite Messages",
        description: "Create quick message templates with magic name tags",
        topContent: "Let's create a message that automatically fills in people's names! It's like having a magic letter that knows who you're writing to.",
        steps: [
            "Find and click on the 'Messages' tab at the top",
            "Look for the bright 'Add Message' button and click it",
            "Give your message a simple name (like 'Hello Message' or 'Thank You Note')",
            "Write your message and use these special tags to add names automatically:",
            "<<first_name>> - adds just their first name , <<last_name>> - adds just their last name, <<name>> - adds their full name",
            "Click the 'Save' button to keep your message"
        ],
        footerContent: "Try using <<first_name>> to make your message friendly - like writing 'Hi <<first_name>>!' at the start!",
        gifUrl: message_template_add,
        keywords: ["message", "template", "name", "save", "quick", "easy", "write", "magic", "personal"]
    },
    {
        id: 3,
        title: "Quick Message Magic!",
        description: "Two super-fast ways to use your saved messages",
        topContent: "We've added two easy shortcuts to access your messages anywhere on LinkedIn! Use either / (slash) or just press Enter to open them instantly.",
        steps: [
            "Go to any message box on LinkedIn",
            "Either press / (slash key - next to right Shift)",
            "OR simply press Enter in an empty message box",
            "Your saved messages will pop up instantly",
            "Type to search through your messages",
            "Click the one you want to use",
            "Press Esc to close if you change your mind"
        ],
        footerContent: "Remember: Either / or Enter opens your messages, Esc closes them. Simple!",
        gifUrl: message_template_usecase,
        keywords: ["slash", "enter", "shortcut", "quick", "popup", "search", "easy", "anywhere", "instant"]
    },
    {
        id: 4,
        title: "Quick Profile Tagging!",
        description: "Press 'l' to tag any profile instantly",
        topContent: "Tag profiles with just one key! Whether you're viewing someone's profile or in a message chat, just press 'l' (lowercase L) to add tags super fast.",
        steps: [
            "Visit any profile or message chat on LinkedIn",
            "Press 'l' (lowercase L) on your keyboard",
            "A quick menu will pop up with your tags",
            "Type a new tag name and press Enter to create it",
            "Or click existing tags to add them",
            "That's it - profile tagged!"
        ],
        footerContent: "Remember: Just press 'l' anywhere (except text boxes) to start tagging. It's that simple!",
        gifUrl: label_creation_deletion,
        keywords: ["label", "tag", "quick", "shortcut", "organize", "profile", "instant", "keyboard", "easy"]
    },
    {
        id: 5,
        title: "Find Tagged Profiles Easily",
        description: "Filter and sort your tagged connections",
        topContent: "Want to find all profiles with specific tags? Head over to the extension - it's much better than using LinkedIn's filters!",
        steps: [
            "Click the extension icon to open it",
            "Go to the 'Profiles' tab",
            "Use the search bar to find specific people",
            "Click on 'Filter' to see all your tags",
            "Select tags to filter profiles",
            "Sort profiles by clicking on tag names",
            "Click on any profile to jump to LinkedIn"
        ],
        footerContent: "The extension is your command center - much easier than searching through LinkedIn messages!",
        gifUrl: false,
        keywords: ["filter", "sort", "find", "search", "organize", "extension", "profiles", "tags", "quick"]
    },
    {
        id: 6,
        title: "Quick Tips & Look",
        description: "Keyboard magic and your perfect theme",
        topContent: "Make the extension work your way! We've added handy keyboard shortcuts and let you pick your favorite look.",
        steps: [
            "Go to extension 'Shortcuts' page",
            "Discover all quick commands there!",
        ],
        footerContent: "Check the Shortcuts page anytime to discover more time-savers!",
        gifUrl: false,
        keywords: ["shortcuts", "customize", "theme", "quick", "easy", "settings", "look", "dark", "light"]
    },
    {
        id: 7,
        title: "Power Up with Sheets & Slack",
        description: "Save profiles to Sheets, share updates on Slack",
        topContent: "Keep your tagged profiles in a spreadsheet and share interesting profiles with your team - all automatically!",
        steps: [
            "Open the 'Integrations' tab",
            "Pick where to save your data",
            "Stay in 'Integrations' tab",
            "Look for Slack and hit 'Connect'",
            "Choose where to send updates",
            "Pick what you want to share"
        ],
        footerContent: "Your data, your way! Change these settings anytime in the Integrations tab.",
        gifUrl: false,
        keywords: ["sheets", "slack", "save", "share", "team", "connect", "export", "sync", "automatic"]
    },
    {
        id: 8,
        title: "Share Tags with Your Team",
        description: "Let others see your tagged profiles",
        topContent: "Want to share some tagged profiles with your team? It's easy to do right from the Profiles page!",
        steps: [
            "Open the extension",
            "Go to the 'Profiles' tab",
            "Click 'Share Labels' button",
            "Pick the tags you want to share",
            "Choose team members to share with",
            "Click Share and you're done!",
            "Look for shared tags in your Profiles tab"
        ],
        footerContent: "Keep your team in sync - share important contacts with just a few clicks!",
        gifUrl: false,
        keywords: ["share", "team", "tags", "profiles", "collaborate", "quick", "easy", "send", "group"]
    },
    {
        id: 9,
        title: "Help Make It Better!",
        description: "Share your ideas and reports",
        topContent: "Found a bug? Have a cool idea? Want something new? We're all ears! Your feedback helps us make the extension perfect for you.",
        steps: [
            "Open 'Feedback' in the extension",
            "Pick what you're sharing:",
            "Found a bug? Tell us what happened",
            "Got an idea? Share your feature wish",
            "General thoughts? We want to hear them",
            "Add a screenshot if it helps",
            "Hit Submit - we'll check it out!"
        ],
        footerContent: "Your feedback shapes what we build next - don't be shy, share your thoughts!",
        gifUrl: feedback,
        keywords: ["feedback", "idea", "bug", "suggest", "help", "improve", "share", "report", "feature"]
    }
];

const FAQContent = [
    // Quick Shortcuts
    {
        question: "What are the essential keyboard shortcuts?",
        answer: "Press 'l' (lowercase L) on any profile to add tags, press '/' or Enter in message box to use templates, check Shortcuts page in extension for more.",
        keywords: ["shortcuts", "keyboard", "quick", "hotkey", "fast"]
    },
    {
        question: "How do I quickly access my saved messages?",
        answer: "In any LinkedIn message box: 1) Press '/' (slash) OR 2) Press Enter in empty message box. Type to search messages, press Esc to close.",
        keywords: ["messages", "quick", "access", "shortcut", "templates"]
    },

    // Tagging & Labels
    {
        question: "How do I add tags to a profile?",
        answer: "Press 'l' on any profile or message page (when not typing). Type new tag name and press Enter to create, or click existing tags to add them.",
        keywords: ["tag", "label", "add", "profile", "create"]
    },
    {
        question: "How do I find tagged profiles?",
        answer: "Open extension → Profiles tab. Use search bar for names, filter button for tags, and click tag names to sort. Much easier than LinkedIn's filters!",
        keywords: ["find", "search", "filter", "tagged", "profiles"]
    },

    // Message Templates
    {
        question: "How do I create message templates?",
        answer: "Go to Messages tab → Add Message → Enter title and message. Use <<first_name>>, <<last_name>>, or <<name>> for automatic personalization.",
        keywords: ["template", "message", "create", "personalize", "variables"]
    },

    // Integrations
    {
        question: "How do I connect with Google Sheets or Slack?",
        answer: "Go to Integrations tab → Click Connect under Sheets or Slack → Follow simple setup steps to link your accounts.",
        keywords: ["sheets", "slack", "connect", "integrate", "sync"]
    },

    // Sharing & Team Features
    {
        question: "How do I share tags with my team?",
        answer: "In extension → Profiles tab → Click Share Labels → Select tags and team members to share with. Simple as that!",
        keywords: ["share", "team", "collaborate", "tags", "labels"]
    },

    // Customization
    {
        question: "Can I change the extension's appearance?",
        answer: "Yes! Open extension settings to switch between Light, Dark, or System theme. Changes save automatically.",
        keywords: ["theme", "dark", "light", "appearance", "customize"]
    },

    // Privacy & Security
    {
        question: "Who can see my tags and notes?",
        answer: "Only you! Tags and notes are private unless you explicitly share them using the Share Labels feature in the Profiles tab.",
        keywords: ["privacy", "visible", "security", "private", "visibility"]
    },

    // Feedback & Support
    {
        question: "How do I submit feedback or report issues?",
        answer: "Use the Submit tab in the extension to share bugs, feature ideas, or general feedback. Add screenshots if helpful!",
        keywords: ["feedback", "bugs", "features", "report", "submit"]
    },

    // Compatibility
    {
        question: "Where does the extension work?",
        answer: "Works on all LinkedIn pages including regular LinkedIn and Sales Navigator. Currently available for desktop Chrome browser only.",
        keywords: ["compatibility", "platform", "browser", "support", "work"]
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
                    onClick={() => {
                        setIsGuideOpen(false);
                        handleGuideComplete();

                    }}
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
                        {
                            currentContent.gifUrl && <div className="relative w-full bg-gray-100 dark:bg-gray-700 m-auto rounded-lg overflow-hidden">
                                <div className="relative w-full bg-gray-100 dark:bg-gray-700 m-auto rounded-lg overflow-hidden">
                                    <img
                                        src={currentContent.gifUrl}
                                        alt="Feature demonstration"
                                        className="w-full h-full"
                                    />
                                </div>
                            </div>
                        }

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
                                        className={`flex gap-3 ${step.startsWith('•') ? 'pl-4' : ''
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
                                    className={`h-2 w-2 rounded-full transition-colors duration-200 ${index === currentStep
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
    const { user } = useAuth();
    const { loading: themeLoading } = useTheme();

    useEffect(() => {
        const hasSeenGuideStorage = localStorage.getItem('hasSeenGuide');
        setHasSeenGuide(!!hasSeenGuideStorage);

        if (!hasSeenGuideStorage) {
            setIsGuideOpen(true);
        }
    }, [themeLoading]);

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
            {
                !themeLoading && user && <>
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
                </>
            }
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
