/**
 * Data Hooks Index
 * Central export point for all data-fetching hooks
 */

export { default as useAuth } from './useAuth';
export { default as useUser } from './useUser';
export { default as useChats } from './useChats';
export { default as useMessages } from './useMessages';
export { default as useStatus } from './useStatus';
export { default as useCalls } from './useCalls';
export { default as useSettings } from './useSettings';

// Generic hooks
export { useFetch, useFetchRealtime } from './useFetch';
export { useCRUD, useMutation } from './useCRUD';

// Service configuration
export { dataServices, config } from './serviceConfig';
