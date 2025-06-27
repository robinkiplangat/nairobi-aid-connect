
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CaseCard from './CaseCard';
import { Case } from '@/types/case';

interface CaseListProps {
  cases: Case[];
  selectedCase: number | null;
  onSelectCase: (caseId: number) => void;
}

const CaseList = ({ cases, selectedCase, onSelectCase }: CaseListProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Active Cases</CardTitle>
        <CardDescription className="text-gray-600">Manage emergency requests and volunteer assignments</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-gray-50/80">
            <TabsTrigger value="all">All Cases</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {cases.map((case_) => (
              <CaseCard
                key={case_.id}
                case_={case_}
                isSelected={selectedCase === case_.id}
                onClick={() => onSelectCase(case_.id)}
              />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CaseList;
