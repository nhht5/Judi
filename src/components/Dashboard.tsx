import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Users, Trophy, LayoutGrid, Home, Bell, User as UserIcon, Share2, Copy, Check, Diamond, Coins } from 'lucide-react';
import SlotMachine from './SlotMachine';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';

interface DashboardProps {
  user: UserProfile;
}

type Tab = 'home' | 'wallet' | 'referral' | 'profile';

export default function Dashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [copied, setCopied] = useState(false);
  const [selectedTopup, setSelectedTopup] = useState<number | null>(null);
  const [showPaymentStep, setShowPaymentStep] = useState(false);

  const DANA_LINK = "https://link.dana.id/minta?full_url=https://qr.dana.id/v1/281012012025100562830991";
  const TOPUP_DENOMINATIONS = [
    { label: '5K', value: 5000 },
    { label: '10K', value: 10000 },
    { label: '20K', value: 20000 },
    { label: '50K', value: 50000 },
    { label: '100K', value: 100000 },
  ];

  const referralLink = `${window.location.origin}?ref=${user.referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTopup = async () => {
    if (!selectedTopup) return;

    try {
      await addDoc(collection(db, 'transactions'), {
        uid: user.uid,
        amount: selectedTopup,
        type: 'topup',
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Redirect to DANA
      window.open(DANA_LINK, '_blank');
      
      alert('Anda akan diarahkan ke aplikasi DANA. Silakan selesaikan transaksi dan kirimkan bukti ke Admin.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions', auth.currentUser);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-24">
      {/* Header */}
      <div className="bg-[#6366f1] text-white p-6 rounded-b-[40px] shadow-lg sticky top-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <img src={user.photoURL} alt="profile" referrerPolicy="no-referrer" className="w-12 h-12 rounded-full border-2 border-white/50" />
            <div>
              <p className="text-sm opacity-80">Halo, {user.displayName}</p>
              <h2 className="font-bold">ID Pemain: {user.uid.slice(0, 8)}</h2>
            </div>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-md flex items-center gap-2 border border-white/30"
          >
            <Trophy size={18} className="text-yellow-400" />
            <span className="font-bold">{user.chips.toLocaleString()}</span>
          </motion.div>
        </div>
      </div>

      <main className="max-w-md mx-auto mt-[-20px] px-4 space-y-6">
        {activeTab === 'home' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
              <h3 className="text-gray-500 text-sm font-semibold mb-4 uppercase tracking-wider">Kategori Game</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Slots', icon: <Trophy className="text-orange-500" />, color: 'bg-orange-50' },
                  { name: 'Kasino', icon: <Diamond className="text-purple-500" />, color: 'bg-purple-50' },
                  { name: 'Poker', icon: <LayoutGrid className="text-blue-500" />, color: 'bg-blue-50' },
                  { name: 'Undang', icon: <Users className="text-green-500" />, color: 'bg-green-50' },
                ].map((cat) => (
                  <motion.button
                    key={cat.name}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => cat.name === 'Undang' && setActiveTab('referral')}
                    className={`${cat.color} p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-gray-100 shadow-sm`}
                  >
                    {cat.icon}
                    <span className="font-bold text-gray-700">{cat.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            
            <SlotMachine user={user} />
          </motion.div>
        )}

        {activeTab === 'wallet' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl p-8 shadow-md space-y-8">
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-1 uppercase font-bold tracking-widest">Total Chip</p>
              <h2 className="text-4xl font-black text-[#6366f1]">{user.chips.toLocaleString()}</h2>
            </div>
            
            {!showPaymentStep ? (
              <div className="space-y-6">
                <h3 className="text-center font-bold text-gray-700">Pilih Nominal Top Up</h3>
                <div className="grid grid-cols-2 gap-3">
                  {TOPUP_DENOMINATIONS.map((denom) => (
                    <button
                      key={denom.value}
                      onClick={() => setSelectedTopup(denom.value)}
                      className={`p-4 rounded-2xl font-bold transition-all border-2 ${
                        selectedTopup === denom.value
                          ? 'bg-[#6366f1] border-[#6366f1] text-white shadow-lg'
                          : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-[#6366f1]/30'
                      }`}
                    >
                      {denom.label}
                    </button>
                  ))}
                </div>
                
                <button
                  disabled={!selectedTopup}
                  onClick={() => setShowPaymentStep(true)}
                  className={`w-full py-4 rounded-2xl font-bold transition-all ${
                    selectedTopup 
                      ? 'bg-[#6366f1] text-white shadow-xl active:scale-95' 
                      : 'bg-gray-300 text-white cursor-not-allowed'
                  }`}
                >
                  Lanjutkan
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                  <p className="text-sm text-blue-600 font-medium">Metode Pembayaran</p>
                  <h4 className="text-2xl font-black text-blue-900">DANA APK</h4>
                </div>

                <div className="space-y-4">
                  <p className="text-center text-gray-500 text-sm">
                    Anda akan diarahkan ke aplikasi DANA untuk membayar 
                    <span className="font-bold text-gray-800"> Rp{selectedTopup?.toLocaleString()}</span>.
                  </p>
                  
                  <button
                    onClick={handleTopup}
                    className="w-full bg-[#008fee] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg"
                  >
                    BAYAR LEWAT DANA
                  </button>

                  <button
                    onClick={() => setShowPaymentStep(false)}
                    className="w-full text-gray-400 font-medium py-2 text-sm"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 bg-[#f3f4f6] text-gray-700 py-4 rounded-2xl border border-gray-100 font-bold opacity-50 cursor-not-allowed">
                <ArrowUpCircle size={20} />
                Tarik Saldo
              </button>
              <button className="flex items-center justify-center gap-2 bg-[#f3f4f6] text-gray-700 py-4 rounded-2xl border border-gray-100 font-bold opacity-50 cursor-not-allowed">
                <Share2 size={20} />
                Riwayat
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'referral' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl p-8 shadow-md space-y-6">
            <div className="text-center space-y-2">
              <Users size={48} className="mx-auto text-green-500" />
              <h2 className="text-2xl font-black">Undang Teman</h2>
              <p className="text-gray-500">Dapatkan 500 chip gratis untuk setiap teman yang mendaftar!</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-300">
              <p className="text-xs text-gray-400 mb-2 uppercase font-bold">Link Referral Anda</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 truncate text-sm font-mono">{referralLink}</p>
                <button onClick={copyToClipboard} className="p-2 text-[#6366f1] hover:bg-[#6366f1]/10 rounded-lg">
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-2xl">
                <span className="text-gray-600 font-medium">Teman Bergabung:</span>
                <span className="font-bold text-green-700 text-lg">0</span>
              </div>
              <button className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl shadow-md">
                Bagikan via WhatsApp
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl p-8 shadow-md space-y-6">
            <div className="text-center">
              <img src={user.photoURL} alt="profile" referrerPolicy="no-referrer" className="w-24 h-24 rounded-full mx-auto border-4 border-[#6366f1]/10 mb-4" />
              <h2 className="text-xl font-bold">{user.displayName}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
            
            <div className="space-y-3">
              <button className="w-full text-left p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                <span className="font-medium">Edit Profil</span>
                <ArrowUpCircle className="rotate-90 text-gray-400" size={20} />
              </button>
              <button className="w-full text-left p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                <span className="font-medium">Keamanan Akun</span>
                <ArrowUpCircle className="rotate-90 text-gray-400" size={20} />
              </button>
              <button 
                onClick={() => import('../lib/firebase').then(m => m.logout())}
                className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-bold mt-4"
              >
                Keluar
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 pb-8 z-20">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <NavBtn icon={<Home size={24} />} label="Beranda" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavBtn icon={<Wallet size={24} />} label="Dompet" active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
          <NavBtn icon={<Bell size={24} />} label="Notif" />
          <NavBtn icon={<UserIcon size={24} />} label="Profil" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </div>
      </div>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-[#6366f1]' : 'text-gray-400'}`}>
      <motion.div whileTap={{ scale: 0.8 }}>{icon}</motion.div>
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}
