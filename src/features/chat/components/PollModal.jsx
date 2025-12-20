import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const PollModal = ({ isOpen, onClose, onSubmit }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    if (!isOpen) return null;

    const handleAddOption = () => {
        if (options.length < 10) {
            setOptions([...options, '']);
        }
    };

    const handleRemoveOption = (index) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = () => {
        // Filter out empty options
        const validOptions = options.filter(o => o.trim() !== '');

        if (question.trim() && validOptions.length >= 2) {
            onSubmit(question, validOptions);
            // Reset
            setQuestion('');
            setOptions(['', '']);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 bg-wa-teal dark:bg-wa-header text-white">
                    <h2 className="text-lg font-medium">Create Poll</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Question
                        </label>
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Ask a question..."
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-wa-teal focus:border-transparent outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Options
                        </label>
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-300">
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                    placeholder={`Option ${idx + 1}`}
                                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-wa-teal outline-none transition-colors"
                                />
                                {options.length > 2 && (
                                    <button
                                        onClick={() => handleRemoveOption(idx)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {options.length < 10 && (
                        <button
                            onClick={handleAddOption}
                            className="mt-4 flex items-center gap-2 text-wa-teal font-medium hover:bg-wa-teal/10 px-4 py-2 rounded-lg transition-colors w-full justify-center border border-dashed border-wa-teal/30"
                        >
                            <Plus size={20} />
                            Add Option
                        </button>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <button
                        onClick={handleSubmit}
                        disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
                        className="w-full bg-wa-teal hover:bg-wa-tealDark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-full shadow-lg transition-all active:scale-[0.98]"
                    >
                        Create Poll
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PollModal;
