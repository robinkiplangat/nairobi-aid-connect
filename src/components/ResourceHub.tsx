import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export const ResourceHub: React.FC = () => {
  const emergencyContacts = [
    {
      name: "Law Society of Kenya (LSK)",
      number: "0800720434"
    },
    {
      name: "Defenders Coalition",
      number: "0716200100"
    },
    {
      name: "Independent Medico-Legal Unit (IMLU)",
      number: "0706162795 / 0800720627"
    },
    {
      name: "Kenya National Commission on Human Rights (KNCHR)",
      number: "08007260627"
    },
    {
      name: "Amnesty International Kenya",
      number: "0759464346"
    },
    {
      name: "Civic Freedoms Forum",
      number: "07283033864"
    },
    {
      name: "Kenya Human Rights Commission (KHRC)",number: "0728606583"
    }
  ];

  const safetyTips = [
    'Stay hydrated and carry water with you',
    'Keep emergency contacts easily accessible',
    'Stay in groups when possible',
    'Avoid confrontational situations',
    'Know the location of nearest safe zones',
    'Keep your phone charged',
  ];

  const firstAidBasics = [
    'Check for responsiveness and breathing',
    'Call for help immediately',
    'Apply pressure to bleeding wounds',
    'Do not move someone with potential spinal injury',
    'Place unconscious but breathing person in recovery position',
    'Learn CPR if possible',
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Resource Hub
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-white dark:bg-card">
        <SheetHeader>
          <SheetTitle className="dark:text-foreground">Resource Hub</SheetTitle>
          <SheetDescription className="dark:text-muted-foreground">
            Essential information and emergency contacts for Nairobi
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-6">
            {/* Emergency Contacts */}
            <div>
              <h3 className="text-lg font-semibold mb-3 dark:text-foreground">Emergency Contacts</h3>
              <div className="space-y-2">
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-background/50 rounded-lg">
                    <span className="font-medium dark:text-foreground">{contact.name}</span>
                    <a
                      href={`tel:${contact.number}`}
                      className="text-blue-600 dark:text-primary hover:text-blue-800 dark:hover:text-primary/90 font-mono"
                    >
                      {contact.number}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Tips */}
            <div>
              <h3 className="text-lg font-semibold mb-3 dark:text-foreground">Safety Tips</h3>
              <div className="space-y-2">
                {safetyTips.map((tip, index) => (
                  <div key={index} className="flex items-start p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                    <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                    <span className="text-sm dark:text-blue-300">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* First Aid Basics */}
            <div>
              <h3 className="text-lg font-semibold mb-3 dark:text-foreground">First Aid Basics</h3>
              <div className="space-y-2">
                {firstAidBasics.map((step, index) => (
                  <div key={index} className="flex items-start p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">
                    <span className="text-red-600 dark:text-red-400 mr-2 font-bold">{index + 1}.</span>
                    <span className="text-sm dark:text-red-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal Rights */}
            <div>
              <h3 className="text-lg font-semibold mb-3 dark:text-foreground">Know Your Rights</h3>
              <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-lg">
                <ul className="text-sm dark:text-green-300 space-y-2">
                  <li>• Right to peaceful assembly and demonstration</li>
                  <li>• Right to remain silent if detained</li>
                  <li>• Right to legal representation</li>
                  <li>• Right to medical attention if injured</li>
                  <li>• Right to contact family/lawyer if arrested</li>
                </ul>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
