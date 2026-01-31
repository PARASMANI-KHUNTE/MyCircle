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
        if (count >= 50) return 'text-amber-400 bg-amber-400/10 border-amber-400/20'; // Gold/Master
        if (count >= 20) return 'text-slate-300 bg-slate-400/10 border-slate-400/20'; // Silver/Expert
        if (count >= 5) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'; // Bronze/Proficient
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20'; // Novice
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-6 relative group hover:bg-white/10 transition-colors h-full flex flex-col"
        >
            <div className="flex items-start gap-4 mb-4">
                <Link to={`/profile?userId=${user._id}`}>
                    <div className="w-16 h-16 rounded-2xl bg-gray-800 overflow-hidden border-2 border-white/10 group-hover:border-primary/50 transition-colors">
                        <img src={getAvatarUrl(user)} alt={user.displayName} className="w-full h-full object-cover" />
                    </div>
                </Link>
                <div className="flex-1 min-w-0">
                    <Link to={`/profile?userId=${user._id}`}>
                        <h3 className="font-bold text-lg text-white hover:text-primary transition-colors line-clamp-1">{user.displayName}</h3>
                    </Link>
                    <div className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
                        <Star className="w-4 h-4 fill-yellow-400" />
                        <span>{user.rating?.toFixed(1) || 'N/A'}</span>
                        <span className="text-gray-500 text-xs">({user.reviews || 0} reviews)</span>
                    </div>
                    {user.location && (
                        <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{user.location}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bio Preview */}
            <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px] flex-grow">
                {user.bio || "No bio available."}
            </p>

            {/* Badges / Endorsements */}
            <div className="flex flex-wrap gap-2 mb-4">
                {displaySkill ? (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${getBadgeColor(displaySkill.count)}`}>
                        <Award className="w-3.5 h-3.5" />
                        <span>{displaySkill.skill}</span>
                        <span className="bg-white/10 px-1.5 rounded text-[10px] ml-1">{displaySkill.count}</span>
                    </div>
                ) : (
                    user.skills?.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300">
                            {skill}
                        </span>
                    ))
                )}
            </div>

            <div className="flex gap-2 mt-auto">
                <Link to={`/chat?recipientId=${user._id}`} className="flex-1">
                    <Button variant="outline" className="w-full text-xs h-9">
                        Message
                    </Button>
                </Link>
                <Link to={`/profile?userId=${user._id}`} className="flex-1">
                    <Button variant="primary" className="w-full text-xs h-9 bg-white/10 hover:bg-white/20 text-white border-none">
                        View Profile
                    </Button>
                </Link>
            </div>
        </motion.div>
    );
};

export default ServiceCard;
