
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { Case } from '@/types/case';

interface CaseCardProps {
  case_: Case;
  isSelected: boolean;
  onClick: () => void;
}

const CaseCard = ({ case_, isSelected, onClick }: CaseCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'destructive';
      case 'Pending': return 'secondary';
      case 'Resolved': return 'default';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div 
      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border border-blue-200 bg-blue-50/50 shadow-sm' 
          : 'border border-gray-100/50 bg-gray-50/30 hover:bg-gray-50/50 hover:border-gray-200/50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            case_.type === 'Medical' ? 'bg-red-50 text-red-600' :
            case_.type === 'Legal' ? 'bg-blue-50 text-blue-600' :
            'bg-green-50 text-green-600'
          }`}>
            {case_.type === 'Medical' ? <AlertTriangle className="h-4 w-4" /> :
             case_.type === 'Legal' ? <User className="h-4 w-4" /> :
             <CheckCircle className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{case_.type} Request</h3>
            <p className="text-sm text-gray-500">Case #{case_.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getPriorityColor(case_.priority)} className="font-medium">
            {case_.priority}
          </Badge>
          <Badge variant={getStatusColor(case_.status)} className="font-medium">
            {case_.status}
          </Badge>
        </div>
      </div>

      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
        <div className="flex items-center space-x-1">
          <MapPin className="h-4 w-4" />
          <span>{case_.location}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4" />
          <span>{case_.requestedAt}</span>
        </div>
      </div>

      {case_.volunteer && (
        <div className="text-sm">
          <span className="text-gray-500">Assigned to: </span>
          <span className="font-medium text-gray-900">{case_.volunteer}</span>
        </div>
      )}
    </div>
  );
};

export default CaseCard;
