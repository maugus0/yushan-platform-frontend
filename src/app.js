/**
 * Application root – adds ReadingSettingsProvider (new) and the Reader / Reading Settings routes.
 * Existing functionality for auth, protected routes, and other pages is preserved.
 */
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from './store';
import 'antd/dist/reset.css';

import { setAuthenticated } from './store/slices/user';
import authService from './services/auth';

import './app.css';
import './index.css';
import './utils/axios-interceptor';

// Layout wrapper (already in project)
import LayoutWrapper from './components/common/layoutwrapper/layout-wrapper';

// NEW: Reading settings provider + new pages (added)
import { ReadingSettingsProvider } from './store/readingSettings';
import ReaderPage from './pages/reader/reader';
import ReadingSettingsPage from './pages/settings/reading-settings';

// Core pages
import Home from './pages/home/home';
import Login from './pages/login/login';
import Register from './pages/register/register';
import Browse from './pages/browse/browse';
import Profile from './pages/profile/profile';
import EditProfile from './pages/editprofile/editprofile';
import Leaderboard from './pages/leaderboard/leaderboard';
import Library from './pages/library/library';
import WriterDashboard from './pages/writerdashboard/writerdashboard';
import WriterWorkspace from './pages/writerworkspace/writerworkspace';
import WriterInteraction from './pages/writerinteraction/writerinteraction';
import WriterCreate from './pages/writercreate/writercreate';
import WriterStoryProfile from './pages/writerstoryprofile/writerstoryprofile';
import WriterCreateChapters from './pages/writercreatechapters/writercreatechapters';
import WriterAuth from './pages/writerauth/writerauth';
import NovelDetailPage from './pages/novel/novelDetailPage';

import { UserProvider } from './store/UserContext';
// Legal and info pages
import TermsOfService from './pages/terms/terms';
import CookiePolicy from './pages/cookies/cookies';
import AffiliateProgram from './pages/affliate-programme/affliate-programme';

const themeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    borderRadius: 6,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Button: { borderRadius: 6, controlHeight: 40 },
    Input: { borderRadius: 6, controlHeight: 40 },
    Card: { borderRadiusLG: 12 },
  },
};

// Global message config
message.config({
  top: 24,
  duration: 3,
  maxCount: 3,
});

const ProtectedRouteWrapper = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.user);

  // Initialize auth state on mount and validate token
  useEffect(() => {
    const initAuth = async () => {
      const authed = authService.isAuthenticated();

      if (authed) {
        // Check if token is expired
        const isExpired = authService.isTokenExpired();

        if (isExpired) {
          console.log('Token expired on app load, attempting refresh...');
          try {
            // Try to refresh the token
            await authService.refreshToken();
            dispatch(setAuthenticated(true));
          } catch (error) {
            console.error('Failed to refresh token on app load:', error);
            // Clear invalid tokens
            authService.clearTokens();
            dispatch(setAuthenticated(false));
          }
        } else {
          dispatch(setAuthenticated(true));
        }
      } else {
        dispatch(setAuthenticated(false));
      }
    };

    initAuth();
  }, [dispatch]);

  return (
    <ConfigProvider theme={themeConfig}>
      <PersistGate loading={null} persistor={persistor}>
        <AntApp>
          {/* NEW: Wrap the whole app so any page (reader/settings) can access reading settings */}
          <ReadingSettingsProvider>
            <Router
              basename={process.env.NODE_ENV === 'production' ? '/yushan-frontend' : ''}
              future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
              <div className="App">
                <Routes>
                  {/* Public auth routes */}
                  <Route
                    path="/login"
                    element={
                      isAuthenticated ? (
                        <Navigate to="/" replace />
                      ) : (
                        <LayoutWrapper>
                          <Login />
                        </LayoutWrapper>
                      )
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      isAuthenticated ? (
                        <Navigate to="/" replace />
                      ) : (
                        <LayoutWrapper>
                          <Register />
                        </LayoutWrapper>
                      )
                    }
                  />

                  <Route
                    path="/"
                    element={
                      <LayoutWrapper>
                        <Home />
                      </LayoutWrapper>
                    }
                  />

                  {/* Legal and info pages */}
                  <Route
                    path="/terms"
                    element={
                      <LayoutWrapper>
                        <TermsOfService />
                      </LayoutWrapper>
                    }
                  />
                  <Route
                    path="/cookies"
                    element={
                      <LayoutWrapper>
                        <CookiePolicy />
                      </LayoutWrapper>
                    }
                  />
                  <Route
                    path="/affliate-programme"
                    element={
                      <LayoutWrapper>
                        <AffiliateProgram />
                      </LayoutWrapper>
                    }
                  />

                  {/* Legal and info pages */}
                  <Route
                    path="/terms"
                    element={
                      <LayoutWrapper>
                        <TermsOfService />
                      </LayoutWrapper>
                    }
                  />
                  <Route
                    path="/cookies"
                    element={
                      <LayoutWrapper>
                        <CookiePolicy />
                      </LayoutWrapper>
                    }
                  />
                  <Route
                    path="/affliate-programme"
                    element={
                      <LayoutWrapper>
                        <AffiliateProgram />
                      </LayoutWrapper>
                    }
                  />

                  {/* Writer routes with ProtectedRouteWrapper and UserProvider */}
                  <Route
                    path="/writerdashboard"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <UserProvider>
                          <WriterDashboard />
                        </UserProvider>
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/writerworkspace"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <UserProvider>
                          <WriterWorkspace />
                        </UserProvider>
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/writerinteraction"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <UserProvider>
                          <WriterInteraction />
                        </UserProvider>
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/writercreate"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <UserProvider>
                          <WriterCreate />
                        </UserProvider>
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/writerstoryprofile"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <UserProvider>
                          <WriterStoryProfile />
                        </UserProvider>
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/writercreatechapters"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <UserProvider>
                          <WriterCreateChapters />
                        </UserProvider>
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/writerauth"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <UserProvider>
                          <WriterAuth />
                        </UserProvider>
                      </ProtectedRouteWrapper>
                    }
                  />

                  {/* Library route */}
                  <Route
                    path="/library"
                    element={
                      <LayoutWrapper>
                        <Library />
                      </LayoutWrapper>
                    }
                  />

                  {/* Library */}
                  <Route
                    path="/library"
                    element={
                      <LayoutWrapper>
                        <Library />
                      </LayoutWrapper>
                    }
                  />

                  {/* Protected user pages */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <LayoutWrapper>
                          <Profile />
                        </LayoutWrapper>
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/editprofile"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <LayoutWrapper>
                          <EditProfile />
                        </LayoutWrapper>
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/browse/*"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <LayoutWrapper>
                          <Browse />
                        </LayoutWrapper>
                      </ProtectedRouteWrapper>
                    }
                  />

                  {/* Leaderboard / rankings (original protected setup) */}
                  <Route
                    path="/rankings"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <LayoutWrapper isAuthenticated={isAuthenticated}>
                          <Leaderboard />
                        </LayoutWrapper>
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/rankings/Novel"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <LayoutWrapper isAuthenticated={isAuthenticated}>
                          <Leaderboard />
                        </LayoutWrapper>
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/rankings/Novel/:category"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <LayoutWrapper isAuthenticated={isAuthenticated}>
                          <Leaderboard />
                        </LayoutWrapper>
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/rankings/Readers"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <LayoutWrapper isAuthenticated={isAuthenticated}>
                          <Leaderboard />
                        </LayoutWrapper>
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/rankings/Writers"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <LayoutWrapper isAuthenticated={isAuthenticated}>
                          <Leaderboard />
                        </LayoutWrapper>
                      </ProtectedRouteWrapper>
                    }
                  />

                  {/* Legacy leaderboard redirects */}
                  <Route
                    path="/leaderboard"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <Navigate to="/rankings/Novel" replace />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/leaderboard/Novel"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <Navigate to="/rankings/Novel" replace />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/leaderboard/Readers"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <Navigate to="/rankings/Readers" replace />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/leaderboard/Writers"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <Navigate to="/rankings/Writers" replace />
                      </ProtectedRouteWrapper>
                    }
                  />
                  <Route
                    path="/leaderboard/*"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <LayoutWrapper isAuthenticated={isAuthenticated}>
                          <Leaderboard />
                        </LayoutWrapper>
                      </ProtectedRouteWrapper>
                    }
                  />

                  {/* Novel detail (kept protected as in your version) */}
                  <Route
                    path="/novel/:novelId"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <LayoutWrapper isAuthenticated={isAuthenticated}>
                          <NovelDetailPage />
                        </LayoutWrapper>
                      </ProtectedRouteWrapper>
                    }
                  />

                  {/* NEW: Chapter reader route (protected) */}
                  <Route
                    path="/read/:novelId/:chapterId"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <LayoutWrapper>
                          <ReaderPage />
                        </LayoutWrapper>
                      </ProtectedRouteWrapper>
                    }
                  />

                  {/* NEW: Reading Settings route (protected) */}
                  <Route
                    path="/settings/reading"
                    element={
                      <ProtectedRouteWrapper isAuthenticated={isAuthenticated}>
                        <LayoutWrapper>
                          <ReadingSettingsPage />
                        </LayoutWrapper>
                      </ProtectedRouteWrapper>
                    }
                  />
                </Routes>
              </div>
            </Router>
          </ReadingSettingsProvider>
        </AntApp>
      </PersistGate>
    </ConfigProvider>
  );
}

export default App;
