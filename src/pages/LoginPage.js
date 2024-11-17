import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "../components/ui/card";

const LoginPage = ({ onLogin }) => {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-[400px] border-navy-600">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <svg
                className="w-16 h-16 text-[#1a2e4a]"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5Z" />
                <path d="m2 17 10 5 10-5" />
                <path d="m2 12 10 5 10-5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#1a2e4a]">Welcome Back</h2>
            <p className="text-gray-600 mt-2">
              "Innovation is the outcome of a habit, not a random act."
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Sign in to access your dashboard and continue your journey.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={onLogin}
              className="w-full bg-[#556b2f] hover:bg-[#4a5c28] text-white"
            >
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
};
  
export default LoginPage;