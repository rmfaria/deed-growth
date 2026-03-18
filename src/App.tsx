import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Clientes from "./pages/Clientes";
import Contato from "./pages/Contato";
import LpTresVales from "./pages/LpTresVales";
import LpReservaPiedade from "./pages/LpReservaPiedade";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import Proposta from "./pages/Proposta";
import NotFound from "./pages/NotFound";
import CrmLogin from "./pages/CrmLogin";
import CrmDashboard from "./pages/crm/CrmDashboard";
import CrmPipeline from "./pages/crm/CrmPipeline";
import CrmLeads from "./pages/crm/CrmLeads";
import CrmCampaigns from "./pages/crm/CrmCampaigns";
import CrmReports from "./pages/crm/CrmReports";
import CrmIntegrations from "./pages/crm/CrmIntegrations";
import CrmWhatsApp from "./pages/crm/CrmWhatsApp";
import CrmSettings from "./pages/crm/CrmSettings";
import BotDashboard from "./pages/crm/BotDashboard";
import BotLeads from "./pages/crm/BotLeads";
import BotLeadDetail from "./pages/crm/BotLeadDetail";
import BotFlow from "./pages/crm/BotFlow";
import BotMaterials from "./pages/crm/BotMaterials";
import BotSettings from "./pages/crm/BotSettings";
import BotSend from "./pages/crm/BotSend";
import { CrmLayout } from "./components/crm/CrmLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/lp/tres-vales" element={<LpTresVales />} />
            <Route path="/lp/reserva-de-piedade" element={<LpReservaPiedade />} />
            <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/proposta" element={<Proposta />} />

            {/* CRM Login */}
            <Route path="/crm/login" element={<CrmLogin />} />

            {/* CRM protected routes */}
            <Route path="/crm" element={<CrmLayout><CrmDashboard /></CrmLayout>} />
            <Route path="/crm/pipeline" element={<CrmLayout><CrmPipeline /></CrmLayout>} />
            <Route path="/crm/leads" element={<CrmLayout><CrmLeads /></CrmLayout>} />
            <Route path="/crm/campaigns" element={<CrmLayout><CrmCampaigns /></CrmLayout>} />
            <Route path="/crm/reports" element={<CrmLayout><CrmReports /></CrmLayout>} />
            <Route path="/crm/integrations" element={<CrmLayout><CrmIntegrations /></CrmLayout>} />
            <Route path="/crm/whatsapp" element={<CrmLayout><CrmWhatsApp /></CrmLayout>} />
            <Route path="/crm/settings" element={<CrmLayout><CrmSettings /></CrmLayout>} />

            {/* Bot MBC routes */}
            <Route path="/crm/bot" element={<CrmLayout><BotDashboard /></CrmLayout>} />
            <Route path="/crm/bot/leads" element={<CrmLayout><BotLeads /></CrmLayout>} />
            <Route path="/crm/bot/leads/:id" element={<CrmLayout><BotLeadDetail /></CrmLayout>} />
            <Route path="/crm/bot/flow" element={<CrmLayout><BotFlow /></CrmLayout>} />
            <Route path="/crm/bot/send" element={<CrmLayout><BotSend /></CrmLayout>} />
            <Route path="/crm/bot/materials" element={<CrmLayout><BotMaterials /></CrmLayout>} />
            <Route path="/crm/bot/settings" element={<CrmLayout><BotSettings /></CrmLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
