import { formatDistanceToNow } from 'date-fns';

const MessageCard = ({ message, onClick }) => (
  <div
    className="group rounded-lg border p-2.5 text-left text-sm transition-all hover:bg-accent cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="font-semibold">{message.title}</div>
      <div className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(message.lastUpdated), { addSuffix: true })}
      </div>
    </div>
    <div className="mt-1 line-clamp-3 text-xs text-muted-foreground">
      {message.content}
    </div>
  </div>
);

export default MessageCard;