import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import { PostHogProvider } from 'posthog-js/react';
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

// Initialize Sentry for error monitoring
// Focus on monitoring server API request errors
Sentry.init({
  dsn: "https://3da7e4d0ed31f8c85340d335ac72663c@o4507905002635264.ingest.us.sentry.io/4510833169793024",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Session Replay
  replaysSessionSampleRate: 0.1, // Sample 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors
});

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
    
    // Send API query errors to Sentry
    Sentry.captureException(error, {
      tags: {
        type: 'api_query_error',
      },
      contexts: {
        query: {
          queryKey: event.query.queryKey,
        },
      },
    });
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
    
    // Send API mutation errors to Sentry
    Sentry.captureException(error, {
      tags: {
        type: 'api_mutation_error',
      },
      contexts: {
        mutation: {
          mutationKey: event.mutation.options.mutationKey,
        },
      },
    });
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// PostHog configuration
const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

const posthogOptions = {
  api_host: posthogHost || 'https://us.i.posthog.com',
  person_profiles: 'identified_only' as const,
  capture_pageview: true,
  capture_pageleave: true,
};

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

// Only wrap with PostHogProvider if API key is available
if (posthogKey) {
  root.render(
    <PostHogProvider 
      apiKey={posthogKey} 
      options={posthogOptions}
    >
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    </PostHogProvider>
  );
} else {
  console.warn('[PostHog] API key not found, PostHog will not be initialized');
  root.render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
