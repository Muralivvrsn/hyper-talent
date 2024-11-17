import BackButton from '../components/BackButton';

const SettingsPage = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 pt-20">
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BackButton onNavigateHome={onNavigate} />
      <h1 className="text-3xl font-bold text-[#1a2e4a] mb-4">Settings Page</h1>
      <p className="text-gray-600">This page is under construction.</p>
    </div>
  </div>
);

export default SettingsPage;
