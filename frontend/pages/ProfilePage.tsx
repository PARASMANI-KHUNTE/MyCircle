import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CURRENT_USER } from '../services/mockData';
import { Star, MapPin, Calendar, CheckCircle, Clock } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const statsData = [
    { name: 'Mon', activity: 4 },
    { name: 'Tue', activity: 3 },
    { name: 'Wed', activity: 7 },
    { name: 'Thu', activity: 2 },
    { name: 'Fri', activity: 6 },
    { name: 'Sat', activity: 8 },
    { name: 'Sun', activity: 5 },
  ];

  return (
    <div className="pb-24 md:pb-0 space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary to-secondary opacity-10"></div>
        
        <div className="relative z-10">
          <img 
            src={CURRENT_USER.avatar} 
            alt="Profile" 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md object-cover"
          />
        </div>
        
        <div className="flex-1 text-center md:text-left pt-2 md:pt-8 z-10">
          <h1 className="text-2xl font-bold text-gray-900">{CURRENT_USER.name}</h1>
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1"><MapPin size={14} /> {CURRENT_USER.area}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> Joined {CURRENT_USER.joinDate}</span>
          </div>
          <p className="mt-4 text-gray-600 max-w-lg">
            Passionate about community service and local exchanges. Always looking to help with moving and DIY projects!
          </p>
        </div>

        <div className="flex gap-3 pt-8 z-10">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                Edit Profile
            </button>
            <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-colors shadow-sm">
                Settings
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-green-50 rounded-full text-green-600 mb-2">
                <CheckCircle size={24} />
            </div>
            <span className="text-2xl font-bold text-gray-900">{CURRENT_USER.completedDeals}</span>
            <span className="text-xs text-gray-500">Deals Completed</span>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-blue-50 rounded-full text-blue-600 mb-2">
                <Clock size={24} />
            </div>
            <span className="text-2xl font-bold text-gray-900">{CURRENT_USER.responseRate}%</span>
            <span className="text-xs text-gray-500">Response Rate</span>
        </div>
         <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-yellow-50 rounded-full text-yellow-600 mb-2">
                <Star size={24} />
            </div>
            <span className="text-2xl font-bold text-gray-900">4.9</span>
            <span className="text-xs text-gray-500">Average Rating</span>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-purple-50 rounded-full text-purple-600 mb-2">
                <Calendar size={24} />
            </div>
            <span className="text-2xl font-bold text-gray-900">12</span>
            <span className="text-xs text-gray-500">Active Days</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border shadow-sm">
           <h3 className="font-bold text-lg text-gray-900 mb-6">Weekly Activity</h3>
           <div className="h-64 w-full min-w-0">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={statsData}>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                 <YAxis hide />
                 <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                 />
                 <Bar dataKey="activity" radius={[4, 4, 0, 0]}>
                    {statsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 5 ? '#1F7F8F' : '#E5E7EB'} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Recent Reviews (Placeholder) */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Recent Reviews</h3>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="pb-4 border-b last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, j) => <Star key={j} size={12} fill="currentColor" />)}
                            </div>
                            <span className="text-xs text-gray-400">2 days ago</span>
                        </div>
                        <p className="text-sm text-gray-600 italic">"Alex was incredibly helpful and punctual. Highly recommended!"</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">- Sarah Smith</p>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
