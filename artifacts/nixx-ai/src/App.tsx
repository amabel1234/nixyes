import React from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/DashboardPage";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/not-found";
import TermsPage from "@/pages/TermsPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

function Spinner() {
  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "hsl(248, 30%, 6%)",
      flexDirection: "column", gap: "1rem",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        border: "3px solid rgba(168,85,247,0.2)",
        borderTopColor: "#a855f7",
        animation: "spin .7s linear infinite",
      }} />
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      <p style={{ color: "rgba(168,85,247,0.7)", fontSize: 14, margin: 0 }}>Memuat...</p>
    </div>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;

  return (
    <Switch>
      <Route path="/sign-in">
        {user ? <Redirect to="/dashboard" /> : <AuthPage defaultMode="login" />}
      </Route>
      <Route path="/sign-up">
        {user ? <Redirect to="/dashboard" /> : <AuthPage defaultMode="register" />}
      </Route>
      <Route path="/dashboard">
        {user ? <DashboardPage /> : <Redirect to="/sign-in" />}
      </Route>
      <Route path="/syarat">
        <TermsPage />
      </Route>
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <LandingPage />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={basePath}>
          <AppRoutes />
        </WouterRouter>
      </QueryClientProvider>
    </AuthProvider>
  );
}
