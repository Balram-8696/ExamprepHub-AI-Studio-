import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../services/firebase';
import { UpdateArticle, Category, Test } from '../../../types';
import { showMessage } from '../../../utils/helpers';
import { GoogleGenAI } from '@google/genai';
import { PenSquare, PlusCircle, Trash2, Pencil, List, Loader2, Save, ArrowLeft, FileText, FolderKanban, Bold, Italic, Heading2, Heading3, List as ListIcon, ListOrdered, Link2, Wand2, ImageUp } from 'lucide-react';
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
            // Delete featured image from storage if it exists
            if (articleToDelete.featuredImageFileName) {
                const imageRef = ref(storage, `update_articles_featured_images/${articleToDelete.featuredImageFileName}`);
                await deleteObject(imageRef);
            }
            // Delete firestore document
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
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Article</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {articles.map(article => (
                                <tr key={article.id}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            {article.featuredImageUrl ? (
                                                <img src={article.featuredImageUrl} alt="" className="w-20 h-14 object-cover rounded-md flex-shrink-0" />
                                            ) : (
                                                <div className="w-20 h-14 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0">
                                                    <ImageUp className="text-gray-400" />
                                                </div>
                                            )}
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{article.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${article.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{article.status}</span></td>
                                    <td className="px-6 py-4 flex items-center gap-4">
                                        <button onClick={() => handleEdit(article)} className="text-indigo-600 hover:text-indigo-800" title="Edit"><Pencil size={18} /></button>
                                        <button onClick={() => setArticleToDelete(article)} className="text-red-600 hover:text-red-800" title="Delete"><Trash2 size={18} /></button>
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
const SimpleRichTextEditor: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    const handleInput = () => {
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const execCmd = (cmd: string, value?: string) => {
        document.execCommand(cmd, false, value);
        editorRef.current?.focus();
        handleInput();
    };
    
    const createLink = () => {
        const url = prompt("Enter the URL");
        if(url) execCmd('createLink', url);
    }
    
    const ToolbarButton: React.FC<{ onClick: () => void, children: React.ReactNode, title: string }> = ({ onClick, children, title }) => (
        <button type="button" title={title} onClick={onClick} onMouseDown={e => e.preventDefault()} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600">{children}</button>
    );

    return (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
            <div className="flex items-center gap-1 p-1 border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 rounded-t-lg">
                <ToolbarButton onClick={() => execCmd('bold')} title="Bold"><Bold size={16}/></ToolbarButton>
                <ToolbarButton onClick={() => execCmd('italic')} title="Italic"><Italic size={16}/></ToolbarButton>
                <ToolbarButton onClick={() => execCmd('formatBlock', '<h2>')} title="Heading 2"><Heading2 size={16}/></ToolbarButton>
                <ToolbarButton onClick={() => execCmd('formatBlock', '<h3>')} title="Heading 3"><Heading3 size={16}/></ToolbarButton>
                <ToolbarButton onClick={() => execCmd('insertUnorderedList')} title="Unordered List"><ListIcon size={16}/></ToolbarButton>
                <ToolbarButton onClick={() => execCmd('insertOrderedList')} title="Ordered List"><ListOrdered size={16}/></ToolbarButton>
                <ToolbarButton onClick={createLink} title="Add Link"><Link2 size={16}/></ToolbarButton>
            </div>
            <div
                ref={editorRef}
                onInput={handleInput}
                contentEditable
                className="prose prose-sm dark:prose-invert max-w-none min-h-[250px] w-full p-3 focus:outline-none"
            />
        </div>
    );
};

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
    const [publishAt, setPublishAt] = useState<Date>(new Date());
    const [categoryId, setCategoryId] = useState('');
    const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    
    const [categories, setCategories] = useState<Category[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEmbedModalOpen, setIsEmbedModalOpen] = useState<'test' | 'category' | null>(null);
    
    const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
    const [aiAction, setAiAction] = useState<'generate' | 'proofread' | 'title' | null>(null);

    useEffect(() => {
        if (articleToEdit) {
            setTitle(articleToEdit.title);
            setSlug(articleToEdit.slug);
            setContent(articleToEdit.content);
            setStatus(articleToEdit.status);
            setCategoryId(articleToEdit.categoryId || '');
            setFeaturedImageUrl(articleToEdit.featuredImageUrl || null);
            setPublishAt(articleToEdit.publishAt ? articleToEdit.publishAt.toDate() : new Date());
        } else {
            setTitle('');
            setSlug('');
            setContent('');
            setStatus('draft');
            setCategoryId('');
            setFeaturedImageUrl(null);
            setImageFile(null);
            setPublishAt(new Date());
        }
    }, [articleToEdit]);

    useEffect(() => {
        const catUnsub = onSnapshot(query(collection(db, 'testCategories'), orderBy('name')), snap => setCategories(snap.docs.map(d => ({id: d.id, ...d.data()} as Category))));
        const testUnsub = onSnapshot(query(collection(db, 'tests'), orderBy('title')), snap => setTests(snap.docs.map(d => ({id: d.id, ...d.data()} as Test))));
        return () => { catUnsub(); testUnsub(); };
    }, []);

    const handleAiAction = async (action: 'generate' | 'proofread' | 'title') => {
        setIsAiLoading(true);
        setAiAction(action);
        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});
            let prompt = '';
            let currentContent = content;

            switch(action) {
                case 'generate':
                    const topic = window.prompt("Enter a topic for the article:");
                    if(!topic) { setIsAiLoading(false); return; }
                    prompt = `Write an article about "${topic}" for an exam preparation website. The content should be informative and easy to understand. Format the output as clean HTML, using <h2> for headings, <p> for paragraphs, and <ul> or <ol> for lists where appropriate. Return only the HTML content.`;
                    break;
                case 'proofread':
                    if(!currentContent.trim()) { showMessage("Content is empty.", true); setIsAiLoading(false); return; }
                    prompt = `Proofread and correct grammar and spelling mistakes in the following HTML content. Maintain the HTML structure. Return only the corrected HTML content.\n\n${currentContent}`;
                    break;
                case 'title':
                    if(!currentContent.trim()) { showMessage("Content is empty.", true); setIsAiLoading(false); return; }
                    prompt = `Suggest a short, engaging, SEO-friendly title (under 10 words) for the following article content: ${currentContent.replace(/<[^>]*>/g, ' ')}. Return only the title text, with no quotes or extra formatting.`;
                    break;
            }

            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
            const resultText = response.text;

            if (action === 'title') {
                setTitle(resultText);
            } else {
                setContent(resultText);
            }
        } catch (e) {
            showMessage("AI operation failed. Please try again.", true);
            console.error(e);
        } finally {
            setIsAiLoading(false);
            setAiAction(null);
        }
    };
    
    const handleSave = async () => {
        if (!title.trim() || !slug.trim()) { showMessage('Title and Slug are required.', true); return; }
        setIsSubmitting(true);

        const categoryName = categories.find(c => c.id === categoryId)?.name || '';
        // FIX: Added 'publishAt' field to the data object to satisfy the UpdateArticle type.
        const data: Omit<UpdateArticle, 'id' | 'createdAt' | 'updatedAt'> & { updatedAt?: any } = { 
            title, slug, content, status, 
            categoryId: categoryId || null, categoryName,
            publishAt: Timestamp.fromDate(publishAt),
            featuredImageUrl: featuredImageUrl,
            featuredImageFileName: articleToEdit?.featuredImageFileName || null,
        };

        try {
            // Handle image upload/delete
            if (imageFile) { // New image uploaded
                if (articleToEdit?.featuredImageFileName) { // Delete old one
                    await deleteObject(ref(storage, `update_articles_featured_images/${articleToEdit.featuredImageFileName}`));
                }
                const fileName = `${Date.now()}-${imageFile.name}`;
                const imageRef = ref(storage, `update_articles_featured_images/${fileName}`);
                const snapshot = await uploadBytes(imageRef, imageFile);
                data.featuredImageUrl = await getDownloadURL(snapshot.ref);
                data.featuredImageFileName = fileName;

            } else if (!featuredImageUrl && articleToEdit?.featuredImageFileName) { // Image removed
                 await deleteObject(ref(storage, `update_articles_featured_images/${articleToEdit.featuredImageFileName}`));
                 data.featuredImageUrl = null;
                 data.featuredImageFileName = null;
            }

            if (articleToEdit) {
                await updateDoc(doc(db, 'updateArticles', articleToEdit.id), { ...data, updatedAt: serverTimestamp() });
                showMessage('Article updated!');
            } else {
                await addDoc(collection(db, 'updateArticles'), { ...data, createdAt: serverTimestamp() });
                showMessage('Article created!');
            }
            onSaveSuccess();
        } catch(e) { showMessage('Failed to save article.', true); console.error(e); }
        finally { setIsSubmitting(false); }
    };

    const insertEmbedCode = (type: 'test' | 'category', id: string, itemTitle: string) => {
        const code = `\n<p>[EMBED type="${type}" id="${id}" title="${itemTitle}"]</p>\n`;
        setContent(prev => prev + code);
        setIsEmbedModalOpen(null);
    };

    const formatDateForInput = (date: Date) => {
        if (!date) return '';
        const local = new Date(date);
        local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
        return local.toISOString().slice(0, 16);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">{articleToEdit ? 'Edit Article' : 'New Article'}</h2><button onClick={onCancel} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"><ArrowLeft size={16} /> Back</button></div>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Article Title (H1)" className="w-full text-2xl font-bold p-2 border-b-2 focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-600"/>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))} placeholder="article-slug" className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700"/>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">EDITOR TOOLS:</span>
                <button onClick={() => setIsEmbedModalOpen('test')} className="px-3 py-1 bg-white dark:bg-gray-600 rounded text-sm font-semibold flex items-center gap-1"><FileText size={14}/> Embed Test</button>
                <button onClick={() => setIsEmbedModalOpen('category')} className="px-3 py-1 bg-white dark:bg-gray-600 rounded text-sm font-semibold flex items-center gap-1"><FolderKanban size={14}/> Embed Category</button>
                <div className="flex-grow"></div>
                <button onClick={() => handleAiAction('generate')} disabled={isAiLoading} className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm font-semibold flex items-center gap-1">{isAiLoading && aiAction==='generate' ? <Loader2 className="animate-spin" size={14}/> : <Wand2 size={14}/>} Generate Content</button>
                <button onClick={() => handleAiAction('title')} disabled={isAiLoading} className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm font-semibold flex items-center gap-1">{isAiLoading && aiAction==='title' ? <Loader2 className="animate-spin" size={14}/> : <Wand2 size={14}/>} Suggest Title</button>
                <button onClick={() => handleAiAction('proofread')} disabled={isAiLoading} className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm font-semibold flex items-center gap-1">{isAiLoading && aiAction==='proofread' ? <Loader2 className="animate-spin" size={14}/> : <Wand2 size={14}/>} Proofread</button>
            </div>
            <SimpleRichTextEditor value={content} onChange={setContent} />
            <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Featured Image</label>
                <div className="mt-1 flex items-center gap-4 p-2 border dark:border-gray-600 rounded-lg">
                    {(imageFile || featuredImageUrl) ? <img src={imageFile ? URL.createObjectURL(imageFile) : featuredImageUrl!} alt="preview" className="w-24 h-16 object-cover rounded"/> : <div className="w-24 h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center"><ImageUp className="text-gray-400"/></div>}
                    <input id="img-upload" type="file" onChange={e => { setImageFile(e.target.files?.[0] || null); if(e.target.files?.[0]) setFeaturedImageUrl(null); }} accept="image/*" className="hidden"/>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="img-upload" className="px-3 py-1.5 bg-white dark:bg-gray-600 border dark:border-gray-500 rounded-md text-sm font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-500">Choose File</label>
                        {(imageFile || featuredImageUrl) && <button type="button" onClick={() => { setImageFile(null); setFeaturedImageUrl(null); }} className="text-red-600 text-xs font-semibold text-left">Remove Image</button>}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category</label>
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"><option value="">No Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"><option value="draft">Draft</option><option value="published">Published</option></select>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Publish Date</label>
                    <input type="datetime-local" value={formatDateForInput(publishAt)} onChange={e => setPublishAt(new Date(e.target.value))} className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
                </div>
            </div>
            <button onClick={handleSave} disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />} {articleToEdit ? 'Save Changes' : 'Save Article'}
            </button>
            {isEmbedModalOpen && <Modal isOpen={!!isEmbedModalOpen} onClose={() => setIsEmbedModalOpen(null)} title={`Embed ${isEmbedModalOpen}`}>
                <div className="max-h-[50vh] overflow-y-auto"><ul className="space-y-1">
                    {(isEmbedModalOpen === 'test' ? tests : categories).map(item => (
                        <li key={item.id}><button onClick={() => insertEmbedCode(isEmbedModalOpen, item.id, (item as Test).title || item.name)} className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">{(item as Test).title || item.name}</button></li>
                    ))}
                </ul></div>
            </Modal>}
        </div>
    );
};

export default ManageUpdates;