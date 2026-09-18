import React from 'react';
import { UserCheck, Shield, Trash2 } from 'lucide-react';
import { GlassCard } from './GlassCard.js';

interface FamilyMemberCardProps {
  member: {
    id: string;
    name: string;
    relation: string;
    role: string;
    avatar?: string;
  };
  onDelete?: (id: string) => void;
}

export const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({ member, onDelete }) => {
  return (
    <GlassCard className="p-4 flex items-center justify-between relative group">
      <div className="flex items-center gap-3">
        <img
          src={member.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(member.name)}`}
          alt={member.name}
          className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500/30"
        />
        <div>
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            {member.name}
          </h4>
          <span className="text-xs text-slate-400">{member.relation}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
            member.role === 'OWNER'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : member.role === 'EDITOR'
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              : 'bg-slate-500/10 text-slate-300 border-slate-500/20'
          }`}
        >
          {member.role}
        </span>
        {onDelete && member.role !== 'OWNER' && (
          <button
            onClick={() => onDelete(member.id)}
            className="p-1 rounded text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </GlassCard>
  );
};
