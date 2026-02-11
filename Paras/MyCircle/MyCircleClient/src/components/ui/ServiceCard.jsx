import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';
import { getAvatarUrl } from '../../utils/avatar';

const ServiceCard = ({ user, searchedSkill }) => {
    // Determine top skill to show badge for
    let displaySkill = null;

    if (searchedSkill && user.skillEndorsements) {
        displaySkill = user.skillEndorsements.find(e =>
            e.skill.toLowerCase().includes(searchedSkill.toLowerCase())
        );
    }

    if (!displaySkill && user.skillEndorsements && user.skillEndorsements.length > 0) {
        // Find max endorsed skill
        displaySkill = user.skillEndorsements.reduce((prev, current) =>
            (prev.count > current.count) ? prev : current
        );
    }

    // Badge Logic
    const getBadgeColor = (count) => {
        if (count >= 50) return 'text-amber-500 bg-amber-500/10 border-amber-500/20'; // Gold/Master
        if (count >= 20) return 'text-slate-400 bg-slate-400/10 border-slate-400/20'; // Silver/Expert
        if (count >= 5) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'; // Bronze/Proficient
        return 'text-primary bg-primary/10 border-primary/20'; // Novice
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-card p-6 border border-card-border shadow-card hover:shadow-lg transition-all h-full flex flex-col group"
        >
            <div className="flex items-start gap-4 mb-4">
                <Link to={`/profile?userId=${user._id}`}>
                    <div className="w-16 h-16 rounded-2xl bg-background-section overflow-hidden border border-card-border group-hover:border-primary transition-colors">
                        <img src={getAvatarUrl(user)} alt={user.displayName} className="w-full h-full object-cover" />
                    </div>
                </Link>
                <div className="flex-1 min-w-0">
                    <Link to={`/profile?userId=${user._id}`}>
                        <h3 className="font-bold text-lg text-text-heading hover:text-primary transition-colors line-clamp-1">{user.displayName}</h3>
                    </Link>
                    <div className="flex items-center gap-1 text-primary text-sm font-bold">
                        <Star className="w-4 h-4 fill-primary" />
                        <span>{user.rating?.toFixed(1) || 'N/A'}</span>
                        <span className="text-text-muted text-xs font-normal">({user.reviews || 0} reviews)</span>
                    </div>
                    {user.location && (
                        <div className="flex items-center gap-1 text-text-muted text-xs mt-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{user.location}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bio Preview */}
            <p className="text-text-body text-sm mb-6 line-clamp-2 min-h-[40px] flex-grow leading-relaxed">
                {user.bio || "No bio available."}
            </p>

            {/* Badges / Endorsements */}
            <div className="flex flex-wrap gap-2 mb-6">
                {displaySkill ? (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider ${getBadgeColor(displaySkill.count)}`}>
                        <Award className="w-3.5 h-3.5" />
                        <span>{displaySkill.skill}</span>
                        <span className="bg-hover-bg px-1.5 rounded text-[10px] ml-1">{displaySkill.count}</span>
                    </div>
                ) : (
                    user.skills?.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-background-section border border-card-border text-[11px] font-bold text-text-muted uppercase tracking-wider">
                            {skill}
                        </span>
                    ))
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto">
                <Link to={`/chat?recipientId=${user._id}`}>
                    <Button variant="outline" className="w-full py-2.5 px-0 text-sm">
                        Message
                    </Button>
                </Link>
                <Link to={`/profile?userId=${user._id}`}>
                    <Button variant="primary" className="w-full py-2.5 px-0 text-sm">
                        Profile
                    </Button>
                </Link>
            </div>
        </motion.div>
    );
};

export default ServiceCard;
