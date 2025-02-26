import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Link2, ExternalLink, User, Mail } from 'lucide-react';
import { Avatar, AvatarFallback } from "./ui/avatar";

const statusConfig = {
  'ns': {
    label: 'New',
    style: 'bg-secondary',
    description: "🌱 Fresh as a daisy - waiting to bloom!"
  },
  'ip': {
    label: 'In Progress',
    style: 'bg-blue-500',
    description: "🏃 We're on it like a superhero on a mission!"
  },
  'ur': {
    label: 'Under Review',
    style: 'bg-purple-500',
    description: "🔍 Our experts are examining it with their finest monocles"
  },
  'it': {
    label: 'In Testing',
    style: 'bg-yellow-500',
    description: "🧪 Being poked and prodded (gently, we promise)"
  },
  'rs': {
    label: 'Resolved',
    style: 'bg-green-500',
    description: "✨ Fixed and polished until it sparkles!"
  },
  'dc': {
    label: 'Declined',
    style: 'bg-red-500',
    description: "🤔 Not this time - but we appreciate the thought!"
  },
  'df': {
    label: 'Deferred',
    style: 'bg-orange-500',
    description: "⏳ On the back burner, but not forgotten"
  },
  'cp': {
    label: 'Completed',
    style: 'bg-emerald-500',
    description: "🎉 Done and dusted - high fives all around!"
  }
};

const typeConfig = {
  'b': {
    label: 'Bug',
    style: 'bg-destructive text-destructive-foreground'
  },
  'f': {
    label: 'Feature',
    style: 'bg-blue-500 text-primary-foreground'
  },
  's': {
    label: 'Suggestion',
    style: 'bg-green-500 text-primary-foreground'
  }
};

const FeedbackDashboard = () => {
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchFeedback();
  }, []);

  const getUserData = async (userId) => {
    try {
      const userDocRef = doc(db, 'users_v2', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          name: userData.n || 'Anonymous User',
          email: userData.e || 'No email provided'
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching user data:', err);
      return null;
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const feedbackRef = collection(db, 'feedback');
      const feedbackSnapshot = await getDocs(feedbackRef);
      
      let allFeedback = [];
      
      for (const userDoc of feedbackSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const userInfo = await getUserData(userId);
        
        Object.entries(userData).forEach(([feedbackId, feedbackData]) => {
          if (feedbackId.startsWith('bug_') || 
              feedbackId.startsWith('feature_') || 
              feedbackId.startsWith('suggestion_')) {
            allFeedback.push({
              id: feedbackId,
              userId: userId,
              userInfo,
              ...feedbackData,
              t: feedbackId.startsWith('bug_') ? 'b' : 
                 feedbackId.startsWith('feature_') ? 'f' : 's'
            });
          }
        });
      }
      
      allFeedback.sort((a, b) => {
        const dateA = a.ca?.toDate?.() || new Date(a.ca);
        const dateB = b.ca?.toDate?.() || new Date(b.ca);
        return dateB - dateA;
      });
      
      setFeedbackItems(allFeedback);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Failed to load feedback items');
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (userId, feedbackId, newStatus) => {
    try {
      const userDocRef = doc(db, 'feedback', userId);
      const now = new Date();
      await updateDoc(userDocRef, {
        [`${feedbackId}.s`]: newStatus,
        [`${feedbackId}.ls`]: now
      });
      
      setFeedbackItems(prev => 
        prev.map(item => 
          item.id === feedbackId ? { ...item, s: newStatus, ls: now } : item
        )
      );
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  const getFilteredFeedback = () => {
    if (statusFilter === 'all') return feedbackItems;
    return feedbackItems.filter(item => item.s === statusFilter);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date?.toDate?.() || new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Feedback Dashboard</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Status</SelectLabel>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {getFilteredFeedback().map((item) => (
          <Card key={item.id} className="overflow-hidden transition-colors">
            <CardHeader className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${typeConfig[item.t]?.style}`}>
                      {typeConfig[item.t]?.label}
                    </Badge>
                    <Select 
                      value={item.s || 'ns'} 
                      onValueChange={(value) => updateFeedbackStatus(item.userId, item.id, value)}
                    >
                      <SelectTrigger className={`w-[140px] ${statusConfig[item.s || 'ns']?.style} text-primary-foreground`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Object.entries(statusConfig).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <CardDescription>
                    Created: {formatDate(item.ca)}
                    {item.ls && (
                      <>
                        <br />
                        Last status update: {formatDate(item.ls)}
                      </>
                    )}
                  </CardDescription>
                </div>
              </div>
              <Separator />
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10">
                    {item.userInfo ? getInitials(item.userInfo.name) : 'AN'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{item.userInfo?.name || 'Anonymous User'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{item.userInfo?.email || 'No email provided'}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-base">{item.d}</p>
              </div>

              {item.u && item.u.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Attachments
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {item.u.map((url, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        asChild
                      >
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center"
                        >
                          <span>Attachment {index + 1}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                {statusConfig[item.s || 'ns'].description}
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeedbackDashboard;