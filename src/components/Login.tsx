import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Diamond } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex flex-col items-center justify-center p-6 text-white text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="space-y-4">
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="flex justify-center"
          >
            <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-xl">
              <Diamond size={64} className="text-yellow-400" />
            </div>
          </motion.div>
          
          <h1 className="text-4xl font-bold tracking-tight">
            SELAMAT DATANG<br />DI<br />
            <span className="text-yellow-400">CASINO ROYAL</span>
          </h1>
          <p className="text-purple-100 text-lg">
            Masuk untuk mulai bermain dan dapatkan 1.000 Chip gratis!
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-purple-700 font-bold py-4 px-8 rounded-2xl shadow-xl hover:bg-purple-50 transition-colors"
        >
          <LogIn size={24} />
          Masuk dengan Google
        </motion.button>
      </motion.div>
      
      <div className="mt-12 text-sm text-purple-200 opacity-60">
        © 2026 Casino Royal Slots. Main dengan Bijak.
      </div>
    </div>
  );
}
