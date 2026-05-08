import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { Coins, Play } from 'lucide-react';

const SYMBOLS = ['🍒', '🍋', '🔔', '💎', '7️⃣', '⭐'];
const BET_OPTIONS = [50, 100, 500, 1000, 5000];

interface SlotMachineProps {
  user: UserProfile;
}

export default function SlotMachine({ user }: SlotMachineProps) {
  const [reels, setReels] = useState([0, 0, 0]);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(100);

  const spin = async () => {
    if (spinning || user.chips < betAmount) return;

    setSpinning(true);
    setLastWin(null);

    // Simulate animation
    const interval = setInterval(() => {
      setReels([
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length)
      ]);
    }, 100);

    setTimeout(async () => {
      clearInterval(interval);
      const finalResult = [
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length)
      ];
      setReels(finalResult);
      setSpinning(false);

      // Check win
      let winMultiplier = 0;
      if (finalResult[0] === finalResult[1] && finalResult[1] === finalResult[2]) {
        winMultiplier = 10; // Jackpot
      } else if (finalResult[0] === finalResult[1] || finalResult[1] === finalResult[2] || finalResult[0] === finalResult[2]) {
        winMultiplier = 2; // Small win
      }

      const win = betAmount * winMultiplier;
      setLastWin(win > 0 ? win : null);

      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          chips: user.chips - betAmount + win
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth.currentUser);
      }

      try {
        await addDoc(collection(db, 'spins'), {
          uid: user.uid,
          betAmount: betAmount,
          winAmount: win,
          result: finalResult,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'spins', auth.currentUser);
      }
    }, 2000);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="bg-black/20 rounded-3xl p-6 border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
        <div className="flex justify-center gap-3 mb-6">
          {reels.map((symbolIndex, i) => (
            <motion.div
              key={i}
              animate={spinning ? { y: [0, -20, 20, 0] } : {}}
              transition={{ repeat: Infinity, duration: 0.1 }}
              className="w-16 h-24 bg-white rounded-xl flex items-center justify-center text-4xl shadow-inner border-2 border-gray-200"
            >
              {SYMBOLS[symbolIndex]}
            </motion.div>
          ))}
        </div>

        {/* Bet Selection */}
        <div className="flex justify-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {BET_OPTIONS.map((amount) => (
            <button
              key={amount}
              disabled={spinning}
              onClick={() => setBetAmount(amount)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                betAmount === amount 
                  ? 'bg-yellow-400 border-yellow-500 text-black shadow-lg scale-105' 
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>

        <button
          onClick={spin}
          disabled={spinning || user.chips < betAmount}
          className={`w-full py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-2 transition-all shadow-xl ${
            spinning || user.chips < betAmount 
              ? 'bg-gray-400 cursor-not-allowed opacity-50' 
              : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:scale-105 active:scale-95'
          }`}
        >
          {spinning ? 'SEDANG SPIN...' : (
            <>
              <Play fill="white" size={20} />
              SPIN ({betAmount.toLocaleString()})
            </>
          )}
        </button>
      </div>

      <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
        <div className="flex items-center gap-2 text-yellow-400 font-bold">
          <Coins size={20} />
          <span>SALDO: {user.chips.toLocaleString()}</span>
        </div>
        {lastWin !== null && lastWin > 0 && (
          <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="text-green-400 font-black text-xl drop-shadow-sm"
          >
            MENANG: +{lastWin}!
          </motion.div>
        )}
      </div>
      
      {user.chips < betAmount && !spinning && (
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-red-400 text-center font-medium text-sm"
        >
          Saldo tidak cukup. Silakan top up!
        </motion.p>
      )}
    </div>
  );
}
