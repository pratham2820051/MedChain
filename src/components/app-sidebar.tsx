import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Upload,
  FileText,
  Shield,
  ScrollText,
  User,
  LayoutDashboard,
  Send,
  Bell,
  Stethoscope,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const patientItems = [
  { title: "Dashboard", url: "/patient/dashboard", icon: LayoutDashboard },
  { title: "Upload Records", url: "/patient/upload", icon: Upload },
  { title: "My Records", url: "/patient/records", icon: FileText },
  { title: "Access Management", url: "/patient/access", icon: Shield },
  { title: "Audit Trail", url: "/patient/audit", icon: ScrollText },
  { title: "Profile", url: "/patient/profile", icon: User },
];

const doctorItems = [
  { title: "Dashboard", url: "/doctor/dashboard", icon: LayoutDashboard },
  { title: "Request Access", url: "/doctor/request", icon: Send },
  { title: "Patient Records", url: "/doctor/records", icon: FileText },
  { title: "Notifications", url: "/doctor/notifications", icon: Bell },
  { title: "Profile", url: "/doctor/profile", icon: User },
];

export function AppSidebar({ role }: { role: "patient" | "doctor" }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const items = role === "patient" ? patientItems : doctorItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-hero text-primary-foreground shadow-card">
            {role === "doctor" ? (
              <Stethoscope className="h-5 w-5" />
            ) : (
              <Activity className="h-5 w-5" />
            )}
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold">MedChain</div>
              <div className="text-[11px] text-muted-foreground capitalize">{role} portal</div>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
