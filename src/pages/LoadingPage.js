import { Card, CardContent } from "../components/ui/card";
import { Loader2 } from "lucide-react";

const LoadingPage = () => {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Card className="w-[400px]">
          <CardContent className="flex flex-col items-center py-8">
            <Loader2 className="w-12 h-12 text-[#1a2e4a] animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-[#1a2e4a]">Getting Things Ready</h2>
            <p className="text-gray-600">Just a moment while we log you in...</p>
          </CardContent>
        </Card>
      </div>
    );
};
  
export default LoadingPage;