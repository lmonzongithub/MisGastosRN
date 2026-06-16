import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { getFirestore } from 'firebase/firestore';
import app from './firebase';
import { Expense } from '../models/expense';

const db = getFirestore(app);

const EXPENSES_COLLECTION = 'expenses';

export const createExpense = async (expense: Expense) => {
  return addDoc(collection(db, EXPENSES_COLLECTION), expense);
};

export const getExpensesByUser = async (userId: string) => {
  const q = query(
    collection(db, EXPENSES_COLLECTION),
    where('userId', '==', userId),
   
  );

  const snapshot = await getDocs(q);

  const expenses= snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  })) as Expense[];

  return expenses.sort((a, b) => b.date - a.date);
};

export const updateExpense = async (
  id: string,
  expense: Partial<Expense>
) => {
  const expenseRef = doc(db, EXPENSES_COLLECTION, id);
  return updateDoc(expenseRef, expense);
};

export const deleteExpense = async (id: string) => {
  const expenseRef = doc(db, EXPENSES_COLLECTION, id);
  return deleteDoc(expenseRef);
};