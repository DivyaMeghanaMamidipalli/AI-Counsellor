import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { ChatWindow } from '../components/ai/ChatWindow';

export const Counsellor: React.FC = () => {
  const handleActionExecute = (action: any) => {
    console.log('Executing action:', action);
    // Handle different action types
    switch (action.type) {
      case 'shortlist':
        // Navigate to universities or trigger shortlist
        break;
      case 'lock':
        // Handle university locking
        break;
      case 'create_task':
        // Create a new task
        break;
    }
  };

  return (
    <MainLayout title="AI Counsellor">
      <div className="h-[calc(100vh-200px)]">
        <ChatWindow onActionExecute={handleActionExecute} />
      </div>
    </MainLayout>
  );
};
