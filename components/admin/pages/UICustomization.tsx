import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { showMessage } from '../../../utils/helpers';
import { CustomPage, FooterLink } from '../../../types';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Palette, Link, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import SkeletonList from '../../skeletons/SkeletonList';

const UICustomization: React.FC = () => {
    const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
    const [customPages, setCustomPages] = useState<CustomPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state for adding a new link
    const [newLinkLabel, setNewLinkLabel] = useState('');
    const [newLinkType, setNewLinkType] = useState<'internal' | 'custom'>('internal');
    const [newLinkPath, setNewLinkPath] = useState('home');
    
    const internalPages = [
        { label: 'Home', path: 'home' },
        { label: 'My Results', path: 'history' },
        { label: 'About Us', path: 'about' },
        { label: 'Contact Us', path: 'contact' },
        { label: 'Privacy Policy', path: 'privacy' },
    ];

    useEffect(() => {
        const footerConfigRef = doc(db, 'uiSettings', 'footer');
        const unsubscribeFooter = onSnapshot(footerConfigRef, (doc) => {
            if (doc.exists()) {
                setFooterLinks(doc.data().links || []);
            }
            setLoading(false);
        });

        const q = query(collection(db, 'customPages'), where("status", "==", "published"), orderBy('title'));
        const unsubscribePages = onSnapshot(q, (snapshot) => {
            const pagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomPage));
            setCustomPages(pagesData);
        });
        
        return () => {
            unsubscribeFooter();
            unsubscribePages();
        };
    }, []);

    const handleAddLink = () => {
        if (!newLinkLabel.trim() || !newLinkPath.trim()) {
            showMessage('Please provide a label and select a page.', true);
            return;
        }
        const newLinks = [...footerLinks, { label: newLinkLabel, path: newLinkPath }];
        setFooterLinks(newLinks);
        setNewLinkLabel('');
    };

    const handleRemoveLink = (index: number) => {
        const newLinks = footerLinks.filter((_, i) => i !== index);
        setFooterLinks(newLinks);
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const footerConfigRef = doc(db, 'uiSettings', 'footer');
            await setDoc(footerConfigRef, { links: footerLinks });
            showMessage('Footer settings saved successfully!');
        } catch (error) {
            console.error(error);
            showMessage('Failed to save settings.', true);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3"><Palette /> UI Customization</h2>
                <p className="text-gray-600">Modify the links that appear in the website's footer.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Manage Footer Links</h3>
                
                {loading ? <SkeletonList items={4} /> : (
                    <div className="space-y-3 mb-8">
                        {footerLinks.map((link, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <Link className="text-gray-400" size={16}/>
                                    <span className="font-medium">{link.label}</span>
                                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{link.path}</span>
                                </div>
                                <button onClick={() => handleRemoveLink(index)} className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-100">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}
                         {footerLinks.length === 0 && <p className="text-gray-500 italic">No footer links configured.</p>}
                    </div>
                )}
               
                <div className="border-t pt-6">
                    <h4 className="font-semibold text-lg mb-3">Add New Link</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium mb-1">Link Label</label>
                            <input type="text" value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)} placeholder="e.g., FAQ" className="w-full p-2 border border-gray-300 rounded-lg" />
                        </div>
                         <div className="md:col-span-1">
                            <label className="block text-sm font-medium mb-1">Link Type</label>
                            <select value={newLinkType} onChange={e => { setNewLinkType(e.target.value as any); setNewLinkPath(''); }} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                                <option value="internal">Internal Page</option>
                                <option value="custom">Custom Page</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                             <label className="block text-sm font-medium mb-1">Destination</label>
                             <select value={newLinkPath} onChange={e => setNewLinkPath(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                                <option value="" disabled>Select a page</option>
                                {newLinkType === 'internal' ? (
                                    internalPages.map(p => <option key={p.path} value={p.path}>{p.label}</option>)
                                ) : (
                                    customPages.map(p => <option key={p.id} value={p.slug}>{p.title}</option>)
                                )}
                             </select>
                        </div>
                        <div className="md:col-span-1">
                            <button onClick={handleAddLink} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-200">
                                <PlusCircle size={18}/> Add Link
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t pt-6 text-right">
                    <button onClick={handleSaveChanges} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center justify-center gap-2 ml-auto">
                        {isSaving && <Loader2 className="animate-spin" size={20}/>}
                        {isSaving ? 'Saving...' : 'Save Footer Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UICustomization;