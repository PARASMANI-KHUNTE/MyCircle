import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Shield, Heart, Star, 
  Users, Search, Handshake, CheckCircle2, 
  MapPin, TrendingUp, Lock, UserCheck, MessageSquare 
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-white">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 px-4 py-4 md:px-6 md:py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-primary font-extrabold text-lg md:text-xl">M</span>
            </div>
            <span className="font-bold text-xl md:text-2xl tracking-tight text-white drop-shadow-md">MyCircle</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
             <button 
              onClick={() => navigate('/login')}
              className="px-3 py-2 md:px-5 md:py-2.5 text-sm md:text-base font-semibold text-white hover:bg-white/10 rounded-full transition-all backdrop-blur-sm"
            >
              Log in
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-bold text-gray-900 bg-white rounded-full hover:bg-gray-100 transition-all shadow-lg"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-[600px] h-[90vh] w-full overflow-hidden rounded-b-[2.5rem] md:rounded-b-[4rem] shadow-2xl mb-12">
        <img 
          src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2070&auto=format&fit=crop" 
          alt="Community Gathering" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Improved Gradient Overlay for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-black/30" />
        
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-6 flex flex-col justify-center pt-20">
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium text-[10px] md:text-xs uppercase tracking-widest mb-6 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              The Neighborhood Marketplace
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.1] drop-shadow-lg">
              Connect with people <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-white">right next door.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 md:mb-12 max-w-xl md:max-w-2xl font-medium leading-relaxed drop-shadow-md">
              The trusted platform to find local jobs, volunteer for causes you care about, and trade with neighbors you can trust.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
              <button 
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white text-base md:text-lg font-bold rounded-full hover:bg-cyan-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Join Your Neighborhood <ArrowRight size={20} />
              </button>
              <button 
                 onClick={() => navigate('/explore')}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white text-base md:text-lg font-bold rounded-full hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                Browse Listings
              </button>
            </div>
            
            {/* Quick Stats on Hero */}
            <div className="mt-12 flex items-center gap-6 text-white/80 text-sm font-medium">
               <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-success" />
                  <span>Verified Profiles</span>
               </div>
               <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-success" />
                  <span>Secure Chat</span>
               </div>
               <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-success" />
                  <span>No Hidden Fees</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 px-4 md:px-6 bg-white relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
            <div className="absolute top-10 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2"></div>
            <div className="absolute bottom-10 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -translate-x-1/2"></div>
         </div>

         <div className="max-w-7xl mx-auto relative">
            <div className="text-center mb-16 md:mb-20">
               <span className="text-primary font-bold tracking-wider uppercase text-sm mb-3 block">Simple & Secure</span>
               <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">How MyCircle Works</h2>
               <p className="text-lg text-gray-500 max-w-2xl mx-auto">Get started in minutes. We've made it incredibly easy to connect with the people around you.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
               {/* Connecting Line (Desktop) */}
               <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

               {/* Step 1 */}
               <div className="relative flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-white rounded-full border border-gray-100 shadow-lg flex items-center justify-center mb-6 relative z-10 group transition-transform hover:scale-110 duration-300">
                     <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Users size={32} />
                     </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">1. Join Your Circle</h3>
                  <p className="text-gray-500 leading-relaxed max-w-xs">Sign up and verify your location to instantly connect with real neighbors in your area.</p>
               </div>

               {/* Step 2 */}
               <div className="relative flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-white rounded-full border border-gray-100 shadow-lg flex items-center justify-center mb-6 relative z-10 group transition-transform hover:scale-110 duration-300">
                     <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Search size={32} />
                     </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">2. Find or Post</h3>
                  <p className="text-gray-500 leading-relaxed max-w-xs">Browse local listings for jobs and items, or post your own request for help.</p>
               </div>

               {/* Step 3 */}
               <div className="relative flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-white rounded-full border border-gray-100 shadow-lg flex items-center justify-center mb-6 relative z-10 group transition-transform hover:scale-110 duration-300">
                     <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Handshake size={32} />
                     </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">3. Connect & Trade</h3>
                  <p className="text-gray-500 leading-relaxed max-w-xs">Chat securely, agree on terms, and meet up to exchange goods or services.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Services Section */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
             <div>
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Explore listings</h2>
                <p className="text-lg md:text-xl text-gray-500 max-w-xl">From helping hands to hidden gems, discover what your community has to offer.</p>
             </div>
             <button 
                onClick={() => navigate('/explore')}
                className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all"
             >
                View all categories <ArrowRight size={20} />
             </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Card 1 */}
            <div 
                onClick={() => navigate('/explore')}
                className="group bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:-translate-y-1"
            >
              <div className="h-48 rounded-[1.5rem] overflow-hidden mb-5 relative">
                <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&auto=format&fit=crop" alt="Jobs" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform scale-0 group-hover:scale-100 duration-300">
                    <ArrowRight size={14} className="text-primary" />
                </div>
              </div>
              <div className="px-3 pb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">Local Jobs</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Find quick gigs, moving help, or professional services nearby.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div 
                onClick={() => navigate('/explore')}
                className="group bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:-translate-y-1"
            >
              <div className="h-48 rounded-[1.5rem] overflow-hidden mb-5 relative">
                <img src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=800&auto=format&fit=crop" alt="Volunteering" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform scale-0 group-hover:scale-100 duration-300">
                    <ArrowRight size={14} className="text-primary" />
                </div>
              </div>
              <div className="px-3 pb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">Volunteering</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Connect with local causes and lend a hand to those in need.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div 
                onClick={() => navigate('/explore')}
                className="group bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:-translate-y-1"
            >
              <div className="h-48 rounded-[1.5rem] overflow-hidden mb-5 relative">
                <img src="https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=800&auto=format&fit=crop" alt="Events" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform scale-0 group-hover:scale-100 duration-300">
                    <ArrowRight size={14} className="text-primary" />
                </div>
              </div>
              <div className="px-3 pb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">Events</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Block parties, garage sales, and community meetups.</p>
              </div>
            </div>

             {/* Card 4 */}
            <div 
                onClick={() => navigate('/explore')}
                className="group bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:-translate-y-1"
            >
              <div className="h-48 rounded-[1.5rem] overflow-hidden mb-5 relative">
                <img src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=800&auto=format&fit=crop" alt="Marketplace" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform scale-0 group-hover:scale-100 duration-300">
                    <ArrowRight size={14} className="text-primary" />
                </div>
              </div>
              <div className="px-3 pb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">Buy & Sell</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Trade goods, sell old items, or find free treasures.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Section - Redesigned */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 z-0">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-widest mb-6">
                <Shield size={14} className="text-emerald-400" />
                <span>Uncompromised Safety</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Trust is our currency.
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed">
              We've engineered MyCircle to be the safest place to connect with neighbors. From verified identities to secure payments, we've got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {/* Feature 1 */}
             <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors group">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                    <UserCheck className="text-white" size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3">Verified Identities</h3>
                <p className="text-gray-400 leading-relaxed">
                   Every member verifies their identity and address before they can post or reply. No bots, no scams, just real neighbors.
                </p>
             </div>

             {/* Feature 2 */}
             <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors group">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Lock className="text-white" size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3">Secure Transactions</h3>
                <p className="text-gray-400 leading-relaxed">
                   Funds are held securely in escrow until the job is done or the item is exchanged. Your money is safe until you're satisfied.
                </p>
             </div>

             {/* Feature 3 */}
             <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors group">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Star className="text-white" size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3">Community Vetted</h3>
                <p className="text-gray-400 leading-relaxed">
                   Our robust review system ensures accountability. Bad actors are swiftly removed to keep the circle safe and friendly.
                </p>
             </div>
          </div>
          
          <div className="mt-16 text-center">
             <button onClick={() => navigate('/signup')} className="inline-flex items-center gap-2 text-white font-bold border-b border-white pb-0.5 hover:text-primary hover:border-primary transition-colors">
                Read our Community Guidelines <ArrowRight size={16} />
             </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 pt-16 md:pt-24 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
           <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                 <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">M</span>
                 </div>
                 <span className="font-bold text-xl text-gray-900">MyCircle</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                 Connecting neighborhoods one handshake at a time. The safest way to buy, sell, and help locally.
              </p>
              <div className="flex gap-4">
                  {/* Social Placeholders */}
                  <div className="w-8 h-8 bg-gray-200 rounded-full hover:bg-primary transition-colors cursor-pointer"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full hover:bg-primary transition-colors cursor-pointer"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full hover:bg-primary transition-colors cursor-pointer"></div>
              </div>
           </div>
           
           <div>
              <h4 className="font-bold text-gray-900 mb-6">Discover</h4>
              <ul className="space-y-3 md:space-y-4 text-sm text-gray-500">
                 <li><a href="#" className="hover:text-primary transition-colors">Trust & Safety</a></li>
                 <li><a href="#" className="hover:text-primary transition-colors">Gift Cards</a></li>
                 <li><a href="#" className="hover:text-primary transition-colors">MyCircle Picks</a></li>
                 <li><a href="#" className="hover:text-primary transition-colors">Mobile App</a></li>
                 <li><a href="#" className="hover:text-primary transition-colors">Site Map</a></li>
              </ul>
           </div>
           
           <div>
              <h4 className="font-bold text-gray-900 mb-6">Hosting</h4>
              <ul className="space-y-3 md:space-y-4 text-sm text-gray-500">
                 <li><a href="#" className="hover:text-primary transition-colors">Post a Job</a></li>
                 <li><a href="#" className="hover:text-primary transition-colors">Organize Event</a></li>
                 <li><a href="#" className="hover:text-primary transition-colors">Community Rules</a></li>
                 <li><a href="#" className="hover:text-primary transition-colors">Resource Center</a></li>
              </ul>
           </div>

           <div>
              <h4 className="font-bold text-gray-900 mb-6">Support</h4>
              <ul className="space-y-3 md:space-y-4 text-sm text-gray-500">
                 <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                 <li><a href="#" className="hover:text-primary transition-colors">Cancellation Options</a></li>
                 <li><a href="#" className="hover:text-primary transition-colors">Neighborhood Support</a></li>
              </ul>
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
           <p className="text-gray-400 text-sm">© 2024 MyCircle Marketplace, Inc.</p>
           <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-900">Privacy</a>
              <a href="#" className="hover:text-gray-900">Terms</a>
              <a href="#" className="hover:text-gray-900">Sitemap</a>
           </div>
        </div>
      </footer>
    </div>
  );
};