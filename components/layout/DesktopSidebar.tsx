import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Category } from '../../types';
import { Home, ChevronRight, Newspaper } from 'lucide-react';
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
    
    const getDescendantIds = useCallback((catId: string): string[] => {
        let ids: string[] = [];
        const children = allCategories.filter(c => c.parentId === catId);
        for (const child of children) {
            ids.push(child.id);
            ids = ids.concat(getDescendantIds(child.id));
        }
        return ids;
    }, [allCategories]);

    const isParentOfSelected = useMemo(() => {
        if (!selectedCategory.id) return false;
        const descendantIds = getDescendantIds(category.id);
        return descendantIds.includes(selectedCategory.id);
    }, [selectedCategory.id, category.id, getDescendantIds]);
    
    const isSelected = selectedCategory.id === category.id;
    const style = getCategoryStyle(category.name);

    useEffect(() => {
        if (isParentOfSelected && !isOpen) {
            setIsOpen(true);
        }
    }, [isParentOfSelected, isOpen]);

    return (
        <li>
            <div className={`flex items-center justify-between group rounded-lg transition-colors ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <button
                    onClick={() => onSelectCategory({ id: category.id, name: category.name })}
                    className="flex-grow flex items-center text-left p-3"
                >
                    <DynamicIcon name={category.icon || category.name} className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : style.text}`} />
                    <span className="ml-3 font-bold truncate text-black dark:text-white">{category.name}</span>
                </button>
                {hasChildren && (
                    <button
                        onClick={() => setIsOpen(prev => !prev)}
                        className="p-2 mr-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded-full flex-shrink-0"
                        aria-label={isOpen ? `Collapse ${category.name}` : `Expand ${category.name}`}
                    >
                        <ChevronRight className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </button>
                )}
            </div>
            {hasChildren && isOpen && (
                <ul className="pl-5 ml-3 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 animate-fade-in">
                    {childCategories.map(child => {
                        const childStyle = getCategoryStyle(child.name);
                        const isChildSelected = selectedCategory.id === child.id;
                        return (
                        <li key={child.id}>
                            <button onClick={() => onSelectCategory({ id: child.id, name: child.name })} className={`w-full text-left flex items-center p-2 text-sm rounded-lg transition-colors font-bold text-black dark:text-white ${isChildSelected ? 'bg-indigo-50 dark:bg-indigo-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                <DynamicIcon name={child.icon || child.name} className={`w-4 h-4 mr-2 flex-shrink-0 ${isChildSelected ? 'text-indigo-700 dark:text-indigo-300' : childStyle.text}`} />
                                <span className="truncate">{child.name}</span>
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
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 hidden lg:block self-start sticky top-24 border dark:border-gray-700">
            <nav className="space-y-1">
                <button onClick={() => onNavigate('home')} className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 font-bold text-black dark:text-white ${!selectedCategory.id ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <Home className="text-indigo-500 w-5 h-5" />
                    <span className="ml-3">Home</span>
                </button>
                 <button onClick={() => onNavigate('updates')} className="w-full flex items-center p-3 rounded-lg transition-colors duration-200 font-bold text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Newspaper className="text-green-500 w-5 h-5" />
                    <span className="ml-3">Updates</span>
                </button>
            </nav>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="px-3 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-2">Test Categories</h3>
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
            </div>
        </aside>
    );
};

export default DesktopSidebar;
