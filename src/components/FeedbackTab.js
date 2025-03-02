import React, { useState } from 'react';
import { Edit, Search, Loader2 } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

// Import Shadcn UI components
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const FeedbackTab = () => {
  const { feedback, loading, error, statusConfig, typeConfig } = useAdmin();
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  // Filter feedback
  const filteredFeedback = feedback.filter(item => {
    // Filter by status
    if (statusFilter !== 'all' && item.s !== statusFilter) return false;
    
    // Filter by type
    if (typeFilter !== 'all' && item.t !== typeFilter) return false;
    
    // Search by user name or feedback content
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = item.userName?.toLowerCase().includes(query);
      const emailMatch = item.userEmail?.toLowerCase().includes(query);
      const contentMatch = item.d?.toLowerCase().includes(query);
      
      if (!nameMatch && !emailMatch && !contentMatch) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <Card className="border-zinc-200">
        <CardHeader className="pb-3">
          <CardTitle>User Feedback</CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="status-filter" className="mb-2 block">Status</Label>
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="type-filter" className="mb-2 block">Type</Label>
              <Select 
                value={typeFilter} 
                onValueChange={setTypeFilter}
              >
                <SelectTrigger id="type-filter">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(typeConfig).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="search-query" className="mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  id="search-query"
                  placeholder="Search by name, email or content"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          
          {/* Feedback List */}
          {loading.feedback ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          ) : error.feedback ? (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error.feedback}
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No feedback matching your filters
            </div>
          ) : (
            <ScrollArea className="h-[480px]">
              <div className="space-y-4 pr-4">
                {filteredFeedback.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="bg-zinc-50 p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-normal border-zinc-200 text-zinc-700">
                            {typeConfig[item.t]?.label || 'Unknown'}
                          </Badge>
                          <Badge variant="outline" className="font-normal border-zinc-200 text-zinc-700">
                            {statusConfig[item.s]?.label || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="text-sm text-zinc-500">
                          Submitted: {formatDate(item.ca)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.userName}</div>
                        <div className="text-sm text-zinc-500">{item.userEmail}</div>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <p className="text-sm whitespace-pre-wrap text-zinc-800">{item.d}</p>
                    </CardContent>
                    
                    <div className="p-4 bg-zinc-50 border-t flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Status Reference */}
      <Card className="border-zinc-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Status Reference</CardTitle>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
              {Object.entries(statusConfig).map(([key, value]) => (
                <div key={key} className="flex items-start space-x-3 border-b border-zinc-100 pb-2">
                  <Badge variant="outline" className="mt-1 whitespace-nowrap">
                    {value.label}
                  </Badge>
                  <span className="text-sm text-zinc-600">{value.description}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackTab;