import {
    ADRS_ROUTE,
    FEATURES_ROUTE,
    ISSUES_ROUTE,
    NOTES_ROUTE,
    OVERVIEW_ROUTE,
    RELEASES_ROUTE,
    SPECS_ROUTE,
} from '../constants/routes';
import {
    FileCode2,
    FileStack,
    Flag,
    FolderSearch,
    LayoutDashboard,
    NotebookPen,
    Package,
} from 'lucide-react';
import { NavSection } from '../types/navigation';

export const SHIP_MODULE_ID = 'ship';

export const SHIP_NAV_SECTIONS: NavSection[] = [
    {
        id: 'project',
        label: 'Project',
        items: [
            { id: 'overview', path: OVERVIEW_ROUTE, label: 'Overview', icon: LayoutDashboard },
            { id: 'notes', path: NOTES_ROUTE, label: 'Notes', icon: NotebookPen },
            { id: 'decisions', path: ADRS_ROUTE, label: 'Decisions', icon: FileStack },
            { id: 'releases', path: RELEASES_ROUTE, label: 'Releases', icon: Package },
            { id: 'features', path: FEATURES_ROUTE, label: 'Features', icon: Flag },
        ],
    },
    {
        id: 'workflow',
        label: 'Workflow',
        items: [
            { id: 'specs', path: SPECS_ROUTE, label: 'Specs', icon: FileCode2 },
            { id: 'issues', path: ISSUES_ROUTE, label: 'Issues', icon: FolderSearch, priority: 'secondary' },
        ],
    },
];
