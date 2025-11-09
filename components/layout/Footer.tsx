import React from 'react';
import { FooterLink } from '../../types';

interface FooterProps {
    onNavigate: (view: string) => void;
    links: FooterLink[];
}

const Footer: React.FC<FooterProps> = ({ onNavigate, links }) => {
    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-10">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">Exam<span className="text-gray-900 dark:text-gray-100">Hub</span></div>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-gray-600 dark:text-gray-300">
                         {links.map(link => (
                            <button key={link.path} onClick={() => onNavigate(link.path)} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{link.label}</button>
                        ))}
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <p>&copy; {new Date().getFullYear()} ExamHub. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;