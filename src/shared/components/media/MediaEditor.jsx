
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Crop, Type, Smile, Send, Plus, Trash2 } from 'lucide-react';

const EMOJIS = ["😂", "❤️", "😍", "🔥", "🙏", "👍", "🎉", "😮"];
const TEXT_COLORS = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'];

const MediaEditor = ({ file, onClose, onSend, placeholder, footerElement }) => {
    const [caption, setCaption] = useState('');
    const [isCropped, setIsCropped] = useState(false);
    const [textOverlay, setTextOverlay] = useState('');
    const [showTextEditor, setShowTextEditor] = useState(false);
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const inputRef = useRef(null);
    const [isViewOnce, setIsViewOnce] = useState(false);

    useEffect(() => {
        if (showTextEditor && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showTextEditor]);

    const handleSend = () => {
        onSend(caption, isViewOnce);
    };

    const toggleCrop = () => setIsCropped(!isCropped);

    const toggleTextEditor = () => {
        setShowTextEditor(!showTextEditor);
        if (!showTextEditor && !textOverlay) {
            setTextOverlay('');
        }
    };

    const addEmoji = (emoji) => {
        if (showTextEditor) {
            setTextOverlay(prev => prev + emoji);
        } else {
            setCaption(prev => prev + emoji);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-[#0b141a] flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 z-20 absolute top-0 w-full bg-gradient-to-b from-black/60 to-transparent">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                    <X size={24} />
                </button>
                <div className="flex gap-6 text-white mx-auto md:mr-4">
                    <button
                        onClick={toggleCrop}
                        className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isCropped ? 'bg-white/20' : ''}`}
                        title="Crop / Fit"
                    >
                        <Crop size={20} />
                    </button>
                    <button
                        onClick={toggleTextEditor}
                        className={`p-2 rounded-full hover:bg-white/10 transition-colors ${showTextEditor || textOverlay ? 'bg-white/20' : ''}`}
                        title="Add Text"
                    >
                        <Type size={20} />
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`p-2 rounded-full hover:bg-white/10 transition-colors ${showEmojiPicker ? 'bg-white/20' : ''}`}
                            title="Emoji"
                        >
                            <Smile size={20} />
                        </button>
                        {showEmojiPicker && (
                            <div className="absolute top-12 right-0 bg-[#1f2c34] p-2 rounded-lg shadow-xl flex gap-2 flex-wrap w-40 z-30 border border-gray-700">
                                {EMOJIS.map(e => (
                                    <button key={e} onClick={() => addEmoji(e)} className="text-xl p-1 hover:bg-white/10 rounded">
                                        {e}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center relative bg-black overflow-hidden" onClick={() => setShowEmojiPicker(false)}>
                <div className={`relative transition-all duration-300 ${isCropped ? 'w-full h-full' : 'max-w-full max-h-full p-4'}`}>
                    {file.type === 'video' ? (
                        <video
                            src={file.url}
                            controls={false}
                            autoPlay
                            loop
                            playsInline
                            className={`w-full h-full ${isCropped ? 'object-cover' : 'object-contain'}`}
                        />
                    ) : (
                        <img
                            src={file.url}
                            alt="Preview"
                            className={`w-full h-full ${isCropped ? 'object-cover' : 'object-contain'}`}
                        />
                    )}
                </div>

                {/* Text Overlay */}
                {(showTextEditor || textOverlay) && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                        {showTextEditor ? (
                            <div className="w-full bg-black/50 p-4 pointer-events-auto flex flex-col items-center gap-4">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={textOverlay}
                                    onChange={(e) => setTextOverlay(e.target.value)}
                                    className="bg-transparent text-center text-3xl font-bold outline-none w-full"
                                    style={{ color: textColor }}
                                    placeholder="Type something..."
                                    onKeyDown={(e) => { if (e.key === 'Enter') setShowTextEditor(false); }}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    {TEXT_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setTextColor(c)}
                                            className={`w-6 h-6 rounded-full border-2 ${textColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                                <button onClick={() => setShowTextEditor(false)} className="px-4 py-1 bg-white/20 rounded-full text-white text-sm">Done</button>
                            </div>
                        ) : (
                            <div
                                className="pointer-events-auto cursor-move text-3xl font-bold drop-shadow-md select-none px-4 py-2 rounded hover:bg-white/10 transition-colors"
                                style={{ color: textColor, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                                onClick={() => setShowTextEditor(true)}
                            >
                                {textOverlay}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-[#0b141a] p-3 w-full border-t border-white/10 z-20">
                <div className="max-w-4xl mx-auto flex items-end gap-3 pb-2 md:pb-4">
                    <div className="flex-1 bg-[#2a3942] rounded-full flex items-center px-4 py-2 border border-transparent focus-within:border-gray-500 transition-colors">
                        <div className="text-gray-400 mr-3"><Plus size={24} className="rotate-45" /></div>
                        <input
                            type="text"
                            placeholder={placeholder || "Add a caption..."}
                            className="flex-1 bg-transparent text-white placeholder:text-gray-400 outline-none text-[15px] min-w-0"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            onClick={() => setIsViewOnce(!isViewOnce)}
                            className={`ml-2 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${isViewOnce ? 'bg-wa-teal border-wa-teal text-black font-black' : 'border-gray-400 text-gray-400 font-bold'}`}
                            title="View Once"
                        >
                            <span className="text-xs">1</span>
                        </button>
                    </div>
                    <button
                        onClick={handleSend}
                        className="w-12 h-12 bg-wa-teal rounded-full flex items-center justify-center text-white shadow-lg hover:brightness-110 active:scale-95 transition-all shrink-0"
                    >
                        <Send size={20} className="ml-1" />
                    </button>
                </div>
                {footerElement && (
                    <div className="max-w-4xl mx-auto flex justify-between items-center px-2 mt-1">
                        {footerElement}
                    </div>
                )}
            </div>
        </div>
        , document.body);
};

export default MediaEditor;
