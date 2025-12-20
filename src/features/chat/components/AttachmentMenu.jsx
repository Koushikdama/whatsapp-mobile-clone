import React from 'react';
import { FileText, Camera, Image as ImageIcon, Headphones, MapPin, BarChart2, PenTool, Gamepad2 } from 'lucide-react';

const AttachmentIcon = ({ icon, color, label, onClick }) => (
    <div className="flex flex-col items-center gap-2 cursor-pointer transition-transform active:scale-95 hover:scale-105" onClick={onClick}>
        <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center text-white shadow-lg`}>
            {icon}
        </div>
        <span className="text-xs text-[#54656f] dark:text-gray-300 font-medium">{label}</span>
    </div>
);

const AttachmentMenu = ({ onSelect, onClose }) => {
    return (
        <>
            <div className="absolute bottom-20 left-4 bg-white dark:bg-wa-dark-paper rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-black/50 border border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom-5 fade-in zoom-in-95 duration-200 w-[90%] max-w-[350px] z-50">
                <div className="grid grid-cols-3 gap-y-6 gap-x-4">
                    <AttachmentIcon
                        icon={<FileText size={24} />}
                        color="bg-indigo-500"
                        label="Document"
                        onClick={() => onSelect('document')}
                    />
                    <AttachmentIcon
                        icon={<Camera size={24} />}
                        color="bg-pink-500"
                        label="Camera"
                        onClick={() => onSelect('camera')}
                    />
                    <AttachmentIcon
                        icon={<ImageIcon size={24} />}
                        color="bg-purple-500"
                        label="Gallery"
                        onClick={() => onSelect('gallery')}
                    />
                    <AttachmentIcon
                        icon={<Headphones size={24} />}
                        color="bg-orange-500"
                        label="Audio"
                        onClick={() => onSelect('audio')}
                    />
                    <AttachmentIcon
                        icon={<MapPin size={24} />}
                        color="bg-green-500"
                        label="Location"
                        onClick={() => onSelect('location')}
                    />
                    <AttachmentIcon
                        icon={<BarChart2 size={24} />}
                        color="bg-teal-500"
                        label="Poll"
                        onClick={() => onSelect('poll')}
                    />
                    <AttachmentIcon
                        icon={<Gamepad2 size={24} />}
                        color="bg-orange-600"
                        label="Game"
                        onClick={() => onSelect('game')}
                    />
                    <AttachmentIcon
                        icon={<PenTool size={24} />}
                        color="bg-pink-600"
                        label="Draw"
                        onClick={() => onSelect('draw')}
                    />
                </div>
            </div>
            {/* Click outside listener to close menu */}
            <div className="fixed inset-0 z-40" onClick={onClose}></div>
        </>
    );
};

export default AttachmentMenu;
