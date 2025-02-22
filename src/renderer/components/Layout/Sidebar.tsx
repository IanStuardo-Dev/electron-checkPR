import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ChartPieIcon, ClipboardDocumentCheckIcon, ChevronLeftIcon, BellIcon } from '@heroicons/react/24/outline';

interface MenuItem {
  path: string;
  name: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
}

// En la sección de menuItems, añade:
const menuItems: MenuItem[] = [
  { path: '/', name: 'Dashboard', icon: ChartPieIcon },
  { path: '/history', name: 'PR History', icon: ClipboardDocumentCheckIcon },
  { path: '/notifications', name: 'Notifications', icon: BellIcon }, // Añade esta línea
];

interface SidebarProps {
  onWidthChange?: (width: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onWidthChange }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    onWidthChange?.(isCollapsed ? 80 : 240);
  }, [isCollapsed, onWidthChange]);

  return (
    <motion.div 
      initial={{ width: 240 }}
      animate={{ 
        width: isCollapsed ? 80 : 240
      }}
      className="h-screen bg-slate-900 flex-shrink-0 fixed right-0"
    >
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-6 bg-slate-900 rounded-full p-1.5 shadow-lg hover:bg-slate-800"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronLeftIcon 
          className={`w-4 h-4 text-white transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <div className="p-6 space-y-6 overflow-hidden">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-sky-500 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-6 h-6 ${isCollapsed ? 'mx-auto' : ''}`} />
                {!isCollapsed && (
                  <span className="font-medium whitespace-nowrap">{item.name}</span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Sidebar;