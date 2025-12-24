/**
 * Avatar Service
 * Generates and manages user avatars using DiceBear
 * Follows Single Responsibility Principle - handles avatar generation only
 */

import { createAvatar } from '@dicebear/core';
import { 
    avataaars, 
    bottts, 
    personas,
    initials,
    lorelei,
    micah,
    pixelArt
} from '@dicebear/collection';

class AvatarService {
    constructor() {
        this.cache = new Map(); // Cache generated avatars
        this.styles = {
            avataaars,
            bottts,
            personas,
            initials,
            lorelei,
            micah,
            pixelArt
        };
    }

    /**
     * Generate avatar
     * @param {string} seed - Unique identifier (usually user ID or name)
     * @param {Object} options - Avatar options
     * @returns {string} - SVG data URL
     */
    generateAvatar(seed, options = {}) {
        try {
            const {
                style = 'avataaars',
                size = 200,
                backgroundColor = 'transparent',
                ...styleOptions
            } = options;

            // Create cache key
            const cacheKey = `${seed}-${style}-${size}-${JSON.stringify(styleOptions)}`;

            // Check cache
            if (this.cache.has(cacheKey)) {
                console.log(`✅ [Avatar] Retrieved from cache: ${cacheKey}`);
                return this.cache.get(cacheKey);
            }

            // Get style
            const styleFunction = this.styles[style];
            if (!styleFunction) {
                console.warn(`⚠️ [Avatar] Unknown style: ${style}, using default`);
                return this.generateAvatar(seed, { ...options, style: 'avataaars' });
            }

            console.log(`🎨 [Avatar] Generating avatar: ${style} for ${seed}`);

            // Create avatar
            const avatar = createAvatar(styleFunction, {
                seed,
                size,
                backgroundColor: backgroundColor === 'transparent' ? [] : [backgroundColor],
                ...styleOptions
            });

            // Convert to data URL
            const svg = avatar.toString();
            const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

            // Cache result
            this.cache.set(cacheKey, dataUrl);

            console.log('✅ [Avatar] Avatar generated');
            return dataUrl;

        } catch (error) {
            console.error('❌ [Avatar] Error generating avatar:', error);
            // Return fallback avatar
            return this.generateFallbackAvatar(seed);
        }
    }

    /**
     * Generate fallback avatar (initials)
     * @private
     * @param {string} seed
     * @returns {string}
     */
    generateFallbackAvatar(seed) {
        // Extract initials from seed
        const words = seed.trim().split(/\s+/);
        const initials = words
            .slice(0, 2)
            .map(word => word[0]?.toUpperCase() || '')
            .join('');

        return this.generateAvatar(seed, {
            style: 'initials',
            seed: initials || seed.substring(0, 2).toUpperCase()
        });
    }

    /**
     * Generate avatar for user profile
     * @param {Object} user - User object with id and name
     * @param {Object} avatarConfig - Avatar configuration from user settings
     * @returns {string} - Avatar data URL
     */
    generateUserAvatar(user, avatarConfig = {}) {
        if (!user) {
            console.warn('⚠️ [Avatar] No user provided');
            return this.generateAvatar('default');
        }

        // Use existing avatar URL if present
        if (avatarConfig.url && avatarConfig.type === 'photo') {
            return avatarConfig.url;
        }

        // Generate based on config or defaults
        const seed = user.id || user.name || 'default';
        const style = avatarConfig.type || 'avataaars';
        const options = {
            style,
            ...avatarConfig.options
        };

        return this.generateAvatar(seed, options);
    }

    /**
     * Get available avatar styles
     * @returns {Array<Object>}
     */
    getAvailableStyles() {
        return [
            {
                id: 'avataaars',
                name: 'Avataaars',
                description: 'Cartoon-style avatars with customizable features',
                preview: this.generateAvatar('preview', { style: 'avataaars', size: 100 })
            },
            {
                id: 'bottts',
                name: 'Bottts',
                description: 'Robot-themed avatars',
                preview: this.generateAvatar('preview', { style: 'bottts', size: 100 })
            },
            {
                id: 'personas',
                name: 'Personas',
                description: 'Minimalist human faces',
                preview: this.generateAvatar('preview', { style: 'personas', size: 100 })
            },
            {
                id: 'lorelei',
                name: 'Lorelei',
                description: 'Illustrated portraits',
                preview: this.generateAvatar('preview', { style: 'lorelei', size: 100 })
            },
            {
                id: 'micah',
                name: 'Micah',
                description: 'Simple illustrated faces',
                preview: this.generateAvatar('preview', { style: 'micah', size: 100 })
            },
            {
                id: 'pixelArt',
                name: 'Pixel Art',
                description: 'Retro pixel-art style',
                preview: this.generateAvatar('preview', { style: 'pixelArt', size: 100 })
            },
            {
                id: 'initials',
                name: 'Initials',
                description: 'Simple initials-based avatars',
                preview: this.generateAvatar('AB', { style: 'initials', size: 100 })
            }
        ];
    }

    /**
     * Get customization options for a specific style
     * @param {string} style - Avatar style
     * @returns {Array<Object>}
     */
    getStyleOptions(style) {
        const commonOptions = {
            avataaars: [
                {
                    key: 'accessories',
                    label: 'Accessories',
                    type: 'select',
                    options: ['blank', 'kurt', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers']
                },
                {
                    key: 'accessoriesColor',
                    label: 'Accessories Color',
                    type: 'color',
                    options: ['#000000', '#262E33', '#3C4F5C', '#65C9FF', '#5199E4']
                },
                {
                    key: 'clothing',
                    label: 'Clothing',
                    type: 'select',
                    options: ['blazerShirt', 'blazerSweater', 'collarSweater', 'graphicShirt', 'hoodie', 'overall', 'shirtCrewNeck']
                },
                {
                    key: 'clothingColor',
                    label: 'Clothing Color',
                    type: 'color',
                    options: ['#000000', '#3C4F5C', '#5199E4', '#65C9FF', '#E6E6E6']
                },
                {
                    key: 'eyebrows',
                    label: 'Eyebrows',
                    type: 'select',
                    options: ['angry', 'angryNatural', 'default', 'defaultNatural', 'flatNatural', 'raised']
                },
                {
                    key: 'eyes',
                    label: 'Eyes',
                    type: 'select',
                    options: ['close', 'cry', 'default', 'happy', 'hearts', 'side', 'squint', 'surprised', 'wink']
                },
                {
                    key: 'mouth',
                    label: 'Mouth',
                    type: 'select',
                    options: ['concerned', 'default', 'disbelief', 'eating', 'grimace', 'sad', 'scream', 'serious', 'smile']
                },
                {
                    key: 'top',
                    label: 'Hair/Top',
                    type: 'select',
                    options: ['longHair', 'shortHair', 'eyepatch', 'hat', 'hijab', 'turban', 'winterHat']
                },
                {
                    key: 'hairColor',
                    label: 'Hair Color',
                    type: 'color',
                    options: ['#724133', '#F59797', '#ECDCBF', '#B58143', '#000000', '#4A312C']
                }
            ],
            bottts: [
                {
                    key: 'colors',
                    label: 'Color Palette',
                    type: 'multiselect',
                    options: ['blue', 'green', 'pink', 'purple', 'red', 'yellow']
                }
            ],
            personas: [
                {
                    key: 'hair',
                    label: 'Hair',
                    type: 'select',
                    options: ['short', 'long', 'bald', 'curly']
                },
                {
                    key: 'beard',
                    label: 'Beard',
                    type: 'boolean'
                }
            ],
            initials: [
                {
                    key: 'backgroundColor',
                    label: 'Background Color',
                    type: 'color',
                    options: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE']
                },
                {
                    key: 'textColor',
                    label: 'Text Color',
                    type: 'color',
                    options: ['#FFFFFF', '#000000']
                }
            ]
        };

        return commonOptions[style] || [];
    }

    /**
     * Clear avatar cache
     */
    clearCache() {
        console.log('🧹 [Avatar] Clearing cache');
        this.cache.clear();
    }

    /**
     * Get cache size
     * @returns {number}
     */
    getCacheSize() {
        return this.cache.size;
    }
}

// Export singleton instance
export const avatarService = new AvatarService();
export default avatarService;
