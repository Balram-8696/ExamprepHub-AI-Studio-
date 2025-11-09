import React, { useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../../services/firebase';
import { AuthContext } from '../../App';
import { UserResult, Test } from '../../types';
import { showMessage } from '../../utils/helpers';
import { User, Inbox, Award, TrendingUp, BookOpen, ArrowLeft, Mail, Phone, Save, Loader2, KeyRound, CheckCircle, XCircle, Target, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SkeletonProfile from '../skeletons/SkeletonProfile';
import ChangePasswordModal from '../modals/ChangePasswordModal';


const RadialProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
            <circle cx="60" cy="60" r={radius} strokeWidth="10" className="stroke-gray-200" fill="transparent" />
            <circle
                cx="60"
                cy="60"
                r={radius}
                strokeWidth="10"
                className="stroke-current text-indigo-500"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
            />
            <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="transform rotate-90 origin-center text-2xl font-bold fill-current text-gray-700">
                {`${percentage.toFixed(1)}%`}
            </text>
        </svg>
    );
};

const StatCard: React.FC<{ icon: React.ElementType, label: string, value: string | number, color: string }> = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center gap-4 border border-gray-100 dark:border-gray-700">
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);


interface ProfilePageProps {
    onNavigate: (view: string) => void;
    onBack: () => void;
    onInitiateTestView: (details: { test: Test; action: 'result'; resultData?: UserResult }) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate, onBack, onInitiateTestView }) => {
    const { user, userProfile } = useContext(AuthContext);
    const [results, setResults] = useState<UserResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');

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
    
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { name: name, mobileNumber: mobile });

            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: name });
            }
            
            showMessage('Profile updated successfully!');
        } catch (error) {
            console.error(error);
            showMessage('Failed to update profile.', true);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleViewResult = async (result: UserResult) => {
        try {
            const testDocRef = doc(db, 'tests', result.testId);
            const testDoc = await getDoc(testDocRef);
            if (testDoc.exists()) {
                const fullTest = { id: testDoc.id, ...testDoc.data() } as Test;
                onInitiateTestView({ test: fullTest, action: 'result', resultData: result });
            } else {
                showMessage('The original test could not be found.', true);
            }
        } catch (error) {
            showMessage('Error loading test details.', true);
            console.error(error);
        }
    };

    const stats = React.useMemo(() => {
        const totalTests = results.length;
        if (totalTests === 0) return { totalTests: 0, averageScore: 0, highestScore: 0, totalCorrect: 0, totalIncorrect: 0, recentActivity: [] };

        const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / totalTests;
        const highestScore = Math.max(...results.map(r => r.percentage));
        const totalCorrect = results.reduce((sum, r) => sum + r.correctCount, 0);
        const totalIncorrect = results.reduce((sum, r) => sum + r.incorrectCount, 0);

        const recentActivity = results.slice(0, 5);
        
        return { totalTests, averageScore, highestScore, totalCorrect, totalIncorrect, recentActivity };
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

    return (
        <div className="bg-slate-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-8">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-1 space-y-8 sticky top-24">
                        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                             <div className="text-center mb-6">
                                <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-300">{userInitial}</span>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{userProfile.name}</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{userProfile.email}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Member since {userProfile.createdAt && typeof userProfile.createdAt.toDate === 'function' ? (userProfile.createdAt as Timestamp).toDate().toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                                </div>
                                <div>
                                    <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
                                    <input type="tel" id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="e.g., +1 234 567 890"/>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button type="submit" disabled={isSaving} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                                        {isSaving ? <Loader2 className="animate-spin"/> : <><Save size={18} className="mr-2"/> Save Changes</>}
                                    </button>
                                     <button type="button" onClick={() => setPasswordModalOpen(true)} className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <KeyRound size={18} className="mr-2"/> Change Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    {/* Right Column: Stats & Activity */}
                    <div className="lg:col-span-2 space-y-8">
                         {results.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                <Inbox className="w-16 h-16 text-gray-400 mx-auto" />
                                <h3 className="text-xl font-semibold mt-4 text-gray-800 dark:text-gray-100">No Data Yet</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">Complete some tests to see your performance statistics here.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <StatCard icon={BookOpen} label="Tests Taken" value={stats.totalTests} color="bg-blue-500" />
                                    <StatCard icon={Award} label="Highest Score" value={`${stats.highestScore.toFixed(2)}%`} color="bg-amber-500" />
                                    <StatCard icon={CheckCircle} label="Correct Answers" value={stats.totalCorrect} color="bg-green-500" />
                                    <StatCard icon={XCircle} label="Incorrect Answers" value={stats.totalIncorrect} color="bg-red-500" />
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Recent Activity</h2>
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {stats.recentActivity.map(result => (
                                            <li key={result.id} className="py-3 flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{result.testTitle}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Score: <span className="font-bold">{result.percentage.toFixed(2)}%</span></p>
                                                </div>
                                                <button onClick={() => handleViewResult(result)} className="flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                                                    View Result <ChevronRight size={16}/>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                 <ChangePasswordModal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
            </div>
        </div>
    );
};

export default ProfilePage;