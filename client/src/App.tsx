import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ChallengePage from "@/pages/challenge-page";
import ProgressPage from "@/pages/progress-page";
import SharePage from "@/pages/share-page";
import ConnectionsPage from "@/pages/connections-page";
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/share/:userId/:challengeId" component={SharePage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/challenges/:id" component={ChallengePage} />
      <ProtectedRoute path="/progress" component={ProgressPage} />
      <ProtectedRoute path="/connections" component={ConnectionsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
