import { FileText, BookOpen, GraduationCap, Calendar, User, ClipboardCheck, LifeBuoy, FolderKanban, CalendarDays, Brain, FlaskConical } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Profile', url: '/dashboard', icon: User, exact: true },
  { title: 'Question Papers', url: '/dashboard/papers', icon: FileText },
  { title: 'Notes', url: '/dashboard/notes', icon: BookOpen },
  { title: 'Syllabus', url: '/dashboard/syllabus', icon: GraduationCap },
  { title: 'Lab Manuals', url: '/dashboard/lab-manuals', icon: FlaskConical },
  { title: 'Events', url: '/dashboard/events', icon: Calendar },
  { title: 'Organizers', url: '/dashboard/organizers', icon: FolderKanban },
  { title: 'Mar Support', url: '/dashboard/mar-support', icon: LifeBuoy },
  { title: 'Attendance', url: '/dashboard/attendance', icon: ClipboardCheck },
  { title: 'Study Timetable', url: '/dashboard/timetable', icon: CalendarDays },
  { title: 'PYQ Analyzer', url: '/dashboard/pyq-analyzer', icon: Brain },
];

export function StudentSidebar() {
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.exact}
                      className="hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-4 border-primary"
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
