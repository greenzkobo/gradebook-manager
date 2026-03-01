import { useLocation, Link } from "wouter";
import { LayoutDashboard, Users, BookOpen, ClipboardList, GraduationCap, UserCheck, LogOut } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { logoutUser } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  SidebarFooter,
} from "@/components/ui/sidebar";

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  teacher: "secondary",
  student: "outline",
};

export function AppSidebar() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { isStudent } = usePermissions();

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate("/login");
    },
  });

  const menuItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, visible: true },
    { title: "Students", url: "/students", icon: Users, visible: !isStudent() },
    { title: "Subjects", url: "/subjects", icon: BookOpen, visible: true },
    { title: "Gradebook", url: "/grades", icon: ClipboardList, visible: true },
    { title: "Teachers", url: "/teachers", icon: UserCheck, visible: !isStudent() },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3" data-testid="text-app-brand">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">GradeBook</h1>
            <p className="text-xs text-muted-foreground">School Management</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter((item) => item.visible).map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-3">
        {user && (
          <div className="flex items-center justify-between" data-testid="text-user-info">
            <span className="text-sm font-medium truncate">{user.username}</span>
            <Badge variant={roleBadgeVariant[user.role] || "outline"} data-testid="badge-user-role">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Badge>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
