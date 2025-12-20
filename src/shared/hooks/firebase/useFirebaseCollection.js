/**
 * useFirebaseCollection Hook
 * Generic hook for subscribing to Firestore collections
 */

import { useState, useEffect } from 'react';

export const useFirebaseCollection = (service, queryConstraints = null) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!service) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = service.subscribeToCollection(
            service.collectionName,
            queryConstraints,
            (collectionData) => {
                setData(collectionData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            }
        );

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [service, queryConstraints]);

    return { data, loading, error };
};

export default useFirebaseCollection;
