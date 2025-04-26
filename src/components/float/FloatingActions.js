import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { FeedbackPage } from "../../pages/Feedback";
import {
  MessageCircle,
  MessageSquarePlus,
  HelpCircle,
  X,
  SendHorizontal,
  Search,
  CheckCircle2,
  ArrowLeft,
  Send,
} from "lucide-react";

// Chatbot Component
function ChatbotWithGuide() {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([
    {
      id: "1",
      content: "Hello! How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  const faqItems = [
    { id: "faq1", question: "How do I add a new profile?", answer: "...", category: "profiles" },
    { id: "faq2", question: "How do I create a new label?", answer: "...", category: "labels" },
  ];

  const filteredFAQs = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!input.trim()) return;
    const userMessage = { id: `user-${Date.now()}`, content: input, sender: "user", timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTimeout(() => {
      const botMessage = {
        id: `bot-${Date.now()}`,
        content: "Thanks for your message. I'll help you with that right away.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full bg-[#f8f9fa] border-[#e9ecef] rounded-lg shadow-2xl"
    >
      <div className="p-4 border-b border-[#e9ecef]">
        <h3 className="font-semibold text-[#1a5f7a]">Support & Help</h3>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 mx-4 mt-3 bg-[#e9ecef]">
          <TabsTrigger value="chat" className="text-sm text-[#666666]">Chat</TabsTrigger>
          <TabsTrigger value="guide" className="text-sm text-[#666666]">FAQ & Guide</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="flex-1 flex flex-col mt-0 p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-2 max-w-[80%] ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {message.sender === "bot" && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Bot" />
                        <AvatarFallback className="bg-[#e9ecef] text-[#666666]">B</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 text-sm ${
                        message.sender === "user" ? "bg-[#1a5f7a] text-white" : "bg-[#e9ecef] text-[#333333]"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-[#e9ecef] mt-auto">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 border-[#e9ecef] text-[#333333] bg-white"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="bg-[#1a5f7a] hover:bg-[#0c2e3b] text-white"
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="guide" className="flex-1 flex flex-col mt-0 p-0">
          <div className="p-4 border-b border-[#e9ecef]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#888888]" />
              <Input
                type="search"
                placeholder="Search help topics..."
                className="pl-8 border-[#e9ecef] text-[#333333] bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <Accordion type="single" collapsible className="w-full">
              <AnimatePresence>
                {filteredFAQs.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <AccordionItem value={item.id}>
                      <AccordionTrigger className="text-sm py-2 px-2 text-[#333333] hover:text-[#1a5f7a]">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm px-2 text-[#666666]">{item.answer}</AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredFAQs.length === 0 && (
                <p className="text-center py-8 text-[#888888]">No results found. Try a different search term.</p>
              )}
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// Feedback Form Component
function FeedbackForm() {
  const [activeTab, setActiveTab] = useState("new");
  const [feedbackType, setFeedbackType] = useState("");
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [feedbackList, setFeedbackList] = useState([
    {
      id: "f1",
      type: "feature",
      message: "It would be great to have a dark mode option for the extension.",
      email: "user@example.com",
      status: "reviewed",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ]);

  const handleSubmit = () => {
    if (!feedbackType || !feedback.trim()) return;
    const newFeedback = {
      id: `f${Date.now()}`,
      type: feedbackType,
      message: feedback,
      email: email || undefined,
      status: "pending",
      createdAt: new Date(),
    };
    setFeedbackList([newFeedback, ...feedbackList]);
    setIsSubmitted(true);
    setTimeout(() => {
      setFeedbackType("");
      setFeedback("");
      setEmail("");
      setIsSubmitted(false);
      setActiveTab("history");
    }, 2000);
  };

  const formatDate = (date) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);

  const getTypeColor = (type) => {
    switch (type) {
      case "bug": return "bg-[#FF6B6B] text-white";
      case "feature": return "bg-[#1A85FF] text-white";
      case "improvement": return "bg-[#06D6A0] text-white";
      default: return "bg-[#888888] text-white";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full bg-[#f8f9fa] border-[#e9ecef] rounded-lg shadow-2xl"
    >
      <div className="p-4 border-b border-[#e9ecef]">
        <h3 className="font-semibold text-[#FF6B6B]">Feedback</h3>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 mx-4 mt-3 bg-[#e9ecef]">
          <TabsTrigger value="new" className="text-sm text-[#666666]">New Feedback</TabsTrigger>
          <TabsTrigger value="history" className="text-sm text-[#666666]">History</TabsTrigger>
        </TabsList>
        <TabsContent value="new" className="flex-1 flex flex-col mt-0 p-0">
          {isSubmitted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-4 p-4"
            >
              <div className="rounded-full bg-[#06D6A0]/10 p-3">
                <CheckCircle2 className="h-6 w-6 text-[#06D6A0]" />
              </div>
              <h3 className="font-medium text-[#333333]">Thank You!</h3>
              <p className="text-sm text-[#666666]">Your feedback has been submitted successfully.</p>
            </motion.div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="feedback-type" className="text-sm font-medium text-[#333333]">Feedback Type</label>
                <select
                  id="feedback-type"
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full border-[#e9ecef] rounded-md p-2 text-[#333333] bg-white"
                >
                  <option value="" disabled>Select feedback type</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="improvement">Improvement Suggestion</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="feedback-content" className="text-sm font-medium text-[#333333]">Your Feedback</label>
                <Textarea
                  id="feedback-content"
                  placeholder="Please describe your feedback in detail..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={5}
                  className="border-[#e9ecef] text-[#333333] bg-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-[#333333]">Email (Optional)</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#e9ecef] text-[#333333] bg-white"
                />
                <p className="text-xs text-[#888888]">
                  Provide your email if you'd like us to follow up with you.
                </p>
              </div>
            </div>
          )}
          {!isSubmitted && (
            <div className="p-4 border-t border-[#e9ecef] mt-auto">
              <Button
                onClick={handleSubmit}
                disabled={!feedbackType || !feedback.trim()}
                className="w-full bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
              >
                <Send className="mr-2 h-4 w-4" />
                Submit Feedback
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="history" className="flex-1 flex flex-col mt-0 p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {feedbackList.length > 0 ? (
              feedbackList.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#e9ecef] rounded-lg p-3 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={getTypeColor(item.type)}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </Badge>
                      <span className="text-xs text-[#888888]">{formatDate(item.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[#333333]">{item.message}</p>
                    {item.status === "reviewed" && (
                      <Badge className="bg-[#9381FF] text-white">Reviewed</Badge>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <p className="text-[#888888]">No feedback submitted yet.</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-[#e9ecef]">
            <Button
              variant="outline"
              className="w-full border-[#1a5f7a] text-[#1a5f7a] hover:bg-[#f8f9fa]"
              onClick={() => setActiveTab("new")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Submit New Feedback
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// Main Floating Actions Component
export function FloatingActions() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);

  const toggleMenu = () => {
    if (activePanel) {
      setActivePanel(null);
    } else {
      setIsMenuOpen(!isMenuOpen);
    }
  };

  const togglePanel = (panel) => {
    setActivePanel(activePanel === panel ? null : panel);
    setIsMenuOpen(false);
  };

  const buttonVariants = {
    hover: { scale: 1.1, transition: { duration: 0.2 } },
    tap: { scale: 0.9 },
  };

  const panelVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Animated Panel */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-[#f8f9fa] border-2 border-[#e9ecef] rounded-xl shadow-2xl w-[320px] h-[450px] overflow-hidden z-50"
          >
            {activePanel === "chatbot" && <ChatbotWithGuide />}
            {activePanel === "feedback" && <FeedbackForm />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Menu */}
      <div className="flex flex-col items-end gap-2">
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-col gap-2"
            >
              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Button
                  size="icon"
                  onClick={() => togglePanel("feedback")}
                  className="rounded-full shadow-lg bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white border-2 border-[#FF6B6B]"
                >
                  <MessageSquarePlus size={20} />
                </Button>
              </motion.div>
              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Button
                  size="icon"
                  onClick={() => togglePanel("chatbot")}
                  className="rounded-full shadow-lg bg-[#1a5f7a] hover:bg-[#0c2e3b] text-white border-2 border-[#1a5f7a]"
                >
                  <MessageCircle size={20} />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Toggle Button */}
        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity } }}
        >
          <Button
            size="icon"
            onClick={toggleMenu}
            className={`rounded-full shadow-lg h-12 w-12 bg-[#1a5f7a] hover:bg-[#0c2e3b] text-white border-2 border-[#1a5f7a]`}
          >
            {activePanel || isMenuOpen ? <X size={24} /> : <HelpCircle size={24} />}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}