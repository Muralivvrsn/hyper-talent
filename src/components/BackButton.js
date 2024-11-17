import { useCallback } from 'react';
import { Button } from ".//ui/button";

const BackButton = ({ onNavigateHome }) => {
  const handleBack = useCallback(() => {
    onNavigateHome('home');
  }, [onNavigateHome]);

  return (
    <Button
      variant="outline"
      className="text-black hover:bg-[#1a2e4a] hover:text-[#ffffff] transition-colors p-3 my-4"
      onClick={handleBack}
    >
      Back to Home
    </Button>
  );
};

export default BackButton;