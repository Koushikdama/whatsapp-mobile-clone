
import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
const PollCreator = ({ onClose, onSend }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [allowMultiple, setAllowMultiple] = useState(false);

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, '']);
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleSubmit = () => {
        const validOptions = options.filter(opt => opt.trim() !== '');
        if (!question.trim() || validOptions.length < 2) return;

        const pollData = {
            question,
            options: validOptions.map((opt, idx) => ({
                id: `opt_${Date.now()}_${idx}`,
                text: opt,
                voters: []
            })),
            allowMultiple
        };
        onSend(pollData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center animate-in fade-in duration-200">
            <div className="bg-white dark:bg-wa-dark-paper w-full md:w-[500px] md:rounded-xl rounded-t-xl p-4 flex flex-col h-[90vh] md:h-auto md:max-h-[85vh] animate-in slide-in-from-bottom-10 duration-300">

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={onClose}>
                        <X size={24} className="text-[#54656f] dark:text-gray-400" />
                    </button>
                    <h2 className="text-xl font-medium text-[#111b21] dark:text-gray-100">Create Poll</h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    {/* Question */}
                    <div className="mb-6">
                        <label className="text-sm font-medium text-[#54656f] dark:text-gray-400 mb-2 block">Question</label>
                        <input
                            type="text"
                            className="w-full bg-wa-grayBg dark:bg-wa-dark-input p-3 rounded-lg outline-none text-[#111b21] dark:text-gray-100 border-b-2 border-transparent focus:border-wa-teal transition-all"
                            placeholder="Ask a question"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Options */}
                    <div className="mb-6 space-y-3">
                        <label className="text-sm font-medium text-[#54656f] dark:text-gray-400 block">Options</label>
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
                                <input
                                    type="text"
                                    className="flex-1 bg-wa-grayBg dark:bg-wa-dark-input p-3 rounded-lg outline-none text-[#111b21] dark:text-gray-100 border-b-2 border-transparent focus:border-wa-teal transition-all"
                                    placeholder={`Option ${idx + 1}`}
                                    value={opt}
                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                />
                                {options.length > 2 && (
                                    <button onClick={() => removeOption(idx)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        ))}

                        {options.length < 10 && (
                            <button
                                onClick={addOption}
                                className="flex items-center gap-2 text-wa-teal font-medium mt-2 px-1 hover:underline"
                            >
                                <Plus size={20} /> Add option
                            </button>
                        )}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 py-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-[#111b21] dark:text-gray-100 font-medium">Allow multiple answers</span>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${allowMultiple ? 'bg-wa-teal' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${allowMultiple ? 'translate-x-6' : ''}`}></div>
                            </div>
                            <input type="checkbox" className="hidden" checked={allowMultiple} onChange={() => setAllowMultiple(!allowMultiple)} />
                        </label>
                    </div>
                </div>

                <div className="pt-4 mt-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
                        className={`w-full py-3 rounded-full font-bold text-white transition-all
                            ${!question.trim() || options.filter(o => o.trim()).length < 2
                                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                : 'bg-wa-teal hover:bg-wa-tealDark shadow-md'
                            }
                        `}
                    >
                        Send Poll
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PollCreator;
