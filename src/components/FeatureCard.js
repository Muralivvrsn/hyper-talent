import { Card, CardHeader, CardContent } from "./ui/card";
import { ChevronRight } from "lucide-react";

const FeatureCard = ({ icon, title, description, status, onClick }) => (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-[#1a2e4a]"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <div className="p-2 bg-[#1a2e4a]/10 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#1a2e4a]">{title}</h3>
            {status && (
              <span className={`px-3 py-1 rounded-full text-sm ${
                status === 'Connected' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {status}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{description}</p>
        <div className="mt-4 flex items-center text-[#556b2f] font-medium">
          <span>Learn More</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </CardContent>
    </Card>
);
  
export default FeatureCard;