import {
  LayoutDashboard,
  Kanban,
  Users,
  Mail,
  Settings,
  LogOut,
  MessageSquare,
  Webhook,
  BarChart3,
  Bot,
  FileText,
  GitBranch,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/crm", icon: LayoutDashboard },
  { title: "Funil de Vendas", url: "/crm/pipeline", icon: Kanban },
  { title: "Leads", url: "/crm/leads", icon: Users },
  { title: "Campanhas", url: "/crm/campaigns", icon: Mail },
  { title: "Relatórios", url: "/crm/reports", icon: BarChart3 },
];

const botItems = [
  { title: "Bot Dashboard", url: "/crm/bot", icon: Bot },
  { title: "Bot Leads", url: "/crm/bot/leads", icon: Users },
  { title: "Fluxo", url: "/crm/bot/flow", icon: GitBranch },
  { title: "Materiais", url: "/crm/bot/materials", icon: FileText },
  { title: "Config Bot", url: "/crm/bot/settings", icon: Settings },
];

const configItems = [
  { title: "Integrações", url: "/crm/integrations", icon: Webhook },
  { title: "WhatsApp", url: "/crm/whatsapp", icon: MessageSquare },
  { title: "Configurações", url: "/crm/settings", icon: Settings },
];

export function CrmSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/crm") return location.pathname === "/crm";
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand */}
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-sm text-primary-foreground">U</span>
          </div>
          {!collapsed && (
            <div>
              <span className="font-display font-bold text-sm text-sidebar-foreground">URBA</span>
              <span className="font-display font-light text-sm text-primary">CRM</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === "/crm"} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Bot MBC</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {botItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === "/crm/bot"} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configuração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-destructive hover:bg-destructive/10">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
