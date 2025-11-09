import React from 'react';
import { LayoutDashboard, FolderKanban, FilePlus, Palette, ListChecks, BookText, X, Flag, Newspaper, LayoutGrid, BookCopy, MessageSquare, PenSquare } from 'lucide-react';
import { AdminView } from './AdminDashboard';

interface AdminSidebarProps {
    currentView: AdminView;
    onSetView: (view: AdminView) => void;
    isOpen: boolean;
    onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentView, onSetView, isOpen, onClose }) => {
    
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'updates', label: 'Updates', icon: PenSquare },
        { id: 'categories', label: 'Categories', icon: FolderKanban },
        { id: 'tests', label: 'Upload Test', icon: FilePlus },
        { id: 'view-tests', label: 'All Tests', icon: ListChecks },
        { id: 'current-affairs', label: 'Current Affairs', icon: Newspaper },
        { id: 'pages', label: 'Pages', icon: BookText },
        { id: 'ui-management', label: 'Appearance', icon: Palette },
        { id: 'category-layout', label: 'Category Layout', icon: LayoutGrid },
        { id: 'study-materials', label: 'Study Materials', icon: BookCopy },
        { id: 'user-chats', label: 'User Chats', icon: MessageSquare },
        { id: 'reports', label: 'Reported Questions', icon: Flag },
    ] as const;

    return (
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex shrink-0 items-center justify-between border-b dark:border-gray-700 px-4 h-16">
                 <div className="text-xl font-extrabold text-indigo-700 dark:text-indigo-400">Admin<span className="text-gray-900 dark:text-gray-100">Panel</span></div>
                <button onClick={onClose} className="lg:hidden p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                    <X size={20} />
                </button>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7 p-4">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navItems.map(item => (
                                <li key={item.id}>
                                    <button 
                                        onClick={() => onSetView(item.id as AdminView)} 
                                        className={`w-full flex items-center p-2 text-sm leading-6 font-semibold text-gray-700 dark:text-gray-300 rounded-md transition-colors text-left ${currentView === item.id ? 'bg-gray-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                                    >
                                        <item.icon className="h-6 w-6 shrink-0 mr-3" />
                                        <span>{item.label}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default AdminSidebar;