import React, { useState, useContext, useRef, useEffect } from 'react';
import { LogIn, User as UserIcon, Menu, User as UserViewIcon, Search, Sun, Moon, Bell, Newspaper, MessageSquare, MessageCircle, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../../App';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { showMessage, formatRelativeTime } from '../../utils/helpers';
import { useTheme } from '../../ThemeContext';
import { Notification } from '../../types';

interface HeaderProps {
    onNavigate: (view: string) => void;
    onMenuClick: () => void;
    isAdminView: boolean;
    onSwitchToUserView: () => void;
    searchQuery: string;
    onSearch: (query: string) => void;
    notifications: Notification[];
    onOpenChat: () => void;
    onMarkAsRead: (ids: string[]) => void;
    onNotificationClick: (notification: Notification) => void;
    onOpenAuthModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    onNavigate, onMenuClick, isAdminView, onSwitchToUserView, searchQuery, onSearch,
    notifications, onOpenChat, onMarkAsRead, onNotificationClick, onOpenAuthModal
}) => {
    const { user, userProfile } = useContext(AuthContext);
    const { theme, toggleTheme } = useTheme();
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const notificationsMenuRef = useRef<HTMLDivElement>(null);

    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const handler = setTimeout(() => {
            // Only call onSearch if the query has actually changed from the prop
            if (localSearchQuery !== searchQuery) {
                onSearch(localSearchQuery);
            }
        }, 300);
        return () => { clearTimeout(handler); };
    }, [localSearchQuery, onSearch, searchQuery]);

    useEffect(() => { setLocalSearchQuery(searchQuery); }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setProfileDropdownOpen(false);
            }
            if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleToggleNotifications = () => {
        const newOpenState = !notificationsOpen;
        setNotificationsOpen(newOpenState);
        if (newOpenState && unreadCount > 0) {
            const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
            onMarkAsRead(unreadIds);
        }
    };
    
    const handleMobileSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(localSearchQuery);
        setMobileSearchOpen(false);
    };

    const handleLogout = () => {
        signOut(auth).then(() => {
            showMessage('You have been logged out.');
            onNavigate('home');
        }).catch((error) => {
            showMessage(`Logout failed: ${error.message}`, true);
        });
        setProfileDropdownOpen(false);
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center gap-2">
                {/* Normal Left Side */}
                <div className={`flex items-center space-x-3 ${mobileSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
                     {!isAdminView && (
                        <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden" aria-label="Open menu">
                            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        </button>
                     )}
                    <button onClick={() => onNavigate('home')} className="flex items-center space-x-3">
                        <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">Exam<span className="text-gray-900 dark:text-gray-100">Hub</span></div>
                    </button>
                </div>
                
                {/* Normal Right Side */}
                <div className={`flex items-center space-x-1 sm:space-x-3 ${mobileSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
                    {!isAdminView && (
                        <div className="relative">
                            {/* Improved Desktop Search Bar */}
                            <div className="hidden sm:block relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search for tests, topics..."
                                    value={localSearchQuery}
                                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                                    className="block w-40 md:w-64 lg:w-80 pl-10 pr-4 py-2 border border-transparent bg-gray-100 dark:bg-gray-700/50 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 transition-all duration-300 ease-in-out sm:text-sm"
                                />
                            </div>
                             {/* Mobile Search Icon */}
                            <button onClick={() => setMobileSearchOpen(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 sm:hidden" aria-label="Search">
                                <Search className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </button>
                        </div>
                    )}

                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Toggle theme">
                        {theme === 'light' ? 
                            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" /> : 
                            <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        }
                    </button>

                    {isAdminView && (
                        <button onClick={onSwitchToUserView} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center gap-2">
                            <UserViewIcon size={16} />
                            User View
                        </button>
                    )}
                    {!user ? (
                        <button onClick={onOpenAuthModal} className="px-3 sm:px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2">
                            <LogIn size={16} />
                            <span className="hidden sm:inline">Login</span>
                        </button>
                    ) : (
                        <>
                        <div ref={notificationsMenuRef} className="relative">
                            <button onClick={handleToggleNotifications} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300"/>
                                {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>}
                            </button>
                            {notificationsOpen && (
                                 <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-700 rounded-xl shadow-lg z-50 origin-top-right border border-gray-100 dark:border-gray-600 animate-scale-in">
                                     <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-600">
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">Notifications</p>
                                     </div>
                                     <div className="py-1 max-h-80 overflow-y-auto pretty-scrollbar">
                                        {notifications.length === 0 ? (
                                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">No new notifications</p>
                                        ) : (
                                            notifications.map(n => (
                                                <button 
                                                    key={n.id} 
                                                    onClick={() => { onNotificationClick(n); setNotificationsOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 ${!n.isRead ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1 flex-shrink-0">
                                                            {n.type === 'admin_reply' ? <MessageSquare className="w-5 h-5 text-green-500"/> : n.type === 'chat_reply' ? <MessageCircle className="w-5 h-5 text-purple-500"/> : <Newspaper className="w-5 h-5 text-blue-500"/>}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-gray-700 dark:text-gray-200">{n.message}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                     </div>
                                 </div>
                            )}
                        </div>

                        <div ref={profileMenuRef} className="relative">
                            <button onClick={() => setProfileDropdownOpen(prev => !prev)} className="flex items-center justify-center w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900 transition">
                                {userProfile?.name ? (
                                    <span className="font-bold text-base">
                                        {userProfile.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                                    </span>
                                ) : (
                                    <UserIcon className="w-5 h-5" />
                                )}
                            </button>
                            {profileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-700 rounded-xl shadow-lg z-50 origin-top-right border border-gray-100 dark:border-gray-600 animate-scale-in">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-600">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">Signed in as</p>
                                        <p className="font-bold text-gray-800 dark:text-gray-100 truncate mt-1">{userProfile?.name || user.email}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate font-bold">{user.email}</p>
                                    </div>
                                    <div className="py-2">
                                        {userProfile?.role === 'admin' && (
                                            <button onClick={() => { onNavigate('admin'); setProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-bold">
                                                Admin Dashboard
                                            </button>
                                        )}
                                        <button onClick={() => { onNavigate('profile'); setProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-bold">
                                            My Profile
                                        </button>
                                        <button onClick={() => { onNavigate('settings'); setProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-bold">
                                            Settings
                                        </button>
                                        <button onClick={() => { onNavigate('contact'); setProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-bold">
                                            Contact Us
                                        </button>
                                        <button onClick={() => { onOpenChat(); setProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-bold">
                                            Chat with us
                                        </button>
                                    </div>
                                    <div className="py-2 border-t border-gray-100 dark:border-gray-600">
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-bold">
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        </>
                    )}
                </div>

                {/* Mobile Search expanded view */}
                {mobileSearchOpen && (
                    <div className="w-full flex items-center gap-2 sm:hidden animate-fade-in">
                        <button onClick={() => setMobileSearchOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        </button>
                        <form onSubmit={handleMobileSearchSubmit} className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="search"
                                placeholder="Search all tests..."
                                autoFocus
                                value={localSearchQuery}
                                onChange={(e) => setLocalSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 border-0 rounded-lg leading-5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            />
                        </form>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;