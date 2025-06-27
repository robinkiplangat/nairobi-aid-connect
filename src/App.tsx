import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import Login from "./pages/partner/Login";
import CaseManagement from "./pages/partner/CaseManagement";
import Settings from "./pages/partner/Settings";
import VolunteerManagement from "./pages/partner/VolunteerManagement";
import ResourceStatus from "./pages/partner/ResourceStatus";
import TeamAvailability from "./pages/partner/TeamAvailability";
import CollaborationHub from "./pages/partner/CollaborationHub";
import { ThemeProvider } from "./components/ui/ThemeProvider";

const queryClient = new QueryClient();

const App = () => (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/partner" element={<PartnerDashboard />} />
                        <Route path="/partner/dashboard" element={<PartnerDashboard />} />
                        <Route path="/partner/login" element={<Login />} />
                        <Route path="/partner/cases" element={<CaseManagement />} />
                        <Route path="/partner/volunteers" element={<VolunteerManagement />} />
                        <Route path="/partner/resource-status" element={<ResourceStatus />} />
                        <Route path="/partner/team-availability" element={<TeamAvailability />} />
                        <Route path="/partner/collaboration-hub" element={<CollaborationHub />} />
                        <Route path="/partner/settings" element={<Settings />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            </TooltipProvider>
        </QueryClientProvider>
    </ThemeProvider>
);

export default App;
