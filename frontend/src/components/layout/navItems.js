import {
  Briefcase,
  Building2,
  Code2,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Sparkles,
  User,
  Wallet,
} from 'lucide-react';

// `section` groups the sidebar links under small headings.
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', title: 'Overview', icon: LayoutDashboard, section: 'General' },
  { to: '/assistant', label: 'AI Assistant', title: 'AI Assistant', icon: Sparkles, section: 'General', badge: 'New' },
  { to: '/skills', label: 'Skills Analytics', title: 'Skills Analytics', icon: Code2, section: 'Analytics' },
  { to: '/salary', label: 'Salary Analytics', title: 'Salary Analytics', icon: Wallet, section: 'Analytics' },
  { to: '/locations', label: 'Location Analytics', title: 'Location Analytics', icon: MapPin, section: 'Analytics' },
  { to: '/companies', label: 'Company Analytics', title: 'Company Analytics', icon: Building2, section: 'Analytics' },
  { to: '/fresher', label: 'Fresher Jobs', title: 'Fresher Jobs', icon: GraduationCap, section: 'Explore' },
  { to: '/jobs', label: 'Job Explorer', title: 'Job Explorer', icon: Briefcase, section: 'Explore' },
  { to: '/profile', label: 'Profile', title: 'Profile', icon: User, section: 'Account' },
];

// Sections in display order, each with its links.
export const NAV_SECTIONS = NAV_ITEMS.reduce((sections, item) => {
  const existing = sections.find((s) => s.title === item.section);
  if (existing) existing.items.push(item);
  else sections.push({ title: item.section, items: [item] });
  return sections;
}, []);
