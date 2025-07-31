import React from 'react';
import { AppStatusProvider } from './context/AppStatusContext';
import { TeamProvider } from './context/TeamContext';
import { ScheduleDataProvider } from './context/ScheduleContext';
import { ScheduleInteractionProvider } from './context/ScheduleInteractionContext';
import { ThemeProvider } from './context/ThemeContext';
import EnhancedCareSchedulerPage from './pages/EnhancedCareSchedulerPage';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppStatusProvider>
        <TeamProvider>
          <ScheduleDataProvider>
            <ScheduleInteractionProvider>
              <EnhancedCareSchedulerPage />
            </ScheduleInteractionProvider>
          </ScheduleDataProvider>
        </TeamProvider>
      </AppStatusProvider>
    </ThemeProvider>
  );
};

export default App;
