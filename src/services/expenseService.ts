import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';

import { auth, db } from './firebase';
import { Expense } from '../models/expense';

function getCurrentUserId(): string {
  const userId = auth.currentUser?.uid;

  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  return userId;
}

function getExpensesCollectionRef() {
  const userId = getCurrentUserId();
  return collection(db, 'usuarios', userId, 'gastos');
}

export const createExpense = async (
  expense: Omit<Expense, 'id'>
) => {
  const expensesRef = getExpensesCollectionRef();

  const now = Date.now();

  return addDoc(expensesRef, {
    ...expense,
    createdAt: now,
    updatedAt: now,
  });
};

export const getExpensesByUser = async () => {
  const expensesRef = getExpensesCollectionRef();

  const q = query(
    expensesRef,
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  })) as Expense[];
};

export const getExpenseById = async (
  id: string
): Promise<Expense | null> => {
  const userId = getCurrentUserId();

  const expenseRef = doc(db, 'usuarios', userId, 'gastos', id);
  const snapshot = await getDoc(expenseRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Expense;
};

export const updateExpense = async (
  id: string,
  expense: Partial<Expense>
) => {
  const userId = getCurrentUserId();

  const expenseRef = doc(db, 'usuarios', userId, 'gastos', id);

  return updateDoc(expenseRef, {
    ...expense,
    updatedAt: Date.now(),
  });
};

export const deleteExpense = async (id: string) => {
  const userId = getCurrentUserId();

  const expenseRef = doc(db, 'usuarios', userId, 'gastos', id);

  return deleteDoc(expenseRef);
};

export const getMonthlyTotal = async (): Promise<number> => {
  const expenses = await getExpensesByUser();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date);

      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    })
    .reduce((total, expense) => total + expense.amount, 0);
};