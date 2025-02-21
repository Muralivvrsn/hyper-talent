import React from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { signIn, status } = useAuth();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/95 p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center space-y-6">
          <div className="rounded-full bg-primary/10 p-4">
            <svg 
              className="w-12 h-12 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" 
              />
            </svg>
          </div>

          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">Sign in to continue to your account</p>
          </div>

          <Button
            onClick={signIn}
            disabled={status==='in_progress'}
            className="w-full flex items-center justify-center gap-2"
          >
            {status==='in_progress' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in with Google</span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;