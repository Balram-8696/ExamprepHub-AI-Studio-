import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot, limit, doc, getDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { UpdateArticle, Test, Category, UserResult, TestStateLocal } from '../../types';
import { FileWarning, ArrowLeft, Loader2 } from 'lucide-react';
import SkeletonPage from '../skeletons/SkeletonPage';
import TestCard from '../home/TestCard';
import { AuthContext } from '../../App';
import { showMessage } from '../../utils/helpers';
import DynamicIcon from '../layout/DynamicIcon';

interface EmbeddedTestProps {
    testId: string;
    onInitiateTestView: (details: { test: Test; action: 'resume' | 'result'; resultData?: UserResult, language: 'english' | 'hindi' }) => void;
    onShowInstructions: (test: Test) => void;
}

const EmbeddedTest: React.FC<EmbeddedTestProps> = ({ testId, onInitiateTestView, onShowInstructions }) => {
    const { user } = useContext(AuthContext);
    const [test, setTest] = useState<Test | null>(null);
    const [userResult, setUserResult] = useState<UserResult | undefined>(undefined);
    const [inProgress, setInProgress] = useState<TestStateLocal | null>(null);

    useEffect(() => {
        const testRef = doc(db, 'tests', testId);
        getDoc(testRef).then(docSnap => {
            if (docSnap.exists()) {
                setTest({ id: docSnap.id, ...docSnap.data() } as Test);
            }
        });

        if (user) {
            const resultsQuery = query(collection(db, 'results'), where('userId', '==', user.uid), where('testId', '==', testId));
            const unsub = onSnapshot(resultsQuery, snap => {
                if (!snap.empty) {
                    setUserResult(snap.docs[0].data() as UserResult);
                }
            });
            const local = localStorage.getItem(`inProgressTest_${user.uid}`);
            if (local) {
                const inProgressTest = JSON.parse(local);
                if (inProgressTest.testId === testId) {
                    setInProgress(inProgressTest);
                }
            }
            return unsub;
        }
    }, [testId, user]);

    const handleAction = async (id: string, action: 'start' | 'resume' | 'result') => {
        if (!test) return;
        if (action === 'start') onShowInstructions(test);
        else if (action === 'resume') onInitiateTestView({ test, action: 'resume', language: 'english' });
        else if (action === 'result') onInitiateTestView({ test, action: 'result', resultData: userResult, language: 'english' });
    };

    if (!test) return <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center"><Loader2 className="animate-spin inline-block" /></div>;

    return <TestCard test={test} userResult={userResult} inProgressTest={inProgress} onAction={handleAction} />;
};

const EmbeddedCategory: React.FC<{ categoryId: string; onNavigate: (path: string) => void; }> = ({ categoryId, onNavigate }) => {
    const [category, setCategory] = useState<Category | null>(null);
    useEffect(() => {
        getDoc(doc(db, 'testCategories', categoryId)).then(docSnap => {
            if (docSnap.exists()) setCategory({ id: docSnap.id, ...docSnap.data() } as Category);
        });
    }, [categoryId]);

    if (!category) return null;

    return (
        <button onClick={() => onNavigate(`category:${categoryId}`)} className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/40 border-l-4 border-indigo-500 rounded-r-lg w-full text-left hover:bg-indigo-100 dark:hover:bg-indigo-900/60">
            <DynamicIcon name={category.icon || category.name} className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
                <p className="text-xs text-indigo-500 dark:text-indigo-300 font-semibold">Featured Category</p>
                <p className="font-bold text-gray-800 dark:text-gray-100">{category.name}</p>
            </div>
        </button>
    );
};


interface UpdateArticleViewProps {
    slug: string;
    onNavigate: (view: string) => void;
    onPageLoad: (title: string) => void;
    onInitiateTestView: (details: { test: Test; action: 'resume' | 'result'; resultData?: UserResult, language: 'english' | 'hindi' }) => void;
    onShowInstructions: (test: Test) => void;
}

const UpdateArticleView: React.FC<UpdateArticleViewProps> = ({ slug, onPageLoad, ...embedProps }) => {
    const [article, setArticle] = useState<UpdateArticle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        const q = query(collection(db, 'updateArticles'), where("slug", "==", slug), limit(1));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setError('Article not found.');
                onPageLoad('Not Found');
                setArticle(null);
                 setLoading(false);
            } else {
                const articleData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UpdateArticle;
                if (articleData.status === 'published') {
                    setArticle(articleData);
                    onPageLoad(articleData.title);
                    
                    // Increment view count once per session
                    const viewedKey = `viewed_article_${articleData.id}`;
                    if (!sessionStorage.getItem(viewedKey)) {
                        const articleRef = doc(db, 'updateArticles', articleData.id);
                        updateDoc(articleRef, { viewCount: increment(1) })
                            .then(() => sessionStorage.setItem(viewedKey, 'true'))
                            .catch(err => console.error("Failed to increment view count", err));
                    }
                } else {
                    setError('Article not found.');
                    onPageLoad('Not Found');
                    setArticle(null);
                }
                setLoading(false);
            }
        }, (err) => {
            console.error("Error fetching article:", err);
            setError('Failed to load article content.');
            onPageLoad('Error');
            setLoading(false);
        });
        return () => unsubscribe();
    }, [slug, onPageLoad]);

    const renderContent = () => {
        if (!article) return null;

        const parts = article.content.split(/(\[EMBED.*?\])/g);
        
        return parts.map((part, index) => {
            const match = part.match(/\[EMBED type="(\w+)" id="([\w-]+)" title="(.*?)"\]/);
            if (match) {
                const [, type, id] = match;
                if (type === 'test') {
                    return <div className="my-6 not-prose" key={index}><EmbeddedTest testId={id} {...embedProps} /></div>;
                }
                if (type === 'category') {
                     return <div className="my-6 not-prose" key={index}><EmbeddedCategory categoryId={id} onNavigate={embedProps.onNavigate} /></div>;
                }
                return null;
            } else {
                return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
            }
        });
    };

    const formatDate = (timestamp: Timestamp) => {
        if (!timestamp) return '';
        return timestamp.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };


    if (loading) return <SkeletonPage />;
    if (error || !article) return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
            <div className="bg-white dark:bg-gray-800 p-10 rounded-xl shadow-md">
                <FileWarning className="w-16 h-16 text-red-400 mx-auto" />
                <h2 className="text-2xl font-bold mt-4 text-gray-900 dark:text-gray-100">Article Not Found</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">{error}</p>
            </div>
        </div>
    );
    
    return (
        <div className="bg-white dark:bg-slate-900 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {article.featuredImageUrl && (
                    <img src={article.featuredImageUrl} alt={article.title} className="w-full h-auto max-h-96 object-cover rounded-xl mb-8 shadow-lg" />
                )}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">{article.title}</h1>
                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>By {article.authorName || 'Admin'}</span>
                        <span className="mx-2">&middot;</span>
                        <span>Published on {formatDate(article.publishAt)}</span>
                    </div>
                </div>
                <div className="prose prose-lg prose-indigo dark:prose-invert text-gray-700 dark:text-gray-300 mx-auto lg:max-w-none">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default UpdateArticleView;
