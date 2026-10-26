import React, { useState, useEffect } from "react";
import { Spinner } from './components/Loading';
import "@/App.css";
import "@/lib/microAnimations.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TooltipProvider } from "./contexts/TooltipContext";
import { Toaster } from "@/components/ui/sonner";
import { Onboarding } from "./components/Onboarding";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CollectionPage from "./pages/CollectionPage";
import CarePage from "./pages/CarePage";
import CareGrowthPage from "./pages/CareGrowthPage";
import RoomPage from "./pages/RoomPage";
import PlantDetailPage from "./pages/PlantDetailPage";
import AddPlantPage from "./pages/AddPlantPage";
import ProfilePage from "./pages/ProfilePage";
import BouquetsPage from "./pages/BouquetsPage";
import AddBouquetPage from "./pages/AddBouquetPage";
import BouquetDetailPage from "./pages/BouquetDetailPage";
import FeedPage from "./pages/FeedPage";
import GrovesPage from "./pages/GrovesPage";
import GroveDetailPage from "./pages/GroveDetailPage";
import PublicBouquetPage from "./pages/PublicBouquetPage";
import HelpPage from "./pages/HelpPage";
import LessonsPage from "./pages/LessonsPage";
import LessonPage from "./pages/LessonPage";
import QuizFlow from "./components/QuizFlow";
import { shouldShowQuiz } from "./lessons/quizGate";
import { lessonPath } from "./lessons/lessonMeta";
// Phase 14C.4 — GoalsPage deprecated. Goals are now pinned locked badges
// surfaced on /care/today. /care/goals redirects to /care/today.
import ChallengesPage from "./pages/ChallengesPage";
import FloristDashboard from "./pages/FloristDashboard";
import NotificationsPage from "./pages/NotificationsPage";
import EncyclopediaPage from "./pages/EncyclopediaPage";
import SpeciesDetailPage from "./pages/SpeciesDetailPage";
import GuildDetailPage from "./pages/GuildDetailPage";
import WantListPage from "./pages/WantListPage";
import SwapsPage from "./pages/SwapsPage";
import VerifyPage from "./pages/VerifyPage";
import BadgesPage from "./pages/BadgesPage";
import AdminDemoPage from "./pages/AdminDemoPage";
import SwapPage from "./pages/SwapPage";
import SwapMatchesPage from "./pages/SwapMatchesPage";
import SwapChatPage from "./pages/SwapChatPage";
import WishlistPage from "./pages/WishlistPage";
import NotificationPreferencesPage from "./pages/NotificationPreferencesPage";
import WaitlistPage from "./pages/WaitlistPage";
import BottomNav from "./components/BottomNav";
import HelpMyPlantPage from "./pages/HelpMyPlantPage";
import SearchPage from "./pages/SearchPage";
import NotFoundPage from "./pages/NotFoundPage";
import CareLayout from "./components/CareLayout";
import LoadError from "./components/LoadError";
import { Analytics } from "@vercel/analytics/react";
import ErrorBoundary from "./components/ErrorBoundary";

// The free server sleeps when quiet, so the first open can take about a minute. Say so.
function SlowStartNote() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, []);
  if (!slow) return null;
  return <p className="mt-2 font-ui text-sm text-grove-sage" data-testid="slow-start">Waking up. The first open after a quiet spell can take about a minute.</p>;
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-grove-forest">
      <div className="text-center" role="status">
        <Spinner className="mx-auto mb-3 block h-8 w-8" />
        <p className="font-plant text-grove-cream text-lg">Loading FloraGrove…</p>
        <SlowStartNote />
      </div>
    </div>
  );
}

// Signed-in only. Everyone else goes to /login.
function RequireUser({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// After a route change, move focus to the page so keyboard and screen-reader users start at its top.
// Both layouts use it, so moving between them keeps focus managed too; only the very first load is skipped.
let focusHookSeen = false;
function useFocusMainOnRoute() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!focusHookSeen) { focusHookSeen = true; return; }
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [pathname]);
}

// Signed-in screens that fill the whole viewport and carry their own chrome (no tab bar).
function ProtectedFullScreen() {
  useFocusMainOnRoute();
  return (
    <RequireUser>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-tip focus:flex focus:min-h-touch focus:items-center focus:rounded-control focus:bg-grove-lime focus:px-4 focus:font-ui focus:text-grove-root"
      >
        Skip to content
      </a>
      <main id="main-content" tabIndex={-1} aria-labelledby="page-title" className="focus:outline-none"><ErrorBoundary><Outlet /></ErrorBoundary></main>
    </RequireUser>
  );
}

// The one shell: a layout route, so the tab bar and the page frame stay mounted while the
// route inside changes, instead of remounting on every navigation.
function ProtectedShell() {
  useFocusMainOnRoute();
  return (
    <RequireUser>
      <div className="min-h-screen bg-grove-forest pb-nav">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-tip focus:flex focus:min-h-touch focus:items-center focus:rounded-control focus:bg-grove-lime focus:px-4 focus:font-ui focus:text-grove-root"
        >
          Skip to content
        </a>
        <a
          href="#main-nav"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-16 focus:z-tip focus:flex focus:min-h-touch focus:items-center focus:rounded-control focus:bg-grove-lime focus:px-4 focus:font-ui focus:text-grove-root"
        >
          Skip to navigation
        </a>
        <main id="main-content" tabIndex={-1} aria-labelledby="page-title" className="focus:outline-none"><Outlet /></main>
        <BottomNav />
      </div>
    </RequireUser>
  );
}

// Care's two views share one layout (first-visit tooltip for the active sub-tab).
function CareShell() {
  return <CareLayout><Outlet /></CareLayout>;
}

function AppRoutes() {
  const { user, loading, bootError, fetchUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  // /first-run replays the slides and the quiz for any signed-in account,
  // whatever its age or saved track, so the first-run flow can always be seen.
  const [replayFirstRun, setReplayFirstRun] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Inside the desktop phone preview, report the route so the outer address bar follows along.
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'grove-route', path: `${location.pathname}${location.search}` }, window.location.origin);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (location.pathname !== '/first-run' || loading || !user) return;
    setQuizDone(false);
    setReplayFirstRun(true);
    setShowOnboarding(true);
    navigate('/', { replace: true });
  }, [location.pathname, loading, user, navigate]);

  useEffect(() => {
    if (!loading && user && user.onboarding_complete === false) {
      setShowOnboarding(true);
    }
  }, [user, loading]);

  const handleOnboardingComplete = (choice) => {
    setShowOnboarding(false);
    // Someone who said what they came for goes there; the quiz can wait for a later visit.
    if (choice?.to) {
      setQuizDone(true);
      setReplayFirstRun(false);
      navigate(choice.to);
    }
    // Onboarding saved this on the server; mirror it so the quiz can follow right away.
    updateUser({ onboarding_complete: true });
  };

  const showQuiz = !showOnboarding && !quizDone && (replayFirstRun || shouldShowQuiz(user));

  const handleQuizDone = (data) => {
    updateUser({ primary_track: data.primary_track });
    setQuizDone(true);
    setReplayFirstRun(false);
    const first = data.queue && data.queue[0];
    if (first) navigate(lessonPath(first));
  };

  if (loading) return <LoadingScreen />;

  if (bootError && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grove-forest px-4">
        <LoadError what="FloraGrove" onRetry={fetchUser} />
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      {showQuiz && <QuizFlow onDone={handleQuizDone} />}
      <Routes>
        {/* Outside every shell: signed-out pages, the public bouquet and the first-run replay. */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/bouquet/:slug" element={<PublicBouquetPage />} />
        <Route path="/first-run" element={user ? null : <Navigate to="/login" replace />} />
        <Route path="/waitlist" element={<WaitlistPage />} />

        {/* Signed in, full screen with no tab bar (see Deliberate departures in design/README.md). */}
        <Route element={<ProtectedFullScreen />}>
          <Route path="/lessons/:lessonId" element={<LessonPage />} />
          <Route path="/greenhouse/:speciesId" element={<SpeciesDetailPage />} />
          <Route path="/guilds/:slug" element={<GuildDetailPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/admin/demo" element={<AdminDemoPage />} />
        </Route>

        {/* Signed in, inside the shell (tab bar and page frame). */}
        <Route element={<ProtectedShell />}>
          <Route path="/help-my-plant" element={<HelpMyPlantPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/lessons" element={<LessonsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/plants" element={<CollectionPage />} />
          <Route element={<CareShell />}>
            <Route path="/care/today" element={<CarePage />} />
            <Route path="/care/growth" element={<CareGrowthPage />} />
          </Route>
          <Route path="/greenhouse" element={<EncyclopediaPage />} />
          <Route path="/wants" element={<WantListPage />} />
          <Route path="/swaps" element={<SwapsPage />} />
          <Route path="/badges" element={<BadgesPage />} />
          <Route path="/rooms" element={<RoomPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/plants/:plantId" element={<PlantDetailPage />} />
          <Route path="/add-plant" element={<AddPlantPage />} />
          <Route path="/bouquets" element={<BouquetsPage />} />
          <Route path="/bouquets/new" element={<AddBouquetPage />} />
          <Route path="/bouquets/:bouquetId" element={<BouquetDetailPage />} />
          <Route path="/groves" element={<GrovesPage />} />
          <Route path="/groves/:groveId" element={<GroveDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/florist" element={<FloristDashboard />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/swaps/matches" element={<SwapMatchesPage />} />
          <Route path="/swaps/:swapId" element={<SwapChatPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/settings/notifications" element={<NotificationPreferencesPage />} />
          {/* Anything else that signed-in people type or follow lands here, with a way home. */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Redirects. Goals, Challenges and the Encyclopedia moved; Today is home. */}
        <Route path="/" element={<Navigate to="/care/today" replace />} />
        <Route path="/care" element={<Navigate to="/care/today" replace />} />
        <Route path="/care/goals" element={<Navigate to="/care/today" replace />} />
        <Route path="/care/fieldnotes" element={<Navigate to="/greenhouse" replace />} />
        <Route path="/goals" element={<Navigate to="/care/goals" replace />} />
        <Route path="/encyclopedia" element={<Navigate to="/greenhouse" replace />} />
        <Route path="/encyclopedia/:speciesId" element={<Navigate to="/greenhouse" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <AppRoutes />
          <Toaster position="top-center" />
          <Analytics />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
