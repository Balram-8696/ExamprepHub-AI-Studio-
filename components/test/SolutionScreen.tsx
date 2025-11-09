import React, { useState, useMemo, useEffect, useContext } from 'react';
import { Test, UserAnswer, AnswerStatus, BilingualText } from '../../types';
import { Check, X, Info, ArrowLeft, ArrowRight, Home, LayoutGrid, CheckCircle, XCircle, SkipForward, Flag } from 'lucide-react';
import QuestionPalette from './QuestionPalette';
import ReportQuestionModal from '../modals/ReportQuestionModal';
import { AuthContext } from '../../App';

interface SolutionScreenProps {
    test: Test;
    userAnswers: UserAnswer[];
    onBackToResults: () => void;
    onBackToHome: () => void;
    language: 'english' | 'hindi';
}

const SolutionScreen: React.FC<SolutionScreenProps> = ({ test, userAnswers, onBackToResults, onBackToHome, language }) => {
    const { user } = useContext(AuthContext);
    const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');

    const paletteAnswers: UserAnswer[] = useMemo(() => {
        return test.questions.map((q, i) => {
            const userAnswer = userAnswers[i]?.answer;
            let status: AnswerStatus;
            if (userAnswer === null || userAnswer === undefined) {
                status = 'unattempted';
            } else {
                status = userAnswer === q.correctAnswer ? 'answered' : 'incorrect';
            }
            return { answer: userAnswer, status };
        });
    }, [test.questions, userAnswers]);

    const filteredIndices = useMemo(() => {
        if (filter === 'all') {
            return test.questions.map((_, i) => i);
        }
        const filterStatusMap = {
            correct: 'answered',
            incorrect: 'incorrect',
            unattempted: 'unattempted',
        };
        const targetStatus = filterStatusMap[filter as keyof typeof filterStatusMap];
        return paletteAnswers.reduce((acc, answer, index) => {
            if (answer.status === targetStatus) {
                acc.push(index);
            }
            return acc;
        }, [] as number[]);
    }, [filter, paletteAnswers, test.questions]);

    useEffect(() => {
        if (!filteredIndices.includes(currentSolutionIndex)) {
            setCurrentSolutionIndex(filteredIndices.length > 0 ? filteredIndices[0] : 0);
        }
    }, [filteredIndices, currentSolutionIndex]);
    
    const currentQuestion = test.questions[currentSolutionIndex];
    const currentUserAnswer = userAnswers[currentSolutionIndex]?.answer || null;

    const isBilingual = currentQuestion && typeof currentQuestion.question === 'object' && 'english' in currentQuestion.question;
    const questionText = isBilingual ? (currentQuestion.question as BilingualText)[language] : currentQuestion.question as unknown as string;
    const questionOptions = isBilingual ? currentQuestion.options[language] : currentQuestion.options as unknown as string[];
    const questionExplanation = isBilingual && currentQuestion.explanation ? currentQuestion.explanation[language] : currentQuestion.explanation as unknown as string | undefined;

    const handlePaletteSelect = (index: number) => {
        setCurrentSolutionIndex(index);
        setPaletteOpen(false);
    };

    const currentPositionInFilteredList = filteredIndices.indexOf(currentSolutionIndex);

    const handleNext = () => {
        if (currentPositionInFilteredList < filteredIndices.length - 1) {
            setCurrentSolutionIndex(filteredIndices[currentPositionInFilteredList + 1]);
        }
    };

    const handlePrevious = () => {
        if (currentPositionInFilteredList > 0) {
            setCurrentSolutionIndex(filteredIndices[currentPositionInFilteredList - 1]);
        }
    };
    
    const stats = useMemo(() => {
        const correct = paletteAnswers.filter(a => a.status === 'answered').length;
        const incorrect = paletteAnswers.filter(a => a.status === 'incorrect').length;
        const unattempted = paletteAnswers.filter(a => a.status === 'unattempted').length;
        return { correct, incorrect, unattempted, all: test.questions.length };
    }, [paletteAnswers, test.questions.length]);

    const FilterButton = ({
        label,
        filterType,
        count,
        icon: Icon,
        color
    }: {
        label: string;
        filterType: typeof filter;
        count: number;
        icon: React.ElementType;
        color: string;
    }) => {
        const isActive = filter === filterType;
        return (
            <button
                onClick={() => setFilter(filterType)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${isActive ? `${color} text-white shadow-md` : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
            >
                <Icon size={16} />
                <span>{label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>{count}</span>
            </button>
        )
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 sm:p-4">
             <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md sm:rounded-xl border-b border-gray-200 dark:border-gray-700 p-3 sm:my-4">
                <div className="flex justify-between items-center gap-4">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">{test.title} - Solutions</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {user && (
                        <button
                            onClick={() => setReportModalOpen(true)}
                            className="p-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            title="Report issue with this question"
                        >
                            <Flag size={20} />
                        </button>
                        )}
                        <button onClick={onBackToResults} className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-2.5 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm flex items-center gap-2">
                            <ArrowLeft size={16}/> Results
                        </button>
                        <button onClick={() => setPaletteOpen(true)} className="p-2.5 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 lg:hidden" title="Show Question Palette"><LayoutGrid size={20}/></button>
                        <button onClick={onBackToHome} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 font-bold py-2.5 px-4 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/80 transition-all text-sm flex items-center gap-2">
                            <Home size={16}/> Home
                        </button>
                    </div>
                </div>
             </header>
             
             <main className="flex-grow flex flex-col lg:flex-row gap-6 px-4 pb-4">
                <div className="flex-grow">
                    <div className="flex flex-wrap gap-2 mb-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-xl border dark:border-gray-700">
                        <FilterButton label="All" filterType="all" count={stats.all} icon={LayoutGrid} color="bg-indigo-500" />
                        <FilterButton label="Correct" filterType="correct" count={stats.correct} icon={CheckCircle} color="bg-emerald-500" />
                        <FilterButton label="Incorrect" filterType="incorrect" count={stats.incorrect} icon={XCircle} color="bg-red-500" />
                        <FilterButton label="Unattempted" filterType="unattempted" count={stats.unattempted} icon={SkipForward} color="bg-gray-500" />
                    </div>

                    {filteredIndices.length > 0 && currentQuestion ? (
                        <>
                            <p className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 leading-relaxed">
                                <span className="text-gray-500 dark:text-gray-400">{currentSolutionIndex + 1}. </span>{questionText}
                            </p>
                            <div className="space-y-4 mb-6">
                                {(questionOptions || []).map((option, index) => {
                                    const key = ['A', 'B', 'C', 'D'][index];
                                    const isCorrect = key === currentQuestion.correctAnswer;
                                    const isUserChoice = key === currentUserAnswer;
                                    
                                    let classes = 'p-4 rounded-lg border-2 text-left flex items-center justify-between gap-4 ';
                                    let icon = null;

                                    if (isCorrect) {
                                        classes += 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-500/50';
                                        icon = <Check className="w-6 h-6 text-emerald-600 shrink-0" />;
                                    } else if (isUserChoice) {
                                        classes += 'bg-red-50 dark:bg-red-900/30 border-red-500 dark:border-red-500/50';
                                        icon = <X className="w-6 h-6 text-red-600 shrink-0" />;
                                    } else {
                                        classes += 'bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-600 opacity-80';
                                    }

                                    return (
                                        <div key={key} className={classes}>
                                            <div className="flex items-start gap-4">
                                                <span className={`font-bold text-sm mt-1 flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-md ${isCorrect ? 'bg-emerald-600 text-white' : isUserChoice ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>{key}</span>
                                                <span className={`text-gray-800 dark:text-gray-100 ${isCorrect || isUserChoice ? 'font-semibold' : ''}`}>{option}</span>
                                            </div>
                                            {icon}
                                        </div>
                                    );
                                })}
                            </div>

                            {questionExplanation && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5">
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 text-lg flex items-center"><Info className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />Detailed Explanation</h4>
                                    <div className="text-gray-800 dark:text-gray-200 p-4 bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-gray-700 rounded-lg min-h-[50px] prose prose-sm dark:prose-invert max-w-none">
                                        <p>{questionExplanation}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl">
                            <p className="text-gray-500 dark:text-gray-400">No questions match the selected filter.</p>
                        </div>
                    )}
                </div>
                
                <div className="w-full lg:w-80 lg:flex-shrink-0">
                    <div className="hidden lg:block lg:sticky lg:top-24">
                        <QuestionPalette 
                            isOpen={true} 
                            isModal={false}
                            onClose={() => {}}
                            questions={test.questions} 
                            userAnswers={paletteAnswers}
                            currentQuestionIndex={currentSolutionIndex}
                            onQuestionSelect={handlePaletteSelect}
                            mode="solution"
                            visibleIndices={filteredIndices}
                        />
                    </div>
                </div>
             </main>

            <footer className="flex justify-between items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sm:dark:bg-transparent border-t-2 border-gray-200 dark:border-gray-700 sticky bottom-0 z-10 sm:relative sm:p-0 sm:bg-transparent sm:border-t-0 sm:mt-auto sm:shadow-none">
                <button onClick={handlePrevious} disabled={currentPositionInFilteredList <= 0} className="flex-1 sm:flex-none sm:w-auto bg-white dark:bg-gray-800 sm:dark:bg-gray-700 border-r sm:border border-gray-200 dark:border-gray-700 sm:dark:border-gray-600 text-gray-800 dark:text-gray-200 font-bold py-4 sm:py-3 sm:px-6 rounded-none sm:rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-all sm:shadow-sm flex items-center justify-center gap-2">
                    <ArrowLeft size={20}/> Previous
                </button>
                <button onClick={handleNext} disabled={currentPositionInFilteredList >= filteredIndices.length - 1} className="flex-1 sm:flex-none sm:w-auto bg-indigo-600 text-white font-bold py-4 sm:py-3 sm:px-6 rounded-none sm:rounded-lg hover:bg-indigo-700 transition-all sm:shadow-md flex items-center justify-center gap-2">
                    Next <ArrowRight size={20}/>
                </button>
            </footer>
            
            <QuestionPalette 
                isOpen={paletteOpen}
                isModal={true}
                onClose={() => setPaletteOpen(false)}
                questions={test.questions} 
                userAnswers={paletteAnswers}
                currentQuestionIndex={currentSolutionIndex}
                onQuestionSelect={handlePaletteSelect}
                mode="solution"
                visibleIndices={filteredIndices}
            />
             {currentQuestion && (
                <ReportQuestionModal 
                    isOpen={reportModalOpen}
                    onClose={() => setReportModalOpen(false)}
                    test={test}
                    question={currentQuestion}
                    questionIndex={currentSolutionIndex}
                />
             )}
        </div>
    );
};

export default SolutionScreen;