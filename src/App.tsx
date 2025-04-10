import React from 'react';
import { ScheduleProvider } from './context/ScheduleContext';
import { ThemeProvider } from './context/ThemeContext';
import EnhancedCareSchedulerPage from './pages/EnhancedCareSchedulerPage';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ScheduleProvider>
        <EnhancedCareSchedulerPage />
      </ScheduleProvider>
    </ThemeProvider>
  );
};

export default App;
