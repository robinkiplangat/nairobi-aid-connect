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
      case 'Low': return 'default';
      default: return 'outline';
    }
  };

  const case_ = selectedCase ? cases.find(c => c.id === selectedCase) : null;

  return (
    <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-gray-200/50 dark:border-border sticky top-24">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">Case Details</CardTitle>
        <CardDescription className="text-gray-600 dark:text-muted-foreground">
          {selectedCase ? `Case #${selectedCase}` : 'Select a case to view details'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {case_ ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-gray-900 dark:text-foreground">Request Type</h4>
                <Badge variant="outline" className="font-medium">{case_.type}</Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-900 dark:text-foreground">Status</h4>
                <Badge variant={getStatusColor(case_.status)} className="font-medium">{case_.status}</Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-900 dark:text-foreground">Priority</h4>
                <Badge variant={getPriorityColor(case_.priority)} className="font-medium">{case_.priority}</Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-900 dark:text-foreground">Location</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground mb-1">{case_.location}</p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground/80">
                  {case_.coordinates.lat}, {case_.coordinates.lng}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-900 dark:text-foreground">Description</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">{case_.description}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-900 dark:text-foreground">Requested At</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">{case_.requestedAt}</p>
              </div>

              {case_.volunteer && (
                <div>
                  <h4 className="font-medium mb-2 text-gray-900 dark:text-foreground">Assigned Volunteer</h4>
                  <p className="text-sm text-gray-600 dark:text-muted-foreground">{case_.volunteer}</p>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-border">
              {case_.status === 'Pending' && (
                <Button className="w-full bg-gray-900 dark:bg-primary hover:bg-gray-800 dark:hover:bg-primary/90 text-white dark:text-primary-foreground" size="sm">
                  Assign Volunteer
                </Button>
              )}
              {case_.status === 'Active' && (
                <Button variant="outline" className="w-full bg-white/80 dark:bg-card hover:bg-white dark:hover:bg-card/80" size="sm">
                  Mark as Resolved
                </Button>
              )}
              <Button variant="outline" className="w-full bg-white/80 dark:bg-card hover:bg-white dark:hover:bg-card/80" size="sm">
                Contact Volunteer
              </Button>
              <Button variant="outline" className="w-full bg-white/80 dark:bg-card hover:bg-white dark:hover:bg-card/80" size="sm">
                View on Map
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>Select a case from the list to view details</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CaseDetails;
