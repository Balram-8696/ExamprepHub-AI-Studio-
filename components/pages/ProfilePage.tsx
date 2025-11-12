import React, { useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { updateProfile, updatePassword } from 'firebase/auth';
import { db, auth } from '../../services/firebase';
import { AuthContext } from '../../App';
import { UserResult } from '../../types';
import { showMessage } from '../../utils/helpers';
import { User, Inbox, Award, TrendingUp, BookOpen, Save, Loader2, CheckCircle, XCircle, Target, Shield, KeyRound as KeyRoundIcon } from 'lucide-react';
import SkeletonProfile from '../skeletons/SkeletonProfile';

interface ProfilePageProps { }

const ProfilePage: React.FC<ProfilePageProps> = () => {
    const { user, userProfile } = useContext(AuthContext);
    const [results, setResults] = useState<UserResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state for profile details
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    
    // State for password change form
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loadingPassword, setLoadingPassword] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || '');
            setMobile(userProfile.mobileNumber || '');
        }
    }, [userProfile]);

    useEffect(() => {
        if (user) {
            setLoading(true);
            const q = query(collection(db, 'results'), where("userId", "==", user.uid), orderBy('submittedAt', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const resultsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserResult));
                setResults(resultsData);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching results:", error);
                showMessage("Failed to load your profile data.", true);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setResults([]);
            setLoading(false);
        }
    }, [user]);

    const handleSaveDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { name: name, mobileNumber: mobile });

            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: name });
            }
            
            showMessage('Profile details updated successfully!');
        } catch (error) {
            console.error(error);
            showMessage('Failed to update profile.', true);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword.length < 6) {
            setPasswordError("Password should be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPasswordError("Passwords do not match.");
            return;
        }
        if (!auth.currentUser) {
            setPasswordError("No user is signed in.");
            return;
        }
        setLoadingPassword(true);
        setPasswordError('');
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
            setPasswordError(message);
        } finally {
            setLoadingPassword(false);
        }
    };

    const stats = React.useMemo(() => {
        const totalTests = results.length;
        if (totalTests === 0) return { totalTests: 0, averageScore: 0, highestScore: 0, totalCorrect: 0, totalIncorrect: 0 };

        const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / totalTests;
        const highestScore = Math.max(...results.map(r => r.percentage));
        const totalCorrect = results.reduce((sum, r) => sum + r.correctCount, 0);
        const totalIncorrect = results.reduce((sum, r) => sum + r.incorrectCount, 0);
        
        return { totalTests, averageScore, highestScore, totalCorrect, totalIncorrect };
    }, [results]);

    if (loading) {
        return <SkeletonProfile />;
    }
    
    if (!user || !userProfile) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
                 <div className="bg-white dark:bg-gray-800 p-10 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Please Log In</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">Log in to view your profile and performance statistics.</p>
                </div>
            </div>
        );
    }
    
    const userInitial = userProfile.name.charAt(0).toUpperCase();

    const StatItem: React.FC<{ icon: React.ElementType, value: string | number, label: string, colorClass: string }> = ({ icon: Icon, value, label, colorClass }) => (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-gray-800 rounded-lg">
            <Icon className={`w-8 h-8 mb-2 ${colorClass}`} />
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{label}</p>
        </div>
    );

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="space-y-8">
                     {results.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                            <Inbox className="w-16 h-16 text-gray-400 mx-auto" />
                            <h3 className="text-xl font-semibold mt-4 text-gray-800 dark:text-gray-100">No Data Yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Complete some tests to see your performance statistics here.</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <TrendingUp /> Performance Overview
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <StatItem icon={BookOpen} value={stats.totalTests} label="Tests Taken" colorClass="text-blue-500" />
                                <StatItem icon={Target} value={`${stats.averageScore.toFixed(1)}%`} label="Average Score" colorClass="text-indigo-500" />
                                <StatItem icon={Award} value={`${stats.highestScore.toFixed(1)}%`} label="Highest Score" colorClass="text-amber-500" />
                                <StatItem icon={CheckCircle} value={stats.totalCorrect} label="Correct Answers" colorClass="text-green-500" />
                                <StatItem icon={XCircle} value={stats.totalIncorrect} label="Incorrect Answers" colorClass="text-red-500" />
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Profile Details Card */}
                        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                             <div className="text-center mb-6">
                                <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-300">{userInitial}</span>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{userProfile.name}</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{userProfile.email}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Member since {userProfile.createdAt && typeof userProfile.createdAt.toDate === 'function' ? (userProfile.createdAt as Timestamp).toDate().toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <form onSubmit={handleSaveDetails} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                                </div>
                                <div>
                                    <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
                                    <input type="tel" id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="e.g., +1 234 567 890"/>
                                </div>
                                <button type="submit" disabled={isSaving} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                                    {isSaving ? <Loader2 className="animate-spin"/> : <><Save size={18} className="mr-2"/> Save Details</>}
                                </button>
                            </form>
                        </div>
                        
                        {/* Security Card */}
                        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                             <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2"><Shield /> Security</h2>
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
                                {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                                <div className="text-right">
                                    <button type="submit" disabled={loadingPassword} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2 ml-auto shadow-sm">
                                        {loadingPassword ? <Loader2 className="animate-spin" /> : <KeyRoundIcon size={16}/>}
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
