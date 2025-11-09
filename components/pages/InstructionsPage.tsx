import React, { useState } from 'react';
import { Test } from '../../types';
import { ArrowLeft, CheckCircle, Info, Languages, BookOpen, Clock, MinusCircle, BarChart2 } from 'lucide-react';

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
            title: "Instructions",
            points: [
                "This is a timed test. Please complete it within the allocated duration.",
                "Each question has only one correct option.",
                "Do not refresh the page or use the browser's back button during the test.",
                "Your test will be automatically submitted when the time is up.",
                "All the best!"
            ],
            agreement: "I have read and understood all the instructions.",
            start_button: "Start Timed Test",
            lang_choice: "Choose Your Default Language"
        },
        hindi: {
            title: "निर्देश",
            points: [
                "यह एक समयबद्ध परीक्षा है। कृपया इसे आवंटित अवधि के भीतर पूरा करें।",
                "प्रत्येक प्रश्न का केवल एक ही सही विकल्प है।",
                "परीक्षा के दौरान पेज को रीफ्रेश न करें या ब्राउज़र के बैक बटन का उपयोग न करें।",
                "समय समाप्त होने पर आपकी परीक्षा स्वतः सबमिट हो जाएगी।",
                "शुभकामनाएं!"
            ],
            agreement: "मैंने सभी निर्देशों को पढ़ और समझ लिया है।",
            start_button: "समयबद्ध परीक्षा शुरू करें",
            lang_choice: "अपनी डिफ़ॉल्ट भाषा चुनें"
        }
    };
    
    const currentInstructions = instructions[selectedLang];

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border-t-4 border-indigo-500">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">{test.title}</h1>
                        <p className="text-gray-500 mt-1">Please read the instructions carefully before starting the test.</p>
                    </div>
                     <button 
                        onClick={onBack}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 transition-all"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-8">
                    <div className="bg-gray-100 p-4 rounded-lg"><p className="text-sm text-gray-500">Questions</p><p className="text-xl font-bold flex items-center justify-center gap-2"><BookOpen size={18}/>{test.questionCount}</p></div>
                    <div className="bg-gray-100 p-4 rounded-lg"><p className="text-sm text-gray-500">Duration</p><p className="text-xl font-bold flex items-center justify-center gap-2"><Clock size={18}/>{test.durationMinutes} Mins</p></div>
                    <div className="bg-gray-100 p-4 rounded-lg"><p className="text-sm text-gray-500">Total Marks</p><p className="text-xl font-bold flex items-center justify-center gap-2"><BarChart2 size={18}/>{totalMarks}</p></div>
                    <div className="bg-gray-100 p-4 rounded-lg"><p className="text-sm text-gray-500">Negative Marking</p><p className="text-xl font-bold flex items-center justify-center gap-2"><MinusCircle size={18}/>{test.negativeMarking}</p></div>
                </div>

                <div className="text-left bg-indigo-50 p-4 rounded-lg border border-indigo-200 my-8">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-indigo-800 flex items-center"><Info className="w-5 h-5 mr-2"/>{currentInstructions.title}</h3>
                        <div className="flex items-center gap-2 p-1 bg-white border rounded-lg">
                            <button onClick={() => setSelectedLang('english')} className={`px-3 py-1 text-sm rounded-md ${selectedLang === 'english' ? 'bg-indigo-600 text-white' : ''}`}>English</button>
                            <button onClick={() => setSelectedLang('hindi')} className={`px-3 py-1 text-sm rounded-md ${selectedLang === 'hindi' ? 'bg-indigo-600 text-white' : ''}`}>हिन्दी</button>
                        </div>
                     </div>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                        {currentInstructions.points.map((point, index) => <li key={index}>{point}</li>)}
                    </ul>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2"><Languages size={20} /> {currentInstructions.lang_choice}</h3>
                        <div className="flex items-center gap-4 p-2 bg-gray-100 rounded-lg max-w-sm">
                            <button onClick={() => setSelectedLang('english')} className={`flex-1 text-center py-2 rounded-md font-semibold ${selectedLang === 'english' ? 'bg-indigo-600 text-white shadow' : 'bg-white hover:bg-gray-200'}`}>English</button>
                            <button onClick={() => setSelectedLang('hindi')} className={`flex-1 text-center py-2 rounded-md font-semibold ${selectedLang === 'hindi' ? 'bg-indigo-600 text-white shadow' : 'bg-white hover:bg-gray-200'}`}>हिन्दी (Hindi)</button>
                        </div>
                    </div>
    
                    <div className="flex items-start">
                        <input
                            id="agree"
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                        />
                        <label htmlFor="agree" className="ml-3 text-sm text-gray-700">
                           {currentInstructions.agreement}
                        </label>
                    </div>
    
                    <div className="text-center">
                        <button
                            onClick={() => onStartTest(selectedLang)}
                            disabled={!agreed}
                            className="w-full sm:w-auto px-10 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-all shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                        >
                            <CheckCircle /> {currentInstructions.start_button}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructionsPage;