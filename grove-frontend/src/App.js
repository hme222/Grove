import React, { useState, useEffect } from "react";
import "@/App.css";
import "@/lib/microAnimations.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
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
import LandingVariations from "./pages/LandingVariations";
import WaitlistPage from "./pages/WaitlistPage";
import PostOnboarding from "./pages/PostOnboarding";
import QuickWinVariations from "./pages/QuickWinVariations";
import ResetCourseVariation from "./pages/ResetCourseVariation";
import WindowBlueprintVariations from "./pages/WindowBlueprintVariations";
import SoilFingerTestVariation from "./pages/SoilFingerTestVariation";
import PlantERVariations from "./pages/PlantERVariations";
import HabitStackingVariations from "./pages/HabitStackingVariations";
import PlantClusterVariations from "./pages/PlantClusterVariation";
import ChunkyAroidMixVariations from "./pages/ChunkyAroidMixVariations";
import DualPathLandingVariations from "./pages/DualPathLandingVariations";
import CozyRoomPlannerVariations from "./pages/CozyRoomPlannerVariations";
import BehavioralChangeWidgets from "./pages/BehavioralChangeWidgets";
import BottomNav from "./components/BottomNav";
import CareLayout from "./components/CareLayout";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-grove-forest">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-grove-fernLine border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-plant text-grove-cream text-lg">Loading Grove...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-grove-forest pb-[84px]">
      {children}
      <BottomNav />
    </div>
  );
}

function CareWrapper({ children }) {
  return (
    <AppLayout>
      <CareLayout>{children}</CareLayout>
    </AppLayout>
  );
}

function AppRoutes() {
  const { user, loading, updateUser } = useAuth();
  const navigate = useNavigate();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  // /first-run replays the slides and the quiz for any signed-in account,
  // whatever its age or saved track, so the first-run flow can always be seen.
  const [replayFirstRun, setReplayFirstRun] = useState(false);
  const location = useLocation();

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

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-grove-forest">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-grove-fernLine border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-plant text-grove-cream text-lg">Loading Grove...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      {showQuiz && <QuizFlow onDone={handleQuizDone} />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/bouquet/:slug" element={<PublicBouquetPage />} />
        <Route path="/first-run" element={user ? null : <Navigate to="/login" replace />} />
        <Route path="/landing" element={<LandingVariations />} />
        <Route path="/waitlist" element={<WaitlistPage />} />
        <Route path="/post-onboarding" element={<PostOnboarding />} />
        <Route path="/quick-wins" element={<QuickWinVariations />} />
        <Route path="/reset-course" element={<ResetCourseVariation />} />
        <Route path="/window-blueprint" element={<WindowBlueprintVariations />} />
        <Route path="/soil-finger-test" element={<SoilFingerTestVariation />} />
        <Route path="/plant-er" element={<PlantERVariations />} />
        <Route path="/habit-stacking" element={<HabitStackingVariations />} />
        <Route path="/plant-cluster" element={<PlantClusterVariations />} />
        <Route path="/chunky-aroid-mix" element={<ChunkyAroidMixVariations />} />
        <Route path="/dual-path-landing" element={<DualPathLandingVariations />} />
        <Route path="/cozy-room-planner" element={<CozyRoomPlannerVariations />} />
        <Route path="/behavioral-change-widgets" element={<BehavioralChangeWidgets />} />
        <Route path="/lessons" element={
          <ProtectedRoute>
            <AppLayout><LessonsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/lessons/:lessonId" element={
          <ProtectedRoute>
            <LessonPage />
          </ProtectedRoute>
        } />
        <Route path="/help" element={
          <ProtectedRoute>
            <HelpPage />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout><CollectionPage /></AppLayout>
          </ProtectedRoute>
        } />
        {/* Care sub-routes (nested) */}
        <Route path="/care" element={<Navigate to="/care/today" replace />} />
        <Route path="/care/today" element={
          <ProtectedRoute>
            <CareWrapper><CarePage /></CareWrapper>
          </ProtectedRoute>
        } />
        <Route path="/care/growth" element={
          <ProtectedRoute>
            <CareWrapper><CareGrowthPage /></CareWrapper>
          </ProtectedRoute>
        } />
        <Route path="/care/goals" element={<Navigate to="/care/today" replace />} />
        <Route path="/care/fieldnotes" element={<Navigate to="/greenhouse" replace />} />
        <Route path="/greenhouse" element={
          <ProtectedRoute>
            <AppLayout><EncyclopediaPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/greenhouse/:speciesId" element={
          <ProtectedRoute>
            <SpeciesDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/guilds/:slug" element={
          <ProtectedRoute>
            <GuildDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/wants" element={
          <ProtectedRoute>
            <AppLayout><WantListPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/swaps" element={
          <ProtectedRoute>
            <AppLayout><SwapsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/verify" element={
          <ProtectedRoute>
            <VerifyPage />
          </ProtectedRoute>
        } />
        <Route path="/badges" element={
          <ProtectedRoute>
            <AppLayout><BadgesPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/rooms" element={
          <ProtectedRoute>
            <AppLayout><RoomPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/feed" element={
          <ProtectedRoute>
            <AppLayout><FeedPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/plants/:plantId" element={
          <ProtectedRoute>
            <AppLayout><PlantDetailPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/add-plant" element={
          <ProtectedRoute>
            <AppLayout><AddPlantPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/bouquets" element={
          <ProtectedRoute>
            <AppLayout><BouquetsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/bouquets/new" element={
          <ProtectedRoute>
            <AppLayout><AddBouquetPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/bouquets/:bouquetId" element={
          <ProtectedRoute>
            <AppLayout><BouquetDetailPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/groves" element={
          <ProtectedRoute>
            <AppLayout><GrovesPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/groves/:groveId" element={
          <ProtectedRoute>
            <AppLayout><GroveDetailPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <AppLayout><ProfilePage /></AppLayout>
          </ProtectedRoute>
        } />
        {/* Legacy redirects: Goals, Challenges, Encyclopedia moved under /care */}
        <Route path="/goals" element={<Navigate to="/care/goals" replace />} />
        <Route path="/challenges" element={
          <ProtectedRoute>
            <AppLayout><ChallengesPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/florist" element={
          <ProtectedRoute>
            <AppLayout><FloristDashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <AppLayout><NotificationsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/encyclopedia" element={<Navigate to="/greenhouse" replace />} />
        <Route path="/encyclopedia/:speciesId" element={<Navigate to="/greenhouse" replace />} />
        <Route path="/admin/demo" element={
          <ProtectedRoute>
            <AdminDemoPage />
          </ProtectedRoute>
        } />
        <Route path="/swap" element={
          <ProtectedRoute>
            <AppLayout><SwapPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/swaps/matches" element={
          <ProtectedRoute>
            <AppLayout><SwapMatchesPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/swaps/:swapId" element={
          <ProtectedRoute>
            <AppLayout><SwapChatPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/wishlist" element={
          <ProtectedRoute>
            <AppLayout><WishlistPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings/notifications" element={
          <ProtectedRoute>
            <AppLayout><NotificationPreferencesPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
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
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
