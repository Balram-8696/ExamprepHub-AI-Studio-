import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../services/firebase';
import { UpdateArticle, Category, Test, ArticleBlock } from '../../../types';
import { showMessage } from '../../../utils/helpers';
import { PenSquare, PlusCircle, Trash2, Pencil, List, Loader2, Save, ArrowLeft, ImageUp, Wand2, Heading2, Heading3, Pilcrow, List as ListIcon, ListOrdered, Quote, Code, FileText, FolderKanban, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import ConfirmModal from '../../modals/ConfirmModal';
import Modal from '../../modals/Modal';
import SkeletonTable from '../../skeletons/SkeletonTable';

// Main component orchestrating list and editor views
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
            if (articleToDelete.featuredImageFileName) {
                const imageRef = ref(storage, `update_articles_featured_images/${articleToDelete.featuredImageFileName}`);
                await deleteObject(imageRef);
            }
            // Also delete images from blocks
            if (articleToDelete.blocks && Array.isArray(articleToDelete.blocks)) {
                for (const block of articleToDelete.blocks) {
                    if (block.type === 'image' && block.fileName) {
                         const blockImageRef = ref(storage, `update_articles_images/${block.fileName}`);
                         await deleteObject(blockImageRef);
                    }
                }
            }
            await deleteDoc(doc(db, 'updateArticles', articleToDelete.id));
            showMessage('Article deleted successfully!');
        } catch (error) {
            showMessage('Failed to delete article.', true);
            console.error(error);
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
             {articleToDelete && <ConfirmModal isOpen={!!articleToDelete} onClose={() => setArticleToDelete(null)} onConfirm={handleDelete} title="Delete Article" message={`Delete "${articleToDelete.title}"? This will also delete any images associated with it.`} />}
        </div>
    );
};

// Block-based Editor Component
interface UpdateEditorProps {
    articleToEdit: UpdateArticle | null;
    onSaveSuccess: () => void;
    onCancel: () => void;
}
const UpdateEditor: React.FC<UpdateEditorProps> = ({ articleToEdit, onSaveSuccess, onCancel }) => {
    // Metadata State
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [publishAt, setPublishAt] = useState<Date>(new Date());
    const [categoryId, setCategoryId] = useState('');
    const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [authorName, setAuthorName] = useState('');
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');

    // Content State
    const [blocks, setBlocks] = useState<ArticleBlock[]>([]);
    
    // Helper State
    const [categories, setCategories] = useState<Category[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEmbedModalOpen, setIsEmbedModalOpen] = useState<'test' | 'category' | null>(null);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    
    useEffect(() => {
        if (articleToEdit) {
            setTitle(articleToEdit.title);
            setSlug(articleToEdit.slug);
            setStatus(articleToEdit.status);
            setCategoryId(articleToEdit.categoryId || '');
            setFeaturedImageUrl(articleToEdit.featuredImageUrl || null);
            setPublishAt(articleToEdit.publishAt ? articleToEdit.publishAt.toDate() : new Date());
            setAuthorName(articleToEdit.authorName || '');
            setMetaTitle(articleToEdit.metaTitle || '');
            setMetaDescription(articleToEdit.metaDescription || '');

            // Backward compatibility: if `blocks` is missing but `content` exists, convert it.
            if (Array.isArray(articleToEdit.blocks) && articleToEdit.blocks.length > 0) {
                 setBlocks(articleToEdit.blocks);
            } else if ((articleToEdit as any).content) {
                 setBlocks([{ id: `block-${Date.now()}`, type: 'paragraph', content: (articleToEdit as any).content }]);
            } else {
                 setBlocks([]);
            }

        } else { // New Article
            setTitle(''); setSlug(''); setStatus('draft'); setCategoryId('');
            setFeaturedImageUrl(null); setImageFile(null); setPublishAt(new Date());
            setAuthorName(''); setMetaTitle(''); setMetaDescription('');
            setBlocks([]);
        }
    }, [articleToEdit]);

    useEffect(() => {
        const catUnsub = onSnapshot(query(collection(db, 'testCategories'), orderBy('name')), snap => setCategories(snap.docs.map(d => ({id: d.id, ...d.data()} as Category))));
        const testUnsub = onSnapshot(query(collection(db, 'tests'), orderBy('title')), snap => setTests(snap.docs.map(d => ({id: d.id, ...d.data()} as Test))));
        return () => { catUnsub(); testUnsub(); };
    }, []);

    const addBlock = (type: ArticleBlock['type']) => {
        const newId = `block-${Date.now()}`;
        let newBlock: ArticleBlock;
        switch(type) {
            case 'h2': newBlock = { id: newId, type, content: '' }; break;
            case 'h3': newBlock = { id: newId, type, content: '' }; break;
            case 'paragraph': newBlock = { id: newId, type, content: '' }; break;
            case 'image': newBlock = { id: newId, type, src: '', caption: '', fileName: '' }; break;
            case 'list': newBlock = { id: newId, type, items: [''], ordered: false }; break;
            case 'quote': newBlock = { id: newId, type, content: '', author: '' }; break;
            case 'test_embed': setIsEmbedModalOpen('test'); return;
            case 'category_embed': setIsEmbedModalOpen('category'); return;
            default: return;
        }
        setBlocks(b => [...b, newBlock]);
    };

    const updateBlock = (id: string, newContent: Partial<ArticleBlock>) => {
        setBlocks(blocks => blocks.map(b => b.id === id ? { ...b, ...newContent } : b));
    };

    const removeBlock = (id: string) => setBlocks(blocks => blocks.filter(b => b.id !== id));
    
    const handleSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        let _blocks = [...blocks];
        const draggedItemContent = _blocks.splice(dragItem.current, 1)[0];
        _blocks.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setBlocks(_blocks);
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        // Deep copy to handle async image uploads without modifying state directly
        let blocksToSave = JSON.parse(JSON.stringify(blocks));

        try {
            // Upload images in blocks
            for (let i = 0; i < blocksToSave.length; i++) {
                if (blocksToSave[i].type === 'image' && blocksToSave[i].src.startsWith('data:')) {
                    const block = blocksToSave[i];
                    const res = await fetch(block.src);
                    const blob = await res.blob();
                    const fileName = `${Date.now()}-${block.id}.jpg`;
                    const imageRef = ref(storage, `update_articles_images/${fileName}`);
                    const snapshot = await uploadBytes(imageRef, blob);
                    block.src = await getDownloadURL(snapshot.ref);
                    block.fileName = fileName;
                }
            }

            const categoryName = categories.find(c => c.id === categoryId)?.name || '';
            const data = { 
                title, slug, blocks: blocksToSave, status, 
                categoryId: categoryId || null, categoryName,
                publishAt: Timestamp.fromDate(publishAt),
                featuredImageUrl, authorName, metaTitle, metaDescription,
                featuredImageFileName: articleToEdit?.featuredImageFileName || null,
            };

            if (imageFile) {
                if (articleToEdit?.featuredImageFileName) await deleteObject(ref(storage, `update_articles_featured_images/${articleToEdit.featuredImageFileName}`));
                const fileName = `${Date.now()}-${imageFile.name}`;
                const imageRef = ref(storage, `update_articles_featured_images/${fileName}`);
                const snapshot = await uploadBytes(imageRef, imageFile);
                data.featuredImageUrl = await getDownloadURL(snapshot.ref);
                data.featuredImageFileName = fileName;
            } else if (!featuredImageUrl && articleToEdit?.featuredImageFileName) {
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
    
    const formatDateForInput = (date: Date) => {
        if (!date) return '';
        const local = new Date(date);
        local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
        return local.toISOString().slice(0, 16);
    };

    return (
        <div className="flex gap-6 items-start">
            {/* Main Editor */}
            <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
                 <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">{articleToEdit ? 'Edit Article' : 'New Article'}</h2><button onClick={onCancel} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"><ArrowLeft size={16} /> Back</button></div>
                 <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Article Title (H1)" className="w-full text-2xl font-bold p-2 border-b-2 focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-600"/>
                 
                 {/* Block Editor Area */}
                 <div className="space-y-4 min-h-[400px]">
                     {blocks.map((block, index) => (
                         <div key={block.id} draggable onDragStart={() => dragItem.current = index} onDragEnter={() => dragOverItem.current = index} onDragEnd={handleSort} onDragOver={e => e.preventDefault()}
                             className="flex items-start gap-2 group p-2 -ml-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                             <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <GripVertical className="cursor-grab text-gray-400" />
                                <button onClick={() => removeBlock(block.id)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><Trash2 size={16}/></button>
                             </div>
                             <div className="flex-1">
                                 <BlockInput block={block} updateBlock={updateBlock} />
                             </div>
                         </div>
                     ))}
                 </div>

                <AddBlockToolbar onAddBlock={addBlock} />
            </div>

            {/* Sidebar */}
            <div className="w-80 flex-shrink-0 space-y-4 sticky top-20">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg space-y-3">
                    <h3 className="font-bold border-b pb-2 mb-2">Publish Settings</h3>
                    <div>
                        <label className="text-sm font-medium">Slug</label>
                        <input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))} className="w-full p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 mt-1"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 mt-1"><option value="draft">Draft</option><option value="published">Published</option></select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Publish Date</label>
                        <input type="datetime-local" value={formatDateForInput(publishAt)} onChange={e => setPublishAt(new Date(e.target.value))} className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 mt-1" />
                    </div>
                    <button onClick={handleSave} disabled={isSubmitting} className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />} {articleToEdit ? 'Save Changes' : 'Save Article'}
                    </button>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg space-y-3">
                    <h3 className="font-bold border-b pb-2 mb-2">Details & SEO</h3>
                     <div>
                        <label className="text-sm font-medium">Author Name</label>
                        <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} className="w-full p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 mt-1"/>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Meta Title</label>
                        <input type="text" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} className="w-full p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 mt-1"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Meta Description</label>
                        <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={3} className="w-full p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 mt-1"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Category</label>
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 mt-1"><option value="">No Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Featured Image</label>
                        {(imageFile || featuredImageUrl) ? <img src={imageFile ? URL.createObjectURL(imageFile) : featuredImageUrl!} alt="preview" className="w-full h-32 object-cover rounded my-2"/> : <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded my-2 flex items-center justify-center"><ImageUp className="text-gray-400"/></div>}
                        <input id="img-upload" type="file" onChange={e => { setImageFile(e.target.files?.[0] || null); if(e.target.files?.[0]) setFeaturedImageUrl(null); }} accept="image/*" className="hidden"/>
                        <div className="flex gap-2">
                            <label htmlFor="img-upload" className="flex-1 text-center px-3 py-1.5 bg-white dark:bg-gray-600 border dark:border-gray-500 rounded-md text-sm font-semibold cursor-pointer">Choose File</label>
                            {(imageFile || featuredImageUrl) && <button type="button" onClick={() => { setImageFile(null); setFeaturedImageUrl(null); }} className="px-3 py-1.5 text-red-600 text-sm font-semibold">Remove</button>}
                        </div>
                    </div>
                </div>
            </div>

            {isEmbedModalOpen && <Modal isOpen={!!isEmbedModalOpen} onClose={() => setIsEmbedModalOpen(null)} title={`Embed ${isEmbedModalOpen}`}>
                <div className="max-h-[50vh] overflow-y-auto"><ul className="space-y-1">
                    {(isEmbedModalOpen === 'test' ? tests : categories).map(item => (
                        <li key={item.id}><button onClick={() => {
                             const newId = `block-${Date.now()}`;
                             const newBlock: ArticleBlock = isEmbedModalOpen === 'test' 
                                 ? { id: newId, type: 'test_embed', testId: item.id }
                                 : { id: newId, type: 'category_embed', categoryId: item.id };
                             setBlocks(b => [...b, newBlock]);
                             setIsEmbedModalOpen(null);
                        }} className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">{(item as Test).title || item.name}</button></li>
                    ))}
                </ul></div>
            </Modal>}
        </div>
    );
};

// Toolbar for adding new blocks
const AddBlockToolbar: React.FC<{ onAddBlock: (type: ArticleBlock['type']) => void }> = ({ onAddBlock }) => {
    const tools = [
        { type: 'h2', icon: Heading2, label: 'H2' }, { type: 'h3', icon: Heading3, label: 'H3' },
        { type: 'paragraph', icon: Pilcrow, label: 'Text' }, { type: 'list', icon: ListIcon, label: 'List' },
        { type: 'quote', icon: Quote, label: 'Quote' }, { type: 'image', icon: ImageUp, label: 'Image' },
        { type: 'test_embed', icon: FileText, label: 'Test' }, { type: 'category_embed', icon: FolderKanban, label: 'Category' },
    ];
    return (
        <div className="p-2 border-t dark:border-gray-700 flex items-center justify-center gap-1">
            {tools.map(tool => (
                <button key={tool.type} onClick={() => onAddBlock(tool.type as ArticleBlock['type'])} title={`Add ${tool.label}`} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <tool.icon />
                </button>
            ))}
        </div>
    );
};

// Individual block input components
const BlockInput: React.FC<{ block: ArticleBlock; updateBlock: (id: string, content: Partial<ArticleBlock>) => void }> = ({ block, updateBlock }) => {
    const handleContentChange = (content: string) => updateBlock(block.id, { content });
    
    switch (block.type) {
        case 'h2': return <input type="text" value={block.content} onChange={e => handleContentChange(e.target.value)} placeholder="Heading 2" className="w-full text-2xl font-bold p-1 focus:outline-none bg-transparent"/>;
        case 'h3': return <input type="text" value={block.content} onChange={e => handleContentChange(e.target.value)} placeholder="Heading 3" className="w-full text-xl font-bold p-1 focus:outline-none bg-transparent"/>;
        case 'paragraph': return <div contentEditable suppressContentEditableWarning onBlur={e => handleContentChange(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{__html: block.content}} className="w-full p-1 focus:outline-none prose prose-sm dark:prose-invert max-w-none" />;
        case 'image':
            const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => updateBlock(block.id, { src: reader.result as string });
                    reader.readAsDataURL(file);
                }
            };
            return <div className="p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                {block.src ? <img src={block.src} alt={block.caption} className="w-full rounded-md mb-2" /> : <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center"><ImageUp className="text-gray-400"/></div>}
                <input type="file" onChange={handleImageUpload} accept="image/*" className="text-xs"/>
                <input type="text" value={block.caption} onChange={e => updateBlock(block.id, { caption: e.target.value })} placeholder="Caption (optional)" className="w-full text-sm p-1 mt-2 bg-transparent focus:outline-none border-b dark:border-gray-600"/>
            </div>;
        case 'list': 
            const handleItemChange = (index: number, value: string) => updateBlock(block.id, { items: block.items.map((it, i) => i === index ? value : it) });
            const addItem = () => updateBlock(block.id, { items: [...block.items, ''] });
            return <div>
                <button onClick={() => updateBlock(block.id, { ordered: !block.ordered })} className="text-xs font-semibold p-1">{block.ordered ? 'Ordered' : 'Unordered'}</button>
                {block.items.map((item, i) => <input key={i} value={item} onChange={e => handleItemChange(i, e.target.value)} className="w-full p-1 block bg-transparent" />)}
                <button onClick={addItem} className="text-xs">+ Add item</button>
            </div>;
        case 'quote': return <><input value={block.content} onChange={e => updateBlock(block.id, { content: e.target.value })} placeholder="Quote" className="w-full p-1 italic bg-transparent"/><input value={block.author} onChange={e => updateBlock(block.id, { author: e.target.value })} placeholder="Author" className="w-full p-1 text-sm bg-transparent"/></>;
        case 'test_embed': return <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg flex items-center gap-2 text-sm"><FileText size={16}/> Test Embed: {block.testId}</div>;
        case 'category_embed': return <div className="p-3 bg-green-50 dark:bg-green-900/40 rounded-lg flex items-center gap-2 text-sm"><FolderKanban size={16}/> Category Embed: {block.categoryId}</div>;
        default: return null;
    }
};

export default ManageUpdates;