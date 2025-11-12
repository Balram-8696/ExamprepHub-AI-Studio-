import React, { useState } from 'react';
import { Test } from '../../types';
import { ArrowLeft, CheckCircle, Info, Languages, BookOpen, Clock, MinusCircle, BarChart2, Award, Navigation } from 'lucide-react';

interface InstructionsPageProps {
    test: Test;
    onStartTest: (language: 'english' | 'hindi') => void;
    onBack: () => void;
}

const InstructionsPage: React.FC<InstructionsPageProps> = ({ test, onStartTest, onBack }) => {
    const [agreed, setAgreed] = useState(false);
    const [selectedLang, setSelectedLang] = useState<'english' | 'hindi'>('english');

    const totalMarks = (test.questionCount || 0) * (test.marksPerQuestion || 1);

    const instructions = {
        english: {
            title: "Test Instructions",
            get_ready: "You are about to start the test:",
            agreement: "I have read and understood all the instructions. I am ready to begin.",
            start_button: "Start Test",
            lang_choice: "Choose Your Default Language",
            sections: {
                general: {
                    title: "General Instructions",
                    icon: Info,
                    points: [
                        `This test consists of **${test.questionCount} multiple-choice questions**.`,
                        `You will have **${test.durationMinutes} minutes** to complete the test.`,
                        "The clock is set on the server and will start as soon as you begin the test.",
                        "Each question has only one correct answer."
                    ]
                },
                marking: {
                    title: "Marking Scheme",
                    icon: Award,
                    points: [
                        `**${test.marksPerQuestion} mark(s)** will be awarded for each correct answer.`,
                        test.negativeMarking > 0 ? `**${test.negativeMarking} mark(s)** will be deducted for each incorrect answer.` : 'There is **no negative marking** for incorrect answers.',
                        `No marks will be awarded or deducted for unattempted questions.`
                    ]
                },
                navigation: {
                    title: "Navigating the Test",
                    icon: Navigation,
                    points: [
                        "Use the **'Next'** and **'Previous'** buttons to move between questions.",
                        "The question palette on the side shows the status of each question. Click on a number to jump directly to that question.",
                        "Use the **'Mark for Review'** button to save a question for later. You can come back to it anytime before submitting.",
                        "Your test will be **submitted automatically** when the timer runs out, or you can submit it manually."
                    ]
                }
            },
            palette_legend: {
                title: "Question Palette Colors",
                items: [
                    { color: "bg-gray-200 dark:bg-gray-600", label: "Not Answered" },
                    { color: "bg-blue-500", label: "Answered" },
                    { color: "bg-purple-500", label: "Marked for Review" },
                    { color: "bg-yellow-500", label: "Answered & Marked" },
                ]
            }
        },
        hindi: {
            title: "परीक्षा निर्देश",
            get_ready: "आप यह परीक्षा शुरू करने वाले हैं:",
            agreement: "मैंने सभी निर्देशों को पढ़ और समझ लिया है। मैं शुरू करने के लिए तैयार हूँ।",
            start_button: "परीक्षा शुरू करें",
            lang_choice: "अपनी डिफ़ॉल्ट भाषा चुनें",
            sections: {
                general: {
                    title: "सामान्य निर्देश",
                    icon: Info,
                    points: [
                        `इस परीक्षा में **${test.questionCount} बहुविकल्पीय प्रश्न** हैं।`,
                        `परीक्षा पूरी करने के लिए आपके पास **${test.durationMinutes} मिनट** का समय होगा।`,
                        "घड़ी सर्वर पर सेट है और जैसे ही आप परीक्षा शुरू करेंगे, यह चलना शुरू हो जाएगी।",
                        "प्रत्येक प्रश्न का केवल एक ही सही उत्तर है।"
                    ]
                },
                marking: {
                    title: "अंकन योजना",
                    icon: Award,
                    points: [
                        `प्रत्येक सही उत्तर के लिए **${test.marksPerQuestion} अंक** दिए जाएंगे।`,
                        test.negativeMarking > 0 ? `प्रत्येक गलत उत्तर के लिए **${test.negativeMarking} अंक** काटे जाएंगे।` : 'गलत उत्तरों के लिए **कोई नकारात्मक अंकन नहीं** है।',
                        `अनुत्तरित प्रश्नों के लिए कोई अंक नहीं दिया जाएगा या काटा नहीं जाएगा।`
                    ]
                },
                navigation: {
                    title: "परीक्षा में नेविगेशन",
                    icon: Navigation,
                    points: [
                        "प्रश्नों के बीच जाने के लिए **'अगला' (Next)** और **'पिछला' (Previous)** बटन का उपयोग करें।",
                        "साइड में दिया गया प्रश्न पैलेट प्रत्येक प्रश्न की स्थिति दिखाता है। किसी प्रश्न पर सीधे जाने के लिए उसके नंबर पर क्लिक करें।",
                        "किसी प्रश्न को बाद में देखने के लिए **'समीक्षा के लिए चिह्नित करें' (Mark for Review)** बटन का उपयोग करें।",
                        "समय समाप्त होने पर आपकी परीक्षा **स्वतः जमा** हो जाएगी, या आप इसे मैन्युअल रूप से भी जमा कर सकते हैं।"
                    ]
                }
            },
            palette_legend: {
                title: "प्रश्न पैलेट के रंग",
                items: [
                    { color: "bg-gray-200 dark:bg-gray-600", label: "उत्तर नहीं दिया" },
                    { color: "bg-blue-500", label: "उत्तर दिया" },
                    { color: "bg-purple-500", label: "समीक्षा के लिए चिह्नित" },
                    { color: "bg-yellow-500", label: "उत्तर दिया और चिह्नित" },
                ]
            }
        }
    };
    
    const currentLangData = instructions[selectedLang];

    const InstructionSection: React.FC<{ title: string; icon: React.ElementType; points: string[] }> = ({ title, icon: Icon, points }) => (
        <div className="bg-slate-50 dark:bg-gray-700/50 p-6 rounded-lg border dark:border-gray-600">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-3 mb-4">
                <Icon className="w-6 h-6 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                {title}
            </h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300 pl-2">
                {points.map((point, index) => (
                    <li key={index} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span dangerouslySetInnerHTML={{ __html: point.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-700 dark:text-gray-200">$1</strong>') }} />
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border-t-4 border-indigo-500">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">{currentLangData.get_ready}</p>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{test.title}</h1>
                    </div>
                     <button 
                        onClick={onBack}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-8">
                    <div className="bg-slate-100 dark:bg-gray-700/50 p-4 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Questions</p><p className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center justify-center gap-2"><BookOpen size={18}/>{test.questionCount}</p></div>
                    <div className="bg-slate-100 dark:bg-gray-700/50 p-4 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Duration</p><p className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center justify-center gap-2"><Clock size={18}/>{test.durationMinutes} Mins</p></div>
                    <div className="bg-slate-100 dark:bg-gray-700/50 p-4 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Total Marks</p><p className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center justify-center gap-2"><BarChart2 size={18}/>{totalMarks}</p></div>
                    <div className="bg-slate-100 dark:bg-gray-700/50 p-4 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Negative Marking</p><p className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center justify-center gap-2"><MinusCircle size={18}/>{test.negativeMarking}</p></div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{currentLangData.title}</h2>
                    <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 rounded-lg">
                        <button onClick={() => setSelectedLang('english')} className={`px-3 py-1 text-sm rounded-md font-semibold ${selectedLang === 'english' ? 'bg-white dark:bg-gray-800 shadow text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>English</button>
                        <button onClick={() => setSelectedLang('hindi')} className={`px-3 py-1 text-sm rounded-md font-semibold ${selectedLang === 'hindi' ? 'bg-white dark:bg-gray-800 shadow text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>हिन्दी</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <InstructionSection {...currentLangData.sections.general} />
                    <InstructionSection {...currentLangData.sections.marking} />
                    <InstructionSection {...currentLangData.sections.navigation} />
                     <div className="bg-slate-50 dark:bg-gray-700/50 p-6 rounded-lg border dark:border-gray-600">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">{currentLangData.palette_legend.title}</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {currentLangData.palette_legend.items.map(item => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded-md ${item.color} flex-shrink-0`}></span>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="space-y-6 mt-10">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2"><Languages size={20} /> {currentLangData.lang_choice}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Questions will be available in both English and Hindi, but this sets your default language for the test interface.</p>
                        <div className="flex items-center gap-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg max-w-sm">
                            <button onClick={() => setSelectedLang('english')} className={`flex-1 text-center py-2 rounded-md font-semibold transition-all ${selectedLang === 'english' ? 'bg-indigo-600 text-white shadow' : 'bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>English</button>
                            <button onClick={() => setSelectedLang('hindi')} className={`flex-1 text-center py-2 rounded-md font-semibold transition-all ${selectedLang === 'hindi' ? 'bg-indigo-600 text-white shadow' : 'bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>हिन्दी (Hindi)</button>
                        </div>
                    </div>
    
                    <div className="flex items-start bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <input
                            id="agree"
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="h-5 w-5 text-indigo-600 border-gray-300 dark:border-gray-500 rounded focus:ring-indigo-500 mt-0.5"
                        />
                        <label htmlFor="agree" className="ml-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                           {currentLangData.agreement}
                        </label>
                    </div>
    
                    <div className="text-center pt-4">
                        <button
                            onClick={() => onStartTest(selectedLang)}
                            disabled={!agreed}
                            className="w-full sm:w-auto px-12 py-3 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-700 transition-all shadow-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                        >
                            <CheckCircle /> {currentLangData.start_button}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructionsPage;
