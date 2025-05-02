import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, Menu, Bell, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) {
    return (
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="font-bold text-xl text-primary-500 cursor-pointer">
                  Discipline Never Fails
                </span>
              </Link>
            </div>
            <div>
              <Button variant="outline" asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get user's initial for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/challenges", label: "My Challenges" },
    { path: "/progress", label: "Progress" },
    { path: "/connections", label: "Connections" },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="font-bold text-xl text-primary-500 cursor-pointer">
                  Discipline Never Fails
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <span
                    className={`${
                      location === item.path
                        ? "border-primary-500 text-neutral-900"
                        : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button type="button" className="bg-white p-1 rounded-full text-neutral-400 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="bg-white flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ml-3">
                  <span className="sr-only">Open user menu</span>
                  <Avatar>
                    <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                  {logoutMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <span>Log out</span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center sm:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button type="button" className="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                  <span className="sr-only">Open main menu</span>
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle className="text-primary-500">Menu</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <div className="px-2 pt-2 pb-3 space-y-1">
                    {navItems.map((item) => (
                      <Link key={item.path} href={item.path}>
                        <span
                          className={`${
                            location === item.path
                              ? "bg-primary-50 border-primary-500 text-primary-700"
                              : "border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-800"
                          } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <div className="pt-4 pb-3 border-t border-neutral-200">
                    <div className="flex items-center px-4">
                      <div className="flex-shrink-0">
                        <Avatar>
                          <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt={user.name} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-neutral-800">{user.name}</div>
                        <div className="text-sm font-medium text-neutral-500">{user.email}</div>
                      </div>
                      <button type="button" className="ml-auto flex-shrink-0 bg-white p-1 rounded-full text-neutral-400 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <span className="sr-only">View notifications</span>
                        <Bell className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="mt-3 space-y-1">
                      <a href="#" className="block px-4 py-2 text-base font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100">
                        Your Profile
                      </a>
                      <a href="#" className="block px-4 py-2 text-base font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100">
                        Settings
                      </a>
                      <button
                        className="w-full text-left block px-4 py-2 text-base font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        disabled={logoutMutation.isPending}
                      >
                        {logoutMutation.isPending ? "Logging out..." : "Sign out"}
                      </button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
