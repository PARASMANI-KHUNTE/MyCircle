const OVERVIEW_CARD_DEFINITIONS = [
    { key: 'users', label: 'Users' },
    { key: 'posts', label: 'Visible posts' },
    { key: 'deals', label: 'Completed deals' },
    { key: 'openReports', label: 'Open reports' },
    { key: 'openSubmissions', label: 'Open submissions' },
    { key: 'suspendedUsers', label: 'Suspended users' },
];

export const getOverviewCards = (overview) => OVERVIEW_CARD_DEFINITIONS.map(({ key, label }) => ({
    key,
    label,
    value: Number(overview?.[key]) || 0,
}));
