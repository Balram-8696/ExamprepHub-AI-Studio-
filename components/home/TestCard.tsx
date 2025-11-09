import React from 'react';
import { Test, UserResult, TestStateLocal } from '../../types';
import { Clock, HelpCircle, BarChart2, MinusCircle, CheckCircle } from 'lucide-react';

interface TestCardProps {
    test: Test;
    userResult?: UserResult;
    inProgressTest?: TestStateLocal | null;
    onAction: (testId: string, action: 'start' | 'resume' | 'result') => void;
    isNew?: boolean;
}

const TestCard: React.FC<TestCardProps> = ({ test, userResult, inProgressTest, onAction, isNew }) => {

    const renderButtons = () => {
        if (inProgressTest) {
            return (
                <button onClick={() => onAction(test.id, 'resume')} className="w-full py-2.5 px-6 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition whitespace-nowrap">
                    Resume Test
                </button>
            );
        }
        if (userResult) {
            return (
                <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={() => onAction(test.id, 'result')} className="w-full py-2.5 px-4 bg-green-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-green-700 transition whitespace-nowrap">
                        View Result
                    </button>
                    <button onClick={() => onAction(test.id, 'start')} className="w-full py-2.5 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition whitespace-nowrap">
                        Reattempt
                    </button>
                </div>
            );
        }
        return (
            <button onClick={() => onAction(test.id, 'start')} className="w-full py-2.5 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition whitespace-nowrap">
                Attempt Now
            </button>
        );
    };

    const totalMarks = (test.questionCount || 0) * (test.marksPerQuestion || 1);

    const answeredCount = inProgressTest 
        ? inProgressTest.userAnswers.filter(a => a.answer !== null).length 
        : 0;
    
    const progressPercent = inProgressTest && test.questionCount > 0
        ? (answeredCount / test.questionCount) * 100
        : 0;

    const isCompleted = userResult && !inProgressTest;

    return (
        <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-300 flex flex-col h-full">
            {isNew && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2 z-10">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-500 text-white shadow-lg animate-pulse-badge">
                        NEW
                    </span>
                </div>
            )}
            
            <div className="flex-grow">
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100" title={test.title}>{test.title}</h3>
                
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span><span className="font-semibold text-gray-800 dark:text-gray-200">{test.durationMinutes || 60}</span> Mins</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <HelpCircle size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span><span className="font-semibold text-gray-800 dark:text-gray-200">{test.questionCount || 0}</span> Questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BarChart2 size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span><span className="font-semibold text-gray-800 dark:text-gray-200">{totalMarks}</span> Marks</span>
                    </div>
                    {test.negativeMarking > 0 && (
                        <div className="flex items-center gap-2">
                            <MinusCircle size={16} className="text-red-500 flex-shrink-0" />
                            <span><span className="font-semibold text-red-600 dark:text-red-500">-{test.negativeMarking}</span> Negative</span>
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    {inProgressTest && (
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-orange-600 dark:text-orange-400">In Progress</span>
                                <span className="text-gray-500 dark:text-gray-400">{answeredCount} / {test.questionCount} Answered</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                        </div>
                    )}
                    {isCompleted && (
                        <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
                                <span className="text-sm font-semibold text-green-700 dark:text-green-400">Completed</span>
                            </div>
                            <div className="text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Score: </span>
                                <span className="font-bold text-gray-800 dark:text-gray-100">{userResult.percentage.toFixed(2)}%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto pt-4">
                {renderButtons()}
            </div>
        </div>
    );
};

export default TestCard;