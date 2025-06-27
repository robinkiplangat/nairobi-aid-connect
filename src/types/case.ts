
export interface Case {
  id: number;
  type: 'Medical' | 'Legal' | 'Shelter';
  status: 'Active' | 'Pending' | 'Resolved';
  location: string;
  coordinates: { lat: number; lng: number };
  requestedAt: string;
  description: string;
  volunteer: string | null;
  priority: 'High' | 'Medium' | 'Low';
}

export type CaseStatus = 'Active' | 'Pending' | 'Resolved';
export type CasePriority = 'High' | 'Medium' | 'Low';
