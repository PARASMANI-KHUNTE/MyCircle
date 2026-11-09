import React from 'react';

const StatsCard = ({ icon: Icon, label, value, color = 'bg-primary/10 text-primary' }) => {
    return (
        <div className="flex items-center gap-4 rounded-2xl border border-card-border bg-card p-5 transition-colors hover:border-card-border-hover">
            <div className={`rounded-xl p-3 ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    {label}
                </p>
                <h3 className="text-xl font-semibold text-foreground">{value}</h3>
            </div>
        </div>
    );
};

export default StatsCard;
