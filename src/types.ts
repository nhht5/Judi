import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  chips: number;
  referralCode: string;
  referredBy?: string | null;
  createdAt: Timestamp;
}

export interface Transaction {
  id?: string;
  uid: string;
  type: 'topup' | 'withdraw';
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: Timestamp;
}

export interface SpinRecord {
  id?: string;
  uid: string;
  betAmount: number;
  winAmount: number;
  result: number[];
  createdAt: Timestamp;
}
