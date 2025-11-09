import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { UpdateArticle } from '../../types';
import { showMessage, formatRelativeTime } from '../../utils/helpers';
import { Newspaper, Inbox, ChevronRight } from 'lucide-react';
import SkeletonList from '../skeletons/SkeletonList';

interface UpdatesPageProps {
    onNavigate: (view: string) => void;
}

const UpdatesPage: React.FC<UpdatesPageProps> = ({ onNavigate }) => {
    const [articles, setArticles] = useState<UpdateArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'updateArticles'), where('status', '==', 'published'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const articlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UpdateArticle));
            articlesData.sort((a, b) => (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0));
            setArticles(articlesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching articles:", error);
            showMessage("Failed to load updates.", true);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const getSnippet = (content: string) => {
        const text = content.replace(/\[EMBED.*?\]/g, '').replace(/<[^>]*>/g, '');
        return text.length > 150 ? text.substring(0, 150) + '...' : text;
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg mb-8 border-t-4 border-indigo-500">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <Newspaper size={32} /> Latest Updates
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Stay informed with the latest articles, announcements, and content updates.</p>
            </div>

            {loading ? <SkeletonList items={5} /> : (
                <div className="space-y-6">
                    {articles.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                            <Inbox className="w-16 h-16 text-gray-400 mx-auto" />
                            <h3 className="text-xl font-semibold mt-4 text-gray-800 dark:text-gray-100">No Updates Yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Check back soon for the latest news and articles.</p>
                        </div>
                    ) : (
                        articles.map(article => (
                            <button key={article.id} onClick={() => onNavigate(`update/${article.slug}`)} className="w-full text-left p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500">
                                <div className="flex justify-between items-start">
                                    <div className="flex-grow">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(article.createdAt)}</p>
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{article.title}</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{getSnippet(article.content)}</p>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-4" />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default UpdatesPage;