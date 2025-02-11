import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ChevronDown, ChevronUp, Link as LinkIcon, Users } from 'lucide-react';

const ProfileCard = ({ profile, labels, note }) => {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      const lineHeight = parseInt(getComputedStyle(contentRef.current).lineHeight);
      const height = contentRef.current.scrollHeight;
      setIsOverflowing(height > lineHeight * 2);
    }
  }, [note]);

  const initials = profile.name?.slice(0, 2).toUpperCase() || '??';

  return (
    <Card className="w-full hover:shadow-md transition-all duration-200">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-1 ring-border">
            <AvatarImage src={profile.image} alt={profile.name} className="object-cover" />
            <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h3 className="text-base font-medium leading-none truncate mb-1 flex items-center gap-1">
                  {profile.name || 'Unknown User'}
                  {labels?.some(label => label.isShared) && (
                    <Users className="h-4 w-4 text-muted-foreground" />
                  )}
                </h3>
              </div>

              {profile.url && (
                <a
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <LinkIcon className="h-4 w-4" />
                </a>
              )}
            </div>

            {labels?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {labels.map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center text-[10px] px-3 rounded-full transition-colors"
                    style={{
                      backgroundColor: `${label.color}15`,
                      color: label.color
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {note && (
        <CardContent className="px-4 pb-3 -mt-2">
          <div className="relative">
            <p
              ref={contentRef}
              className={`text-sm text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-2'
                }`}
            >
              {note.content}
            </p>

            {isOverflowing && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary hover:underline mt-1 flex items-center gap-0.5"
              >
                {expanded ? (
                  <>Show less <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>Show more <ChevronDown className="h-3.5 w-3.5" /></>
                )}
              </button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ProfileCard;