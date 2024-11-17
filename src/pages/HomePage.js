import { 
  Sheet as Sheet1, 
  Mail, 
  MessageSquare,
} from "lucide-react";
import FeatureCard from "../components/FeatureCard";

const HomePage = ({ onNavigate }) => {
    const features = [
      {
        icon: <Sheet1 className="w-6 h-6 text-[#1a2e4a]" />,
        title: "Sheets Integration Hub",
        description: "Seamlessly connect and manage your spreadsheet data. Monitor real-time connection status and automate data synchronization across your recruitment workflow.",
        status: "",
        page: "sheets"
      },
      {
        icon: <Mail className="w-6 h-6 text-[#1a2e4a]" />,
        title: "Advanced Communication Suite",
        description: "Create and manage professional email campaigns with rich media support. Customize templates and track engagement with comprehensive analytics.",
        page: "email"
      },
      {
        icon: <MessageSquare className="w-6 h-6 text-[#1a2e4a]" />,
        title: "Message Template Studio",
        description: "Design and customize your communication templates. Manage message formats, styling, and create reusable snippets for consistent messaging.",
        page: "messages"
      }
    ];
  
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-bold text-[#1a2e4a] mb-4">
              Welcome to Your Recruitment Command Center
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Access and manage all your recruitment tools in one place. Select a feature below to get started.
            </p>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                {...feature}
                onClick={() => onNavigate(feature.page)}
              />
            ))}
          </div>
  
          <div className="mt-12 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-[#1a2e4a] mb-4">System Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Sheets Connected</p>
                <p className="text-2xl font-semibold text-[#1a2e4a]">3/5</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Email Templates</p>
                <p className="text-2xl font-semibold text-[#1a2e4a]">12</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Active Roles</p>
                <p className="text-2xl font-semibold text-[#1a2e4a]">4</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Message Templates</p>
                <p className="text-2xl font-semibold text-[#1a2e4a]">8</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};
  
export default HomePage;