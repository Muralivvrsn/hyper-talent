import { MessageSquarePlus } from 'lucide-react';

const EmptyState = () => (
  <div className="text-center p-8">
    <MessageSquarePlus className="mx-auto h-12 w-12 text-muted-foreground" />
    <h3 className="mt-2 text-sm font-semibold">No messages yet</h3>
    <p className="text-xs text-muted-foreground">Start creating messages</p>
  </div>
);

export default EmptyState;