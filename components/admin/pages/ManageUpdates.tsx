import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { UpdateArticle, Category, Test } from '../../../types';
import { showMessage } from '../../../utils/helpers';
import { PenSquare, PlusCircle, Trash2, Pencil, List, Loader2, Save, ArrowLeft, FileText, FolderKanban } from 'lucide-react';
import ConfirmModal from '../../modals/ConfirmModal';
import Modal from '../../modals/Modal';
import SkeletonTable from '../../skeletons/SkeletonTable';

const ManageUpdates: React.FC = () => {
    const [articles, setArticles] = useState<UpdateArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [editingArticle, setEditingArticle] = useState<UpdateArticle | null>(null);
    const [articleToDelete, setArticleToDelete] = useState<UpdateArticle | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'updateArticles'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UpdateArticle)));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching articles:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddNew = () => {
        setEditingArticle(null);
        setView('editor');
    };

    const handleEdit = (article: UpdateArticle) => {
        setEditingArticle(article);
        setView('editor');
    };

    const handleBackToList = () => {
        setEditingArticle(null);
        setView('list');
    };

    const handleDelete = async () => {
        if (!articleToDelete) return;
        try {
            await deleteDoc(doc(db, 'updateArticles', articleToDelete.id));
            showMessage('Article deleted successfully!');
        } catch (error) {
            showMessage('Failed to delete article.', true);
        } finally {
            setArticleToDelete(null);
        }
    };
    
    if (view === 'editor') {
        return <UpdateEditor articleToEdit={editingArticle} onSaveSuccess={handleBackToList} onCancel={handleBackToList} />;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border-t-4 border-indigo-500">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-3"><PenSquare size={32} /> Manage Updates</h1>
                <button onClick={handleAddNew} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                    <PlusCircle size={18} /> Add New Article
                </button>
            </div>
            
            {loading ? <SkeletonTable columns={4} rows={5} /> : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        {/* Table Head and Body */}
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {articles.map(article => (
                                <tr key={article.id}>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{article.title}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${article.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{article.status}</span></td>
                                    <td className="px-6 py-4 flex items-center gap-4">
                                        <button onClick={() => handleEdit(article)} className="text-indigo-600 hover:text-indigo-800"><Pencil size={18} /></button>
                                        <button onClick={() => setArticleToDelete(article)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
             {articleToDelete && <ConfirmModal isOpen={!!articleToDelete} onClose={() => setArticleToDelete(null)} onConfirm={handleDelete} title="Delete Article" message={`Delete "${articleToDelete.title}"?`} />}
        </div>
    );
};

// Editor Component
interface UpdateEditorProps {
    articleToEdit: UpdateArticle | null;
    onSaveSuccess: () => void;
    onCancel: () => void;
}
const UpdateEditor: React.FC<UpdateEditorProps> = ({ articleToEdit, onSaveSuccess, onCancel }) => {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [categoryId, setCategoryId] = useState('');
    
    const [categories, setCategories] = useState<Category[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEmbedModalOpen, setIsEmbedModalOpen] = useState<'test' | 'category' | null>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (articleToEdit) {
            setTitle(articleToEdit.title);
            setSlug(articleToEdit.slug);
            setContent(articleToEdit.content);
            setStatus(articleToEdit.status);
            setCategoryId(articleToEdit.categoryId || '');
        }
    }, [articleToEdit]);

    useEffect(() => {
        const catUnsub = onSnapshot(query(collection(db, 'testCategories'), orderBy('name')), snap => setCategories(snap.docs.map(d => ({id: d.id, ...d.data()} as Category))));
        const testUnsub = onSnapshot(query(collection(db, 'tests'), orderBy('title')), snap => setTests(snap.docs.map(d => ({id: d.id, ...d.data()} as Test))));
        return () => { catUnsub(); testUnsub(); };
    }, []);

    const handleSave = async () => {
        if (!title.trim() || !slug.trim()) { showMessage('Title and Slug are required.', true); return; }
        setIsSubmitting(true);
        const categoryName = categories.find(c => c.id === categoryId)?.name || '';
        const data = { title, slug, content, status, categoryId: categoryId || null, categoryName };
        try {
            if (articleToEdit) {
                await updateDoc(doc(db, 'updateArticles', articleToEdit.id), { ...data, updatedAt: serverTimestamp() });
                showMessage('Article updated!');
            } else {
                await addDoc(collection(db, 'updateArticles'), { ...data, createdAt: serverTimestamp() });
                showMessage('Article created!');
            }
            onSaveSuccess();
        } catch(e) { showMessage('Failed to save article.', true); }
        finally { setIsSubmitting(false); }
    };

    const insertEmbedCode = (type: 'test' | 'category', id: string, title: string) => {
        const code = `\n[EMBED type="${type}" id="${id}" title="${title}"]\n`;
        const textarea = contentRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = content.substring(0, start) + code + content.substring(end);
            setContent(newContent);
            textarea.focus();
        }
        setIsEmbedModalOpen(null);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{articleToEdit ? 'Edit Article' : 'New Article'}</h2>
                <button onClick={onCancel} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-sm rounded-lg hover:bg-gray-200"><ArrowLeft size={16} /> Back</button>
            </div>
            
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Article Title" className="w-full text-2xl font-bold p-2 border-b-2 focus:outline-none focus:border-indigo-500 dark:bg-gray-800"/>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))} placeholder="article-slug" className="w-full p-2 border rounded-lg dark:bg-gray-700"/>
            
            <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button onClick={() => setIsEmbedModalOpen('test')} className="px-3 py-1 bg-white dark:bg-gray-600 rounded text-sm font-semibold flex items-center gap-1"><FileText size={14}/> Embed Test</button>
                <button onClick={() => setIsEmbedModalOpen('category')} className="px-3 py-1 bg-white dark:bg-gray-600 rounded text-sm font-semibold flex items-center gap-1"><FolderKanban size={14}/> Embed Category</button>
            </div>
            <textarea ref={contentRef} value={content} onChange={e => setContent(e.target.value)} placeholder="Write your article here... You can use markdown and embed components." rows={15} className="w-full p-2 border rounded-lg dark:bg-gray-700 font-mono"></textarea>
            
            <div className="grid grid-cols-2 gap-4">
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"><option value="">No Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"><option value="draft">Draft</option><option value="published">Published</option></select>
            </div>
            
            <button onClick={handleSave} disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />} {articleToEdit ? 'Save Changes' : 'Save Article'}
            </button>

            {isEmbedModalOpen && <Modal isOpen={!!isEmbedModalOpen} onClose={() => setIsEmbedModalOpen(null)} title={`Embed ${isEmbedModalOpen}`}>
                <div className="max-h-[50vh] overflow-y-auto">
                    <ul className="space-y-1">
                        {(isEmbedModalOpen === 'test' ? tests : categories).map(item => (
                            <li key={item.id}><button onClick={() => insertEmbedCode(isEmbedModalOpen, item.id, item.name)} className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">{item.name || (item as Test).title}</button></li>
                        ))}
                    </ul>
                </div>
            </Modal>}
        </div>
    );
};

export default ManageUpdates;