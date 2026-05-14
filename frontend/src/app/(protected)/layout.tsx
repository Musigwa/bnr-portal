'use client';

import { useAuth } from '@/providers/auth.provider';
import { Role } from '@/types';
import { LogOut, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null; // The proxy middleware / AuthContext will handle the redirect
  }

  const hasMultipleRoots = user.role === Role.ADMIN;
  const rootHref = user.role === Role.APPLICANT ? '/applications' : '/dashboard';
  const rootLabel = user.role === Role.APPLICANT ? 'My Applications' : 'Dashboard';
  const isRoot = pathname === rootHref || pathname === '/users';

  const adminNavItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/users', label: 'Users' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href={rootHref} className="text-xl font-bold text-primary tracking-tight mr-4">BNR Portal</Link>
            
            {/* Breadcrumbs for single-root roles (Applicant, Reviewer, Approver) */}
            {!hasMultipleRoots && !isRoot && (
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <ChevronRight className="h-4 w-4" />
                <Link href={rootHref} className="hover:text-slate-900 transition-colors">
                  {rootLabel}
                </Link>
                {pathname.includes('/new') && (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-slate-900 font-medium">New Application</span>
                  </>
                )}
                {pathname.match(/\/applications\/[a-zA-Z0-9-]+/) && !pathname.includes('/new') && (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-slate-900 font-medium">{pathname.split('/').pop()}</span>
                  </>
                )}
              </div>
            )}

            {/* Navigation tabs for multi-root roles (Admin) */}
            {hasMultipleRoots && (
              <nav className="hidden md:flex space-x-1 ml-4 border-l pl-4">
                {adminNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-slate-100/80 text-slate-900 font-medium'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-center rounded-full cursor-pointer outline-none hover:ring-2 hover:ring-slate-200 hover:ring-offset-2 transition-all">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs mt-1 font-medium text-primary">
                        {user.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col container mx-auto max-w-7xl">
        <main className="flex-1 py-8 px-4 md:px-8">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="sticky bottom-0 z-50 w-full border-t bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} National Bank of Rwanda. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
