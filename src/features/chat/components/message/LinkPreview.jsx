import React from 'react';

const LinkPreview = ({ text }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    if (!match) return null;

    const url = match[0];
    let domain;
    try {
        domain = new URL(url).hostname;
    } catch (e) {
        return null;
    }

    return (
        <div className="mt-2 bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 max-w-sm">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 relative">
                <img
                    src={`https://picsum.photos/seed/${domain}/400/200`}
                    alt="Preview"
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="p-2">
                <h4 className="font-bold text-sm text-[#111b21] dark:text-gray-100 truncate">{domain}</h4>
                <p className="text-xs text-[#667781] dark:text-gray-400 line-clamp-2">Check out this interesting link from {domain}. Click to read more about this content.</p>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 mt-1 block truncate">{url}</a>
            </div>
        </div>
    );
};

export default LinkPreview;
