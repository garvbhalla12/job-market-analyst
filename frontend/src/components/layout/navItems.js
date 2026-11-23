import {
  Briefcase,
  Building2,
  Code2,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  User,
  Wallet,
} from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', title: 'Overview', icon: LayoutDashboard },
  { to: '/skills', label: 'Skills Analytics', title: 'Skills Analytics', icon: Code2 },
  { to: '/salary', label: 'Salary Analytics', title: 'Salary Analytics', icon: Wallet },
  { to: '/locations', label: 'Location Analytics', title: 'Location Analytics', icon: MapPin },
  { to: '/companies', label: 'Company Analytics', title: 'Company Analytics', icon: Building2 },
  { to: '/fresher', label: 'Fresher Jobs', title: 'Fresher Jobs', icon: GraduationCap },
  { to: '/jobs', label: 'Job Explorer', title: 'Job Explorer', icon: Briefcase },
  { to: '/profile', label: 'Profile', title: 'Profile', icon: User },
];
