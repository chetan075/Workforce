'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/search': 'Search & Discovery',
  '/opportunities': 'Opportunities',
  '/services': 'Services',
  '/projects': 'Projects',
  '/project-messages': 'Project Messages',
  '/chat': 'Chat',
  '/notifications': 'Notifications',
  '/files': 'Files',
  '/files/cloud': 'Cloud Storage',
  '/files/versions': 'File Versions',
  '/upload': 'Upload Files',
  '/invoices': 'Invoices',
  '/payments': 'Payments',
  '/reputation': 'Reputation',
  '/reviews': 'Reviews',
  '/trust-badges': 'Trust Badges',
  '/disputes': 'Disputes',
  '/networking': 'Networking',
  '/blockchain': 'Blockchain',
  '/profile': 'Profile',
  '/login': 'Login',
};

export default function Breadcrumbs() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (pathname === '/' || pathname === '/dashboard') {
      return [{ label: 'Dashboard', href: '/dashboard' }];
    }

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard' }
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip adding duplicate dashboard
      if (currentPath === '/dashboard') {
        return;
      }
      
      const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      breadcrumbs.push({
        label,
        href: currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
      <Home className="h-4 w-4" />
      {breadcrumbs.map((item, index) => (
        <div key={`${index}-${item.href}`} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-white font-medium">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}