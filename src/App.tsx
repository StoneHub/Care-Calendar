import React from 'react';
import { ScheduleProvider } from './context/ScheduleContext';
import EnhancedCareSchedulerPage from './pages/EnhancedCareSchedulerPage';

const App: React.FC = () => {
  return (
    <ScheduleProvider>
      <EnhancedCareSchedulerPage />
    </ScheduleProvider>
  );
};

export default App;
