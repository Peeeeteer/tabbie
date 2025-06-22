import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  CheckSquare,
  Clock,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Bell,
  BarChart3,
  Wrench,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Tabbie User",
    email: "user@tabbie.local",
    avatar: "/avatars/tabbie-user.jpg",
  },
  teams: [
    {
      name: "Tabbie Assistant",
      logo: Bot,
      plan: "Personal",
    },
    {
      name: "Tabbie Dev Kit",
      logo: Command,
      plan: "Developer",
    },
    {
      name: "Tabbie Pro",
      logo: GalleryVerticalEnd,
      plan: "Premium",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "#",
        },
        {
          title: "LED Control",
          url: "#",
        },
        {
          title: "Status",
          url: "#",
        },
      ],
    },
    {
      title: "Todo List",
      url: "#",
      icon: CheckSquare,
      items: [
        {
          title: "View Tasks",
          url: "#",
        },
        {
          title: "Add Task",
          url: "#",
        },
        {
          title: "Completed",
          url: "#",
        },
      ],
    },
    {
      title: "Pomodoro Timer",
      url: "#",
      icon: Clock,
      items: [
        {
          title: "Start Session",
          url: "#",
        },
        {
          title: "History",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Reminders",
      url: "#",
      icon: Bell,
      items: [
        {
          title: "Active Reminders",
          url: "#",
        },
        {
          title: "Create Reminder",
          url: "#",
        },
        {
          title: "Schedule",
          url: "#",
        },
      ],
    },
    {
      title: "Time Tracking",
      url: "#",
      icon: BarChart3,
      items: [
        {
          title: "Daily Report",
          url: "#",
        },
        {
          title: "Weekly Stats",
          url: "#",
        },
        {
          title: "Activity Log",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Voice Commands",
          url: "#",
        },
        {
          title: "Expressions",
          url: "#",
        },
        {
          title: "Notifications",
          url: "#",
        },
        {
          title: "Device",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Voice Training",
      url: "#",
      icon: AudioWaveform,
    },
    {
      name: "Expression Library",
      url: "#",
      icon: Bot,
    },
    {
      name: "Custom Commands",
      url: "#",
      icon: Command,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSetupWizard?: () => void;
}

export function AppSidebar({ onSetupWizard, ...props }: AppSidebarProps) {
  // Add setup wizard to settings items
  const dataWithSetup = {
    ...data,
    navMain: data.navMain.map(item => {
      if (item.title === "Settings") {
        return {
          ...item,
          items: [
            {
              title: "🛠️ ESP32 Setup",
              url: "#",
              onClick: onSetupWizard,
            },
            ...item.items,
          ]
        };
      }
      return item;
    })
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={dataWithSetup.navMain} onSetupWizard={onSetupWizard} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}


