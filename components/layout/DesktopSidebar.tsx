import React, { useState, useEffect } from 'react';
import { Category } from '../../types';
import { Home, ChevronRight, FolderKanban, Newspaper } from 'lucide-react';
import SkeletonListItem from '../skeletons/SkeletonListItem';
import DynamicIcon from './DynamicIcon';
import { getCategoryStyle } from '../../utils/helpers';

interface DesktopSidebarProps {
    categories: Category[];
    loading: boolean;
    selectedCategory: { id: string; name: string };
    onSelectCategory: (category: { id: string; name: string }) => void;
    onNavigate: (view: string) => void;
}

const SidebarCategoryItem: React.FC<{ category: Category; allCategories: Category[]; onSelectCategory: (category: { id: string; name: string }) => void; selectedCategory: { id: string; name: string }; }> = ({ category, allCategories, onSelectCategory, selectedCategory }) => {
    const [isOpen, setIsOpen] = useState(false);
    const childCategories = allCategories.filter(c => c.parentId === category.id);
    const hasChildren = childCategories.length > 0;
    const isSelected = selectedCategory.id === category.id;
    const style = getCategoryStyle(category.name);

    useEffect(() => {
        // Auto-open if a child category is selected
        const isChildSelected = childCategories.some(child => child.id === selectedCategory.id);
        if (isChildSelected && !isOpen) {
            setIsOpen(true);
        }
    }, [selectedCategory.id, childCategories, isOpen]);

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
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 text-left ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-indigo-50 dark:hover:bg-gray-700'}`}
            >
                <span className={`flex items-center flex-grow relative ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    <DynamicIcon name={category.icon || category.name} className={`w-5 h-5 flex-shrink-0 ${isSelected ? '' : style.text}`} />
                    <span className="ml-3 font-bold">{category.name}</span>
                </span>
                {hasChildren && (
                    <ChevronRight className={`w-5 h-5 transition-transform text-gray-500 dark:text-gray-400 ${isOpen ? 'rotate-90' : ''}`} />
                )}
            </button>
            {hasChildren && isOpen && (
                <ul className="pl-6 ml-3 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 animate-fade-in">
                    <li>
                        <button onClick={() => onSelectCategory({ id: category.id, name: category.name })} className={`w-full text-left flex items-center p-2 text-sm rounded-lg transition-colors ${selectedCategory.id === category.id ? 'text-indigo-700 dark:text-indigo-300 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700'}`}>
                            <FolderKanban className="w-4 h-4 mr-2" />
                            <span>All {category.name}</span>
                        </button>
                    </li>
                    {childCategories.map(child => {
                        const childStyle = getCategoryStyle(child.name);
                        return (
                        <li key={child.id}>
                            <button onClick={() => onSelectCategory({ id: child.id, name: child.name })} className={`w-full text-left flex items-center p-2 text-sm rounded-lg transition-colors ${selectedCategory.id === child.id ? 'text-indigo-700 dark:text-indigo-300 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700'}`}>
                                <DynamicIcon name={child.icon || child.name} className={`w-4 h-4 mr-2 flex-shrink-0 ${selectedCategory.id === child.id ? '' : childStyle.text}`} />
                                <span>{child.name}</span>
                            </button>
                        </li>
                    )})}
                </ul>
            )}
        </li>
    );
};

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ categories, loading, selectedCategory, onSelectCategory, onNavigate }) => {
    const topLevelCategories = categories.filter(c => !c.parentId);

    return (
        <aside className="w-48 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 hidden lg:block self-start sticky top-24 border dark:border-gray-700">
            <nav className="space-y-1">
                <button onClick={() => onSelectCategory({ id: '', name: 'All Tests' })} className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 relative sidebar-link ${!selectedCategory.id ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700'}`}>
                    <Home className="text-indigo-500 w-5 h-5" />
                    <span className="ml-3 font-bold">Home</span>
                </button>
                 <button onClick={() => onNavigate('updates')} className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 relative sidebar-link text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700`}>
                    <Newspaper className="text-green-500 w-5 h-5" />
                    <span className="ml-3 font-bold">Updates</span>
                </button>
            </nav>
            <div className="text-lg font-semibold my-4 text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-3">Test Categories</div>
            <ul className="space-y-1">
                {loading ? (
                    <>
                        {Array.from({ length: 5 }).map((_, index) => <SkeletonListItem key={index} />)}
                    </>
                ) : (
                    topLevelCategories.map(category => (
                        <SidebarCategoryItem key={category.id} category={category} allCategories={categories} onSelectCategory={onSelectCategory} selectedCategory={selectedCategory} />
                    ))
                )}
            </ul>
        </aside>
    );
};

export default DesktopSidebar;