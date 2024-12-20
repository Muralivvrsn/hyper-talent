import React from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, error, authenticating } = useAuth();

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center space-y-8">
          {/* Logo/Icon */}
          <div className="w-32 h-32 rounded-full flex items-center justify-center">
            <svg 
              className="w-16 h-16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>

          {/* Welcome Text */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">Sign in to continue to your account</p>
          </div>

          {/* Error Message */}
          {/* {error && (
            <div className="w-full p-3 rounded-lg border">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )} */}

          {/* Sign In Button */}
          <Button
            onClick={login}
            disabled={authenticating}
            className="w-full"
          >
            {authenticating ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </div>
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