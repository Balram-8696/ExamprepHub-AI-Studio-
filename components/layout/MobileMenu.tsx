import React, { useState } from 'react';
import { Category } from '../../types';
import { X, Home, ChevronRight, FolderKanban, Newspaper } from 'lucide-react';
import SkeletonListItem from '../skeletons/SkeletonListItem';
import DynamicIcon from './DynamicIcon';
import { getCategoryStyle } from '../../utils/helpers';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    loading: boolean;
    onSelectCategory: (category: { id: string; name: string }) => void;
    onNavigate: (view: string) => void;
}

const MobileMenuCategoryItem: React.FC<{ 
    category: Category; 
    allCategories: Category[]; 
    onSelectCategory: (category: { id: string; name: string }) => void; 
}> = ({ category, allCategories, onSelectCategory }) => {
    const [isOpen, setIsOpen] = useState(false);
    const childCategories = allCategories.filter(c => c.parentId === category.id);
    const hasChildren = childCategories.length > 0;
    const style = getCategoryStyle(category.name);

    const handleParentClick = () => {
        if (hasChildren) {
            setIsOpen(prev => !prev);
        } else {
            onSelectCategory({ id: category.id, name: category.name });
        }
    };

    return (
        <li>
            <button
                onClick={handleParentClick}
                className="w-full flex items-center justify-between p-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors duration-200 text-left"
            >
                <span className="flex items-center flex-grow relative">
                    <DynamicIcon name={category.icon || category.name} className={`w-5 h-5 flex-shrink-0 ${style.text}`} />
                    <span className="ml-3 font-bold">{category.name}</span>
                </span>
                {hasChildren && 
                    <ChevronRight className={`w-5 h-5 transition-transform text-gray-500 dark:text-gray-400 ${isOpen ? 'rotate-90' : ''}`} />
                }
            </button>
            {hasChildren && isOpen && (
                <ul className="pl-6 ml-3 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 animate-fade-in">
                    <li>
                        <button onClick={() => onSelectCategory({ id: category.id, name: category.name })} className="w-full text-left flex items-center p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700">
                            <FolderKanban className="w-4 h-4 mr-2" />
                            <span className="text-sm">All {category.name}</span>
                        </button>
                    </li>
                    {childCategories.map(child => {
                        const childStyle = getCategoryStyle(child.name);
                        return (
                        <li key={child.id}>
                            <button onClick={() => onSelectCategory({ id: child.id, name: child.name })} className="w-full text-left flex items-center p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700">
                                <DynamicIcon name={child.icon || child.name} className={`w-4 h-4 mr-2 flex-shrink-0 ${childStyle.text}`} />
                                <span className="text-sm">{child.name}</span>
                            </button>
                        </li>
                    )})}
                </ul>
            )}
        </li>
    );
};

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, categories, loading, onSelectCategory, onNavigate }) => {
    const topLevelCategories = categories.filter(c => !c.parentId);

    return (
        <div className={`lg:hidden fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            {/* Overlay */}
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
                onClick={onClose}
                aria-hidden="true"
            ></div>
            
            {/* Menu Panel */}
            <div className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-2xl z-50 transition-transform duration-300 ease-in-out w-[75%] sm:w-48 border-r border-gray-200 dark:border-gray-700 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">Exam<span className="text-gray-900 dark:text-gray-100">Hub</span></div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <div className="p-4 overflow-y-auto h-[calc(100vh-65px)]">
                    <ul className="space-y-1">
                        <li>
                            <button onClick={() => onSelectCategory({ id: '', name: 'All Tests' })} className="w-full flex items-center p-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors duration-200 relative sidebar-link">
                                <Home className="text-indigo-500 w-5 h-5" />
                                <span className="ml-3 font-bold">Home</span>
                            </button>
                        </li>
                         <li>
                            <button onClick={() => onNavigate('updates')} className="w-full flex items-center p-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors duration-200 relative sidebar-link">
                                <Newspaper className="text-green-500 w-5 h-5" />
                                <span className="ml-3 font-bold">Updates</span>
                            </button>
                        </li>
                        <li className="pt-2">
                             <div className="text-xs font-semibold text-gray-400 uppercase px-3">Categories</div>
                        </li>
                        {loading ? (
                            <>
                                {Array.from({ length: 5 }).map((_, index) => <SkeletonListItem key={index} />)}
                            </>
                        ) : (
                            topLevelCategories.map(category => (
                                <MobileMenuCategoryItem key={category.id} category={category} allCategories={categories} onSelectCategory={onSelectCategory} />
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default MobileMenu;