"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  onSetupWizard,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    showConnectionStatus?: boolean
    isConnected?: boolean
    items?: {
      title: string
      url: string
      onClick?: () => void
    }[]
  }[]
  onSetupWizard?: () => void
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {item.showConnectionStatus && (
                    <div 
                      className={`ml-auto w-2 h-2 rounded-full ${
                        item.isConnected ? 'bg-green-500' : 'bg-red-500'
                      }`} 
                      title={item.isConnected ? 'ESP32 Connected' : 'ESP32 Disconnected'}
                    />
                  )}
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        {subItem.onClick ? (
                          <button onClick={subItem.onClick} className="w-full text-left">
                            <span>{subItem.title}</span>
                          </button>
                        ) : (
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        )}
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
