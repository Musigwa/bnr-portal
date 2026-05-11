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

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const hasMultipleRoots = user.role === Role.ADMIN;
  const rootHref =
    user.role === Role.APPLICANT ? '/applications' : '/dashboard';
  const rootLabel =
    user.role === Role.APPLICANT ? 'My Applications' : 'Dashboard';
  const isRoot = pathname === rootHref || pathname === '/users';

  const adminNavItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/users', label: 'Users' },
  ];

  return (
    <header className="bg-card sticky top-0 z-50 w-full border-b backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Link
            href={rootHref}
            className="text-primary mr-4 text-xl font-bold tracking-tight"
          >
            BNR Portal
          </Link>

          {/* Breadcrumbs for single-root roles (Applicant, Reviewer, Approver) */}
          {!hasMultipleRoots && !isRoot && (
            <div className="text-muted-foreground hidden items-center space-x-2 text-sm md:flex">
              <ChevronRight className="h-4 w-4" />
              <Link
                href={rootHref}
                className="hover:text-foreground transition-colors"
              >
                {rootLabel}
              </Link>
              {pathname.includes('/new') && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-foreground font-medium">
                    New Application
                  </span>
                </>
              )}
              {pathname.match(/\/applications\/[a-zA-Z0-9-]+/) &&
                !pathname.includes('/new') && (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-foreground font-medium capitalize">
                      {pathname.endsWith('/edit')
                        ? 'Edit Application'
                        : pathname.split('/').pop()}
                    </span>
                  </>
                )}
            </div>
          )}

          {/* Navigation tabs for multi-root roles (Admin) */}
          {hasMultipleRoots && (
            <nav className="ml-4 hidden space-x-1 border-l pl-4 md:flex">
              {adminNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-muted text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="hover:ring-border flex cursor-pointer items-center justify-center rounded-full transition-all outline-none hover:ring-2 hover:ring-offset-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm leading-none font-medium">
                      {user.fullName}
                    </p>
                    <p className="text-muted-foreground text-xs leading-none">
                      {user.email}
                    </p>
                    <p className="text-primary mt-1 text-xs font-medium">
                      {user.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
