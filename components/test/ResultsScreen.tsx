import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserResult } from '../../types';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AuthContext } from '../../App';
import { showMessage } from '../../utils/helpers';
import { CheckCircle, BarChart2, Target, HelpCircle, Smile, Frown, SkipForward, Percent, ArrowRight, ArrowLeft, TrendingUp, Users, Clock, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from 'recharts';

interface ResultsScreenProps {
    result: UserResult;
    totalQuestions: number;
    onViewSolutions: (result: UserResult) => void;
    onBackToTests: () => void;
    language: 'english' | 'hindi';
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, totalQuestions, onViewSolutions, onBackToTests, language }) => {
    const { user } = useContext(AuthContext);
    const [lastAttempts, setLastAttempts] = useState<UserResult[]>([]);
    const [loadingAttempts, setLoadingAttempts] = useState(true);
    const [comparisonData, setComparisonData] = useState<{ rank: number; participants: number; averageScore: number } | null>(null);
    const [loadingComparison, setLoadingComparison] = useState(true);

    const [currentResult, setCurrentResult] = useState<UserResult>(result);
    const [isAttemptsDropdownOpen, setIsAttemptsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsAttemptsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!user || !result) return;
        setLoadingAttempts(true);

        const q = query(
            collection(db, 'results'),
            where('userId', '==', user.uid),
            where('testId', '==', result.testId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const attemptsData = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as UserResult));
                attemptsData.sort((a, b) => {
                    const dateA = a.submittedAt instanceof Timestamp ? a.submittedAt.toDate().getTime() : 0;
                    const dateB = b.submittedAt instanceof Timestamp ? b.submittedAt.toDate().getTime() : 0;
                    return dateB - dateA;
                });
                const lastThree = attemptsData.slice(0, 3);
                setLastAttempts(lastThree);
            } else {
                setLastAttempts([]);
            }
            setLoadingAttempts(false);
        }, (error) => {
            console.error("Error fetching previous attempts: ", error);
            showMessage("Could not load previous attempt history.", true);
            setLoadingAttempts(false);
        });

        return () => unsubscribe();
    }, [user, result]);
    
    useEffect(() => {
        if (!currentResult) return;
        setLoadingComparison(true);
        const q = query(collection(db, 'results'), where('testId', '==', currentResult.testId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setLoadingComparison(false);
                return;
            }

            const allResultsForTest = snapshot.docs.map(doc => doc.data() as UserResult);
            const participants = allResultsForTest.length;

            if (participants > 0) {
                const totalPercentage = allResultsForTest.reduce((sum, r) => sum + r.percentage, 0);
                const averageScore = totalPercentage / participants;
                
                const scoresHigher = allResultsForTest.filter(r => r.percentage > currentResult.percentage).length;
                const rank = scoresHigher + 1;

                setComparisonData({ rank, participants, averageScore });
            }
            setLoadingComparison(false);
        }, (error) => {
            console.error("Error fetching comparison data: ", error);
            showMessage("Could not load comparison analytics.", true);
            setLoadingComparison(false);
        });

        return () => unsubscribe();
    }, [currentResult]);

    const unattemptedCount = totalQuestions - (currentResult.correctCount + currentResult.incorrectCount);
    const attemptedCount = currentResult.correctCount + currentResult.incorrectCount;
    const accuracy = attemptedCount > 0 ? (currentResult.correctCount / attemptedCount) * 100 : 0;
    
    const analysisItems = [
        { icon: HelpCircle, label: "Total Questions", value: totalQuestions, color: 'text-blue-600', darkColor: 'dark:text-blue-400', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-900/50' },
        { icon: Target, label: "Attempted", value: attemptedCount, color: 'text-orange-600', darkColor: 'dark:text-orange-400', bg: 'bg-orange-50', darkBg: 'dark:bg-orange-900/50' },
        { icon: Smile, label: "Correct", value: currentResult.correctCount, color: 'text-emerald-600', darkColor: 'dark:text-emerald-400', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/50' },
        { icon: Frown, label: "Incorrect", value: currentResult.incorrectCount, color: 'text-red-600', darkColor: 'dark:text-red-400', bg: 'bg-red-50', darkBg: 'dark:bg-red-900/50' },
        { icon: SkipForward, label: "Unattempted", value: unattemptedCount, color: 'text-gray-600', darkColor: 'dark:text-gray-400', bg: 'bg-gray-50', darkBg: 'dark:bg-gray-700/50' },
        { icon: Percent, label: "Accuracy", value: `${accuracy.toFixed(2)}%`, color: 'text-indigo-600', darkColor: 'dark:text-indigo-400', bg: 'bg-indigo-50', darkBg: 'dark:bg-indigo-900/50' },
    ];

    const takeaways = [
        { title: "Your Score", value: `${currentResult.score.toFixed(2)} / ${currentResult.total}`, description: "This is your final calculated score." },
        { title: "Overall Percentage", value: `${currentResult.percentage.toFixed(2)}%`, description: "Your performance across all questions." },
        { title: "Accuracy", value: `${accuracy.toFixed(2)}%`, description: "Correctness on questions you attempted." },
    ];
    
    const chartData = [...lastAttempts].reverse().map((attempt, index) => {
        let dateLabel = `Attempt ${index + 1}`;
        if (attempt.submittedAt) {
            const date = attempt.submittedAt instanceof Timestamp ? attempt.submittedAt.toDate() : attempt.submittedAt as Date;
            if (date && !isNaN(date.getTime())) {
                dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
        }
        return {
            date: dateLabel,
            Score: parseFloat(attempt.percentage.toFixed(2)),
        };
    });

    const formatDate = (timestamp: Timestamp | Date) => {
        if (!timestamp) return 'N/A';
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const handleSelectAttempt = (attempt: UserResult) => {
        setCurrentResult(attempt);
        setIsAttemptsDropdownOpen(false);
    };

    const AttemptsDropdown = () => (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsAttemptsDropdownOpen(!isAttemptsDropdownOpen)}
                className="flex items-center gap-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all shadow-sm"
            >
                <Clock size={18} />
                <span>View Other Attempts</span>
                <ChevronDown size={18} className={`transition-transform ${isAttemptsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isAttemptsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700 animate-scale-in">
                    {lastAttempts.map((attempt, index) => (
                        <button
                            key={attempt.id}
                            onClick={() => handleSelectAttempt(attempt)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${attempt.id === currentResult.id ? 'bg-indigo-50 dark:bg-indigo-900/50' : ''}`}
                        >
                            <div className="font-semibold text-gray-800 dark:text-gray-200">Attempt #{index + 1} {index === 0 ? "(Latest)" : ''}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(attempt.submittedAt)}</div>
                            <div className="text-xs">Score: <span className="font-bold">{attempt.percentage.toFixed(2)}%</span></div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <button onClick={onBackToTests} className="flex items-center justify-center gap-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all shadow-sm">
                        <ArrowLeft size={18} /> Go Back
                    </button>
                    {!loadingAttempts && lastAttempts.length > 1 && <AttemptsDropdown />}
                </div>

                <div className="text-center mb-8">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                    <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">Test Completed!</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">Well done! Here's your detailed performance analysis.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {takeaways.map(item => (
                        <div key={item.title} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 text-center">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.title}</p>
                            <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 my-2">{item.value}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{item.description}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                            <BarChart2 className="w-6 h-6 mr-3 text-indigo-600 dark:text-indigo-400" />
                            Performance Breakdown
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {analysisItems.map(({ icon: Icon, label, value, color, darkColor, bg, darkBg }) => (
                                <div key={label} className={`flex items-center justify-between p-4 ${bg} ${darkBg} rounded-lg`}>
                                    <div className="flex items-center">
                                        <Icon className={`w-6 h-6 mr-3 ${color} ${darkColor}`} />
                                        <p className="text-base font-medium text-gray-700 dark:text-gray-300">{label}</p>
                                    </div>
                                    <p className={`text-lg font-bold ${color} ${darkColor}`}>{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                           <Users className="w-6 h-6 mr-3 text-indigo-600 dark:text-indigo-400" />
                           Comparison Analytics
                        </h2>
                        {loadingComparison && (
                             <div className="space-y-6 animate-pulse">
                                {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div className="h-5 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-5 w-1/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                                ))}
                                <div className="pt-4 mt-2">
                                    <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    <div className="flex justify-between mt-2">
                                        <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {!loadingComparison && comparisonData && (
                            <div className="space-y-5 text-lg">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-gray-600 dark:text-gray-300">Your Rank</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-100">#{comparisonData.rank}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-gray-600 dark:text-gray-300">Participants</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-100">{comparisonData.participants}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-gray-600 dark:text-gray-300">Average Score</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-100">{comparisonData.averageScore.toFixed(0)}%</p>
                                </div>

                                <div className="pt-6">
                                    <div className="relative h-2.5 w-full bg-gray-200 dark:bg-gray-600 rounded-full">
                                        <div 
                                            className="h-full bg-yellow-400 rounded-full" 
                                            style={{ width: `${Math.min(currentResult.percentage, 100)}%` }}>
                                        </div>
                                        <div 
                                            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full" 
                                            style={{ left: `calc(${Math.min(comparisonData.averageScore, 100)}% - 10px)` }}
                                            title={`Average Score: ${comparisonData.averageScore.toFixed(0)}%`}>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2 px-1">
                                        <span>0%</span>
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">Avg: {comparisonData.averageScore.toFixed(0)}%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </div>
                        )}
                         {!loadingComparison && !comparisonData && (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-10">Not enough data for comparison yet.</p>
                        )}
                    </div>
                </div>

                {!loadingAttempts && chartData.length > 1 && (
                    <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                            <TrendingUp className="w-6 h-6 mr-3 text-indigo-600 dark:text-indigo-400" />
                            Your Last {chartData.length} Attempts
                        </h2>
                        <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={chartData}
                                    margin={{
                                        top: 5,
                                        right: 30,
                                        left: 0,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                                    <XAxis dataKey="date" />
                                    <YAxis unit="%" domain={[0, 100]} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="Score" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-center">
                    <button onClick={() => onViewSolutions(currentResult)} className="w-full sm:max-w-xs flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all shadow-md">
                        View Solutions <ArrowRight size={18} />
                    </button>
                </div>
             </div>
        </div>
    );
};

export default ResultsScreen;