import { Link, useLocation } from 'react-router-dom';
import { RotateCcw, Calendar, BarChart2, BookOpen, User } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { name: '每日复盘', path: '/daily', icon: Calendar },
  { name: '深度复盘', path: '/deep', icon: BarChart2 },
  { name: '知识库', path: '/knowledge', icon: BookOpen },
  { name: '个人中心', path: '/profile', icon: User },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <RotateCcw className="w-5 h-5 text-slate-700 group-hover:rotate-[-45deg] transition-transform duration-500" />
            <span className="text-lg font-display font-medium tracking-tight text-slate-800">Rewind</span>
          </Link>

          <div className="hidden md:flex items-center space-x-10">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-[13px] font-medium transition-colors hover:text-slate-900",
                  location.pathname === item.path ? "text-slate-900" : "text-slate-400"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="md:hidden">
            {/* Mobile menu could go here if needed */}
            <button className="p-2 text-slate-600">
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
