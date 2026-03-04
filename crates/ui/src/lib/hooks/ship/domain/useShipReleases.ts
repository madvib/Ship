import { Dispatch, SetStateAction, useState } from 'react';
import { ReleaseEntry } from '@/bindings';
import { useReleaseActions } from '../../workspace/useReleaseActions';

interface UseShipReleasesParams {
    setError: Dispatch<SetStateAction<string | null>>;
    refreshActivity: () => Promise<void>;
}

export function useShipReleases({
    setError,
    refreshActivity,
}: UseShipReleasesParams) {
    const [releases, setReleases] = useState<ReleaseEntry[]>([]);
    const [selectedRelease, setSelectedRelease] = useState<ReleaseEntry | null>(null);

    const actions = useReleaseActions({
        setReleases,
        setSelectedRelease,
        setError,
        refreshActivity,
    });

    return {
        releases,
        setReleases,
        selectedRelease,
        setSelectedRelease,
        ...actions,
    };
}
