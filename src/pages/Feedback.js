import React from 'react';

const Feedback = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Feedback</h1>
      <div className="space-y-4">
        <textarea 
          className="w-full h-32 p-2 border rounded-md" 
          placeholder="Enter your feedback here..."
        />
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md">
          Submit Feedback
        </button>
      </div>
    </div>
  );
};

export default Feedback;