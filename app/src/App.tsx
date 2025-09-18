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
import { TodoProvider } from "@/contexts/TodoContext"
import { DarkModeProvider } from "@/contexts/DarkModeContext"
import CategorySidebar from "@/components/CategorySidebar"
import TasksPage from "@/components/TasksPage"
import SettingsPage from "@/components/SettingsPage"
import EventsPage from "@/components/EventsPage"
import NotificationsPage from "@/components/NotificationsPage"
import DashboardPage from "@/components/DashboardPage"
import PomodoroPage from "@/components/PomodoroPage"
import NotesPage from "@/components/NotesPage"
import TabbiePage from "@/components/TabbiePage"
import { ActivityStatsProvider } from "@/components/ActivityStatsProvider"

export default function Page() {
  const [currentPage, setCurrentPage] = React.useState<'dashboard' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'notes' | 'activity' | 'timetracking' | 'settings' | 'tabbie'>('dashboard');
  const [currentView, setCurrentView] = React.useState<'today' | 'tomorrow' | 'next7days' | 'completed' | string>('next7days');












  return (
    <DarkModeProvider>
      <TodoProvider>
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
            />
          ) : currentPage === 'tasks' ? (
            <TasksPage currentView={currentView} onViewChange={setCurrentView} onPageChange={setCurrentPage} />
          ) : currentPage === 'reminders' ? (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">🔔 Reminders</h2>
              <p className="text-muted-foreground">Coming soon</p>
            </div>
          ) : currentPage === 'events' ? (
            <EventsPage />
          ) : currentPage === 'notifications' ? (
            <NotificationsPage />
          ) : currentPage === 'pomodoro' ? (
                            <PomodoroPage onPageChange={setCurrentPage} />
          ) : currentPage === 'notes' ? (
                            <NotesPage onPageChange={setCurrentPage} />
          ) : currentPage === 'activity' ? (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">📊 Insight</h2>
              <p className="text-muted-foreground mb-4">Coming soon - Local AI</p>
            </div>
          ) : currentPage === 'settings' ? (
            <SettingsPage onPageChange={setCurrentPage} />
          ) : currentPage === 'tabbie' ? (
            <TabbiePage onPageChange={setCurrentPage} />
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
    </TodoProvider>
    </DarkModeProvider>
  )
}
