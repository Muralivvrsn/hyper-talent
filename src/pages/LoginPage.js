import React from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../asessts/hypertalent.svg'
const LoginPage = () => {
  const { signIn, status } = useAuth();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/95 p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center space-y-6">
          <div className="rounded-full p-4">
            <img src={logo} width="100px"/>
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