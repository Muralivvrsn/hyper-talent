import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const ProfileCard = ({ profile, labels, note }) => {
  const initials = profile.name
    ? profile.name.slice(0, 2).toUpperCase()
    : '??';

  return (
    <Card className="w-full max-w-md hover:shadow-lg transition-all duration-300 ease-in-out bg-white">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-offset-white ring-primary/10">
          <AvatarImage 
            src={profile.image} 
            alt={profile.name} 
            className="object-cover"
          />
          <AvatarFallback className="text-lg font-medium bg-primary/5">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <h3 className="text-xl font-semibold leading-none tracking-tight">
            <a 
              href={profile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline inline-block transition-colors duration-200"
            >
              {profile.name || 'Unknown User'}
            </a>
          </h3>
          {labels?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {labels.map((label) => (
                <Badge 
                  key={label.id} 
                  variant="secondary"
                  className="text-xs px-2 py-0.5 font-normal"
                  style={{ 
                    borderColor: label.color,
                    backgroundColor: `${label.color}10`
                  }}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {note ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {note.content}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No additional information available
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCard;