import React from 'react';
import { CreditCard } from 'lucide-react';
import { EmiItem } from '../types.js';
import { FinancialNotebookPage } from './FinancialNotebookPage.js';

interface EmisPageProps {
  incomes: any[];
  emis: EmiItem[];
  investments: any[];
  savings: any[];
  notes: any[];
  onAddIncome: (data: any) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
  onAddEmi: (data: any) => Promise<void>;
  onUpdateEmi: (id: string, data: any) => Promise<void>;
  onDeleteEmi: (id: string) => Promise<void>;
  onAddInvestment: (data: any) => Promise<void>;
  onUpdateInvestment: (id: string, data: any) => Promise<void>;
  onDeleteInvestment: (id: string) => Promise<void>;
  onAddSaving: (data: any) => Promise<void>;
  onUpdateSaving: (id: string, data: any) => Promise<void>;
  onDeleteSaving: (id: string) => Promise<void>;
  onSaveNote: (content: string) => Promise<void>;
}

export const EmisPage: React.FC<EmisPageProps> = (props) => {
  return <FinancialNotebookPage {...props} />;
};
