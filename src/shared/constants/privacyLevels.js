/**
 * Privacy Levels Constants
 * Defines all privacy level options used throughout the app
 */

export const PRIVACY_LEVELS = {
  EVERYONE: 'everyone',
  MY_CONTACTS: 'my_contacts',
  NOBODY: 'nobody'
};

export const PRIVACY_LEVEL_LABELS = {
  [PRIVACY_LEVELS.EVERYONE]: 'Everyone',
  [PRIVACY_LEVELS.MY_CONTACTS]: 'My Contacts',
  [PRIVACY_LEVELS.NOBODY]: 'Nobody'
};

export const PRIVACY_LEVEL_DESCRIPTIONS = {
  [PRIVACY_LEVELS.EVERYONE]: 'Anyone on WhatsApp',
  [PRIVACY_LEVELS.MY_CONTACTS]: 'Only people in your contacts',
  [PRIVACY_LEVELS.NOBODY]: 'Not visible to anyone'
};

// Default privacy settings for new users
export const DEFAULT_PRIVACY_SETTINGS = {
  lastSeen: PRIVACY_LEVELS.EVERYONE,
  profilePhoto: PRIVACY_LEVELS.EVERYONE,
  about: PRIVACY_LEVELS.EVERYONE,
  groups: PRIVACY_LEVELS.EVERYONE,
  status: PRIVACY_LEVELS.MY_CONTACTS
};
