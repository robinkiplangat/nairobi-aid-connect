
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { Case } from '@/types/case';

interface CaseDetailsProps {
  selectedCase: number | null;
  cases: Case[];
}

const CaseDetails = ({ selectedCase, cases }: CaseDetailsProps) => {
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

  const case_ = selectedCase ? cases.find(c => c.id === selectedCase) : null;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50 sticky top-24">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Case Details</CardTitle>
        <CardDescription className="text-gray-600">
          {selectedCase ? `Case #${selectedCase}` : 'Select a case to view details'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {case_ ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-gray-900">Request Type</h4>
                <Badge variant="outline" className="font-medium">{case_.type}</Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-900">Status</h4>
                <Badge variant={getStatusColor(case_.status)} className="font-medium">{case_.status}</Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-900">Priority</h4>
                <Badge variant={getPriorityColor(case_.priority)} className="font-medium">{case_.priority}</Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-900">Location</h4>
                <p className="text-sm text-gray-600 mb-1">{case_.location}</p>
                <p className="text-xs text-gray-500">
                  {case_.coordinates.lat}, {case_.coordinates.lng}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-900">Description</h4>
                <p className="text-sm text-gray-600">{case_.description}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-900">Requested At</h4>
                <p className="text-sm text-gray-600">{case_.requestedAt}</p>
              </div>

              {case_.volunteer && (
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">Assigned Volunteer</h4>
                  <p className="text-sm text-gray-600">{case_.volunteer}</p>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              {case_.status === 'Pending' && (
                <Button className="w-full bg-gray-900 hover:bg-gray-800" size="sm">
                  Assign Volunteer
                </Button>
              )}
              {case_.status === 'Active' && (
                <Button variant="outline" className="w-full bg-white/80 hover:bg-white" size="sm">
                  Mark as Resolved
                </Button>
              )}
              <Button variant="outline" className="w-full bg-white/80 hover:bg-white" size="sm">
                Contact Volunteer
              </Button>
              <Button variant="outline" className="w-full bg-white/80 hover:bg-white" size="sm">
                View on Map
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>Select a case from the list to view details</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CaseDetails;
