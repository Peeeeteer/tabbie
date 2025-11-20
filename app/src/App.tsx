import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
} from "@/components/ui/sidebar"
import React from "react"
import { TodoProvider, useTodo } from "@/contexts/TodoContext"
import { DarkModeProvider, useDarkMode } from "@/contexts/DarkModeContext"
import { TabbieProvider } from "@/contexts/TabbieContext"
import CategorySidebar from "@/components/CategorySidebar"
import TasksPage from "@/components/TasksPage"
import SettingsPage from "@/components/SettingsPage"
import EventsPage from "@/components/EventsPage"
import NotificationsPage from "@/components/NotificationsPage"
import DashboardPage from "@/components/DashboardPage"
import PomodoroPage from "@/components/PomodoroPage"
import NotesPage from "@/components/NotesPage"
import TabbiePage from "@/components/TabbiePage"
import SchedulePage from "@/components/SchedulePage"
import { ActivityStatsProvider } from "@/components/ActivityStatsProvider"
import OnboardingModal from "@/components/OnboardingModal"
import { updateSettings } from "@/utils/storage"

const ONBOARDING_STORAGE_KEY = 'tabbie_onboarding_completed';
const ONBOARDING_FORCE_SHOW_KEY = 'tabbie_onboarding_force_show';

function AppContent() {
  const { userData } = useTodo();
  const { setThemeMode } = useDarkMode();
  const [currentPage, setCurrentPage] = React.useState<'dashboard' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'notes' | 'activity' | 'timetracking' | 'settings' | 'tabbie' | 'schedule'>('dashboard');
  const [currentView, setCurrentView] = React.useState<'today' | 'tomorrow' | 'next7days' | 'completed' | string>('next7days');
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  
  // Get theme from settings (default to 'clean')
  const theme = (userData.settings?.theme as 'clean' | 'retro') || 'clean';
  
  // Debug: Log current theme
  React.useEffect(() => {
    console.log('🎨 Current theme:', theme);
    console.log('📦 Settings:', userData.settings);
  }, [theme, userData.settings]);

  // Check if onboarding should be shown
  React.useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    const forceShow = localStorage.getItem(ONBOARDING_FORCE_SHOW_KEY);
    
    // First time user: no flag AND no data
    const isFirstTimeUser = 
      !hasCompletedOnboarding && 
      userData.tasks.length === 0 && 
      userData.completedTasks.length === 0;
    
    // Force show: user clicked "View Again" in settings
    const shouldForceShow = forceShow === 'true';
    
    if (isFirstTimeUser || shouldForceShow) {
      setShowOnboarding(true);
      // Clear force show flag immediately
      if (shouldForceShow) {
        localStorage.removeItem(ONBOARDING_FORCE_SHOW_KEY);
      }
    }
  }, [userData.tasks.length, userData.completedTasks.length]);

  const handleOnboardingComplete = (selectedDesign: 'clean' | 'retro', themeMode: 'light' | 'dark' | 'auto') => {
    // Save onboarding completion flag
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    
    // Save selected theme and theme mode to settings using the updateSettings utility
    updateSettings({ 
      theme: selectedDesign,
      themeMode: themeMode
    });
    
    // Apply theme mode immediately
    setThemeMode(themeMode);
    
    // Reload the page to apply the design theme (this ensures TodoContext reloads with the new settings)
    window.location.reload();
  };










  return (
    <>
      <OnboardingModal 
        isOpen={showOnboarding} 
        onComplete={handleOnboardingComplete}
      />
      
      <SidebarProvider>
        <Sidebar>
          <ActivityStatsProvider>
            {(activityStats) => (
              <CategorySidebar 
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                currentView={currentView}
                onViewChange={setCurrentView}
                activityStats={activityStats}
                theme={theme}
              />
            )}
          </ActivityStatsProvider>
        </Sidebar>
        <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Tabbie Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {currentPage === 'dashboard' ? 'Dashboard' :
                     currentPage === 'tasks' ? 'Tasks' :
                     currentPage === 'schedule' ? 'Schedule' :
                     currentPage === 'reminders' ? 'Reminders' :
                     currentPage === 'events' ? 'Events' :
                     currentPage === 'notifications' ? 'Notifications' :
                     currentPage === 'pomodoro' ? 'Pomodoro Timer' :
                     currentPage === 'activity' ? 'Insight' :
                     currentPage === 'settings' ? 'Settings' : 
                     currentPage === 'tabbie' ? 'Tabbie' : 'Dashboard'}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {currentPage === 'dashboard' ? (
            <DashboardPage 
              onNavigateToActivity={() => setCurrentPage('activity')}
              onPageChange={setCurrentPage}
              theme={theme}
            />
          ) : currentPage === 'tasks' ? (
            <TasksPage 
              currentView={currentView} 
              onViewChange={setCurrentView} 
              onPageChange={setCurrentPage}
              theme={theme}
            />
          ) : currentPage === 'schedule' ? (
            <SchedulePage theme={theme} />
          ) : currentPage === 'reminders' ? (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">🔔 Reminders</h2>
              <p className="text-muted-foreground">Coming soon</p>
            </div>
          ) : currentPage === 'events' ? (
            <EventsPage theme={theme} />
          ) : currentPage === 'notifications' ? (
            <NotificationsPage theme={theme} />
          ) : currentPage === 'pomodoro' ? (
            <PomodoroPage onPageChange={setCurrentPage} theme={theme} />
          ) : currentPage === 'notes' ? (
            <NotesPage onPageChange={setCurrentPage} theme={theme} />
          ) : currentPage === 'activity' ? (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">📊 Insight</h2>
              <p className="text-muted-foreground mb-4">Coming soon - Local AI</p>
            </div>
          ) : currentPage === 'settings' ? (
            <SettingsPage onPageChange={setCurrentPage} theme={theme} />
          ) : currentPage === 'tabbie' ? (
            <TabbiePage onPageChange={setCurrentPage} theme={theme} />
          ) : (
            <>
          
          {/* Main Content Area */}
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">🛠️ Welcome to Tabbie Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Your little local desk assistant — a cute robot that watches, listens, speaks, and helps.
                </p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-card rounded-lg border">
                  <h3 className="font-semibold mb-2">🗣️ Voice & Expressions</h3>
                  <p className="text-sm text-muted-foreground">
                    Talk to Tabbie with voice commands and watch facial expressions
                  </p>
                </div>
                
                <div className="p-4 bg-card rounded-lg border">
                  <h3 className="font-semibold mb-2">✅ Task Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your to-do list, add tasks, and check them off
                  </p>
                </div>
                
                <div className="p-4 bg-card rounded-lg border">
                  <h3 className="font-semibold mb-2">⏲️ Pomodoro Timer</h3>
                  <p className="text-sm text-muted-foreground">
                    Start focused work sessions: "Start pomodoro for [Task]"
                  </p>
                </div>
                
                <div className="p-4 bg-card rounded-lg border">
                  <h3 className="font-semibold mb-2">🔔 Smart Reminders</h3>
                  <p className="text-sm text-muted-foreground">
                    Set custom reminders: "Drink water every 30 mins"
                  </p>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </SidebarInset>

      </SidebarProvider>
    </>
  )
}

export default function Page() {
  return (
    <DarkModeProvider>
      <TodoProvider>
        <TabbieProvider>
          <AppContent />
        </TabbieProvider>
      </TodoProvider>
    </DarkModeProvider>
  )
}
