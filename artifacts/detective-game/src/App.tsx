import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Enter from "@/pages/enter";
import CasePage from "@/pages/case";
import InterrogatePage from "@/pages/interrogate";
import AccusePage from "@/pages/accuse";
import AdminPage from "@/pages/admin";
import PremiumPage from "@/pages/premium";
import Navbar from "@/components/navbar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function AppRoutes() {
  const [location] = useLocation();
  const isEnterPage = location === "/enter";

  return (
    <div className="min-h-screen bg-background crime-texture">
      {!isEnterPage && <Navbar />}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/enter" component={Enter} />
        <Route path="/case/:id" component={CasePage} />
        <Route path="/interrogate/:caseId/:suspectId" component={InterrogatePage} />
        <Route path="/accuse/:caseId" component={AccusePage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/premium" component={PremiumPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
