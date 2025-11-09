import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Test, UserResult, UserAnswer, TestStateLocal } from '../../types';
import TestScreen from '../test/TestScreen';
import ResultsScreen from '../test/ResultsScreen';
import SolutionScreen from '../test/SolutionScreen';
import { AuthContext } from '../../App';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { showMessage } from '../../utils/helpers';
import { Loader2, XCircle } from 'lucide-react';

interface TestViewProps {
    test: Test;
    action: 'start' | 'resume' | 'result';
    resultData?: UserResult;
    onExitTestView: () => void;
    language: 'english' | 'hindi';
}

const TestView: React.FC<TestViewProps> = ({ test, action, resultData, onExitTestView, language: initialLanguage }) => {
    const { user } = useContext(AuthContext);
    const [currentScreen, setCurrentScreen] = useState<'loading' | 'test' | 'results' | 'solution'>('loading');
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [finalResult, setFinalResult] = useState<UserResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [language, setLanguage] = useState(initialLanguage);

    const clearTestStateLocal = useCallback(() => {
        if (!user) return;
        localStorage.removeItem(`inProgressTest_${user.uid}`);
    }, [user]);

    const saveTestStateLocal = useCallback(() => {
        if (!user || currentScreen !== 'test') return;
        const state: TestStateLocal = {
            testId: test.id,
            currentQuestionIndex,
            userAnswers,
            timeRemaining,
            language,
        };
        localStorage.setItem(`inProgressTest_${user.uid}`, JSON.stringify(state));
    }, [user, test.id, currentQuestionIndex, userAnswers, timeRemaining, language, currentScreen]);

    useEffect(() => {
        const interval = setInterval(() => {
            saveTestStateLocal();
        }, 10000); // Save every 10 seconds
        return () => clearInterval(interval);
    }, [saveTestStateLocal]);

    const calculateAndSubmitResults = useCallback(async () => {
        if (!user) {
            showMessage("You must be logged in to submit your test. Please log in and try again.", true);
            return;
        }

        setIsSubmitting(true);

        let correctCount = 0, incorrectCount = 0;
        test.questions.forEach((q, index) => {
            const userAnswer = userAnswers[index].answer;
            if (userAnswer !== null) {
                if (userAnswer === q.correctAnswer) correctCount++;
                else incorrectCount++;
            }
        });

        const marksPerQ = test.marksPerQuestion || 1;
        const negMarks = test.negativeMarking || 0;
        const totalMarks = test.questionCount * marksPerQ;
        const achievedMarks = (correctCount * marksPerQ) - (incorrectCount * negMarks);
        const result: Omit<UserResult, 'id'> = {
            score: achievedMarks,
            total: totalMarks,
            correctCount,
            incorrectCount,
            userId: user.uid,
            userEmail: user.email!,
            testId: test.id,
            testTitle: test.title,
            categoryId: test.categoryId,
            categoryName: test.category,
            percentage: totalMarks > 0 ? (achievedMarks / totalMarks) * 100 : 0,
            submittedAt: serverTimestamp() as any,
            userAnswers: userAnswers,
        };

        try {
            const docRef = await addDoc(collection(db, 'results'), result);
            setFinalResult({ ...result, id: docRef.id, submittedAt: new Date() as any });
            clearTestStateLocal();
            setCurrentScreen('results');
        } catch (error) {
            console.error("Error submitting results:", error);
            showMessage("Failed to submit results. Please check your connection.", true);
        } finally {
            setIsSubmitting(false);
        }
    }, [userAnswers, test, user, clearTestStateLocal]);

    const handleTimeUp = useCallback(() => {
        showMessage("Time's up! Submitting your test.", true);
        calculateAndSubmitResults();
    }, [calculateAndSubmitResults]);
    
    const handleViewSolutions = (resultForSolution: UserResult) => {
        if (resultForSolution.userAnswers && resultForSolution.userAnswers.length === test.questions.length) {
            setUserAnswers(resultForSolution.userAnswers);
        } else {
            // Fallback for older results that didn't save answers
            setUserAnswers(new Array(test.questions.length).fill(null).map(() => ({ answer: null, status: 'unattempted' })));
            showMessage("Detailed answer data is not available for this older attempt.", true);
        }
        setFinalResult(resultForSolution);
        setCurrentScreen('solution');
    };

    const initializeTest = useCallback(() => {
        if (action === 'start') {
            setCurrentQuestionIndex(0);
            setUserAnswers(new Array(test.questions.length).fill(null).map(() => ({ answer: null, status: 'unattempted' })));
            setTimeRemaining((test.durationMinutes || 60) * 60);
            setCurrentScreen('test');
        } else if (action === 'resume' && user) {
            const stateJSON = localStorage.getItem(`inProgressTest_${user.uid}`);
            const state: TestStateLocal | null = stateJSON ? JSON.parse(stateJSON) : null;
            if (state && state.testId === test.id) {
                setCurrentQuestionIndex(state.currentQuestionIndex);
                setUserAnswers(state.userAnswers);
                setTimeRemaining(state.timeRemaining);
                setLanguage(state.language);
                setCurrentScreen('test');
            } else {
                // Fallback to starting a new test if resume data is invalid
                setCurrentQuestionIndex(0);
                setUserAnswers(new Array(test.questions.length).fill(null).map(() => ({ answer: null, status: 'unattempted' })));
                setTimeRemaining((test.durationMinutes || 60) * 60);
                setCurrentScreen('test');
            }
        } else if (action === 'result' && resultData) {
            setFinalResult(resultData);
            if (resultData.userAnswers) {
                setUserAnswers(resultData.userAnswers);
            } else {
                 // Provide dummy answers for solution view if needed for older attempts
                setUserAnswers(new Array(test.questions.length).fill(null).map(() => ({ answer: null, status: 'unattempted' })));
            }
            setCurrentScreen('results');
        }
    }, [action, test, user, resultData]);
    
    useEffect(() => {
        if (currentScreen !== 'loading') return;

        const timer = setTimeout(() => {
            if (test && test.questions && test.questions.length > 0) {
                initializeTest();
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [currentScreen, initializeTest, test]);

    const handleExit = () => {
        if (currentScreen === 'test') {
            saveTestStateLocal();
        }
        onExitTestView();
    };

    if (!test || !test.questions || test.questions.length === 0) {
        return (
            <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl max-w-lg mx-auto my-10 animate-fade-in">
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Test Data Error</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">This test is currently unavailable because it has no questions. Please contact an administrator.</p>
                <div className="mt-6">
                    <button onClick={onExitTestView} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (currentScreen === 'loading') {
        return <div className="flex items-center justify-center h-full"><Loader2 className="w-12 h-12 animate-spin text-indigo-600" /></div>;
    }

    return (
        <div className="w-full h-full">
             {isSubmitting && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-xl">
                    <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />
                    <p className="mt-4 text-lg font-semibold text-gray-700">Submitting your test...</p>
                    <p className="text-sm text-gray-500">Please do not close this window.</p>
                </div>
            )}
            {currentScreen === 'test' && (
                <TestScreen
                    test={test}
                    userAnswers={userAnswers}
                    setUserAnswers={setUserAnswers}
                    currentQuestionIndex={currentQuestionIndex}
                    setCurrentQuestionIndex={setCurrentQuestionIndex}
                    timeRemaining={timeRemaining}
                    setTimeRemaining={setTimeRemaining}
                    onTimeUp={handleTimeUp}
                    onSubmitTest={calculateAndSubmitResults}
                    language={language}
                    onExitTest={handleExit}
                />
            )}
            {currentScreen === 'results' && finalResult && (
                <ResultsScreen
                    result={finalResult}
                    totalQuestions={test.questions.length}
                    onViewSolutions={handleViewSolutions}
                    onBackToTests={onExitTestView}
                    language={language}
                />
            )}
            {currentScreen === 'solution' && (
                <SolutionScreen
                    test={test}
                    userAnswers={userAnswers}
                    onBackToResults={() => setCurrentScreen('results')}
                    onBackToHome={onExitTestView}
                    language={language}
                />
            )}
        </div>
    );
};

export default TestView;
