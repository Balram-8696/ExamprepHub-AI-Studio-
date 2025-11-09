import React, { useState, useContext } from 'react';
import { ArrowLeft, KeyRound, Sun, Moon, Loader2, Bell, Shield, Trash2 } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { updatePassword } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { showMessage } from '../../utils/helpers';
import { AuthContext } from '../../App';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import ConfirmModal from '../modals/ConfirmModal';

interface SettingsPageProps {
    onBack: () => void;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" disabled={disabled} />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
    </label>
);

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
    const { theme, toggleTheme } = useTheme();
    const { user, userProfile } = useContext(AuthContext);
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState('');
    const [loadingPassword, setLoadingPassword] = useState(false);

    const [notificationSettings, setNotificationSettings] = useState(userProfile?.notificationSettings ?? { newContent: true, adminReplies: true });
    const [isSavingNotifications, setIsSavingNotifications] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeletingData, setIsDeletingData] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword.length < 6) {
            setError("Password should be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!auth.currentUser) {
            setError("No user is signed in.");
            return;
        }
        setLoadingPassword(true);
        setError('');
        try {
            await updatePassword(auth.currentUser, newPassword);
            showMessage('Password updated successfully.');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err: any) {
            let message = err.message || "An unknown error occurred.";
            if (message.includes('auth/requires-recent-login')) {
                message = "This is a sensitive operation. Please sign out and sign in again before changing your password.";
            }
            setError(message);
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleToggleNotification = async (key: 'newContent' | 'adminReplies') => {
        if (!user) return;
        
        const newSettings = {
            ...notificationSettings,
            [key]: !notificationSettings[key],
        };
        setNotificationSettings(newSettings);
        setIsSavingNotifications(true);
        
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { notificationSettings: newSettings });
            showMessage('Notification settings updated.');
        } catch (error) {
            showMessage('Failed to update settings.', true);
            setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] })); // Revert on error
        } finally {
            setIsSavingNotifications(false);
        }
    };

    const confirmDeleteAllData = async () => {
        if (!user) return;
        setIsDeletingData(true);
        try {
            const resultsQuery = query(collection(db, 'results'), where('userId', '==', user.uid));
            const querySnapshot = await getDocs(resultsQuery);
            
            if (querySnapshot.empty) {
                showMessage("No test data found to delete.");
                setIsDeleteModalOpen(false);
                setIsDeletingData(false);
                return;
            }
    
            const batch = writeBatch(db);
            querySnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
    
            localStorage.removeItem(`inProgressTest_${user.uid}`);
            
            showMessage("All your test data has been successfully deleted.");
        } catch (error) {
            showMessage("An error occurred while deleting your data.", true);
            console.error(error);
        } finally {
            setIsDeleteModalOpen(false);
            setIsDeletingData(false);
        }
    };


    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-full animate-fade-in">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-8">
                    <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 shadow-sm">
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>
                
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8">Settings</h1>

                <div className="space-y-8">
                    {/* Appearance Settings */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Appearance</h2>
                        <div className="flex justify-between items-center">
                            <p className="text-gray-600 dark:text-gray-300">Theme</p>
                            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <button onClick={toggleTheme} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${theme === 'light' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
                                    <Sun size={16} /> Light
                                </button>
                                 <button onClick={toggleTheme} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${theme === 'dark' ? 'bg-gray-800 shadow text-white' : 'text-gray-500'}`}>
                                    <Moon size={16} /> Dark
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2"><Bell /> Notification Settings</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-700 dark:text-gray-200">New Tests and Content</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications when new tests are added.</p>
                                </div>
                                <ToggleSwitch checked={notificationSettings.newContent ?? true} onChange={() => handleToggleNotification('newContent')} disabled={isSavingNotifications} />
                            </div>
                            <div className="flex justify-between items-center">
                                 <div>
                                    <p className="font-medium text-gray-700 dark:text-gray-200">Admin Replies</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when an admin replies to your reports.</p>
                                </div>
                                <ToggleSwitch checked={notificationSettings.adminReplies ?? true} onChange={() => handleToggleNotification('adminReplies')} disabled={isSavingNotifications} />
                            </div>
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Security</h2>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Change Password</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">New Password</label>
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Confirm New Password</label>
                                <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500" required />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div className="text-right">
                                <button type="submit" disabled={loadingPassword} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2 ml-auto shadow-sm">
                                    {loadingPassword ? <Loader2 className="animate-spin" /> : <KeyRound size={16}/>}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Data & Privacy Settings */}
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-red-200 dark:border-red-900/50">
                        <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-4 flex items-center gap-2"><Shield /> Data & Privacy</h2>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-700 dark:text-gray-200">Delete All My Test Data</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete all of your results and performance history.</p>
                            </div>
                             <button onClick={() => setIsDeleteModalOpen(true)} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-red-400 flex items-center gap-2 shadow-sm">
                                <Trash2 size={16}/> Delete Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteAllData}
                title="Confirm Data Deletion"
                message="Are you absolutely sure? This will permanently erase all your test results, scores, and performance analytics. This action cannot be undone."
                confirmText={isDeletingData ? "Deleting..." : "Yes, Delete Everything"}
            />
        </div>
    );
};

export default SettingsPage;
