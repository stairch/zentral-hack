'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  FileText,
  Mail,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Teams', href: '/dashboard/admin/teams', icon: Users },
    { label: 'Kategorien', href: '/dashboard/admin/categories', icon: FileText },
    { label: 'Emails', href: '/dashboard/admin/email', icon: Mail },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-card border"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border z-40 md:z-auto md:translate-x-0 md:relative p-4 flex flex-col"
      >
        <h1 className="text-2xl font-bold mb-8 mt-12 md:mt-0">Admin</h1>

        <nav className="space-y-2 flex-1">
          {menuItems.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant={pathname === href ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setIsOpen(false)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-start text-red-600 hover:text-red-600"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </motion.aside>
    </>
  );
}
