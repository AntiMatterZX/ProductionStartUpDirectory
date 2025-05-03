"use client"

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiMenu, FiPlus, FiChevronDown, FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from "@/lib/supabase/client-component";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/theme/mode-toggle";

interface Sublink {
  title: string;
  href: string;
}

interface NavLink {
  title: string;
  sublinks: Sublink[];
}

interface RoundedDrawerNavProps {
  children: React.ReactNode;
  navBackground?: string;
  bodyBackground?: string;
  links: NavLink[];
  user?: any; // User object
  userRole?: string; // User role
}

export const RoundedDrawerNav: React.FC<RoundedDrawerNavProps> = ({
  children,
  navBackground = "bg-background dark:bg-zinc-900",
  bodyBackground = "bg-background",
  links,
  user,
  userRole,
}) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const activeSublinks = useMemo(() => {
    if (!hovered) return [];
    const link = links.find((l) => l.title === hovered);
    return link ? link.sublinks : [];
  }, [hovered, links]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <nav
        onMouseLeave={() => setHovered(null)}
        className={`${navBackground} p-4 relative z-20`}
      >
        <div className="container mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <Logo size="md" withText={true} className="mt-0.5" />
              <DesktopLinks
                links={links}
                setHovered={setHovered}
                hovered={hovered}
                activeSublinks={activeSublinks}
              />
            </div>

            <div className="flex items-center gap-2">
              <ModeToggle />
              {user ? (
                <>
                  <Button 
                    className="hidden rounded-md bg-primary px-3 py-1.5 text-sm text-white transition-colors hover:bg-primary/90 md:block"
                    onClick={() => router.push("/dashboard")}
                  >
                    Dashboard
                  </Button>
                  <div className="hidden md:block">
                    <UserProfileMenu user={user} onSignOut={handleSignOut} userRole={userRole} />
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="hidden md:block">
                    <Button variant="outline" size="sm" className="rounded-md">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup" className="hidden md:block">
                    <Button size="sm" className="rounded-md bg-primary text-white">
                      <span className="font-bold">Get started</span> - free
                    </Button>
                  </Link>
                </>
              )}
              <button
                onClick={() => setMobileNavOpen((pv) => !pv)}
                className="mt-0.5 block text-2xl text-foreground dark:text-neutral-50 md:hidden"
              >
                <FiMenu />
              </button>
            </div>
          </div>
          <MobileLinks links={links} open={mobileNavOpen} user={user} onSignOut={handleSignOut} userRole={userRole} />
        </div>
      </nav>
      <motion.main layout className={`${navBackground} px-2 pb-2`}>
        <div className={`${bodyBackground} rounded-3xl overflow-hidden`}>{children}</div>
      </motion.main>
    </>
  );
};

// User Profile Menu Component
interface UserProfileMenuProps {
  user: any;
  onSignOut: () => Promise<void>;
  userRole?: string;
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ user, onSignOut, userRole }) => {
  const router = useRouter();
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || "User avatar"} />
            <AvatarFallback className="bg-primary/10 text-primary">{getUserInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">
              {userRole === 'admin' ? 'Administrator' : 'User Account'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <FiUser className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/account")}>
          <FiSettings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut}>
          <FiLogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface DesktopLinksProps {
  links: NavLink[];
  setHovered: (title: string | null) => void;
  hovered: string | null;
  activeSublinks: Sublink[];
}

const DesktopLinks: React.FC<DesktopLinksProps> = ({ 
  links, 
  setHovered, 
  hovered, 
  activeSublinks 
}) => {
  return (
    <div className="ml-9 mt-0.5 hidden md:block">
      <div className="flex gap-6">
        {links.map((l) => (
          <TopLink key={l.title} setHovered={setHovered} title={l.title}>
            {l.title}
          </TopLink>
        ))}
      </div>
      <AnimatePresence mode="popLayout">
        {hovered && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="space-y-4 py-6"
          >
            {activeSublinks.map((l) => (
              <Link
                className="block text-2xl font-semibold text-foreground dark:text-neutral-50 transition-colors hover:text-muted-foreground dark:hover:text-neutral-400"
                href={l.href}
                key={l.title}
              >
                {l.title}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface MobileLinksProps {
  links: NavLink[];
  open: boolean;
  user?: any;
  onSignOut?: () => Promise<void>;
  userRole?: string;
}

const MobileLinks: React.FC<MobileLinksProps> = ({ links, open, user, onSignOut, userRole }) => {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 overflow-hidden md:hidden"
        >
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <div key={l.title}>
                <button
                  onClick={() => setActiveCategory(active => active === l.title ? null : l.title)}
                  className="flex w-full items-center justify-between text-lg font-semibold text-foreground dark:text-neutral-50"
                >
                  <span>{l.title}</span>
                  <motion.span
                    animate={{
                      rotate: activeCategory === l.title ? -180 : 0,
                    }}
                  >
                    <FiChevronDown />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {activeCategory === l.title && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 space-y-2 pl-4"
                    >
                      {l.sublinks.map((sl) => (
                        <Link
                          href={sl.href}
                          key={sl.title}
                          className="block text-muted-foreground dark:text-neutral-400 transition-colors hover:text-foreground dark:hover:text-neutral-50"
                        >
                          {sl.title}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            
            {user ? (
              <div className="mt-4 space-y-2">
                <Link href="/dashboard" className="inline-block">
                  <Button>Dashboard</Button>
                </Link>
                <Button variant="outline" className="w-full justify-start" onClick={onSignOut}>
                  <FiLogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="mt-4 flex gap-2">
                <Link href="/login" className="inline-block">
                  <Button variant="outline">Log in</Button>
                </Link>
                <Link href="/signup" className="inline-block">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface TopLinkProps {
  children: React.ReactNode;
  setHovered: (title: string | null) => void;
  title: string;
}

const TopLink: React.FC<TopLinkProps> = ({ children, setHovered, title }) => (
  <span
    onMouseEnter={() => setHovered(title)}
    className="cursor-pointer text-foreground dark:text-neutral-50 transition-colors hover:text-muted-foreground dark:hover:text-neutral-400"
  >
    {children}
  </span>
); 