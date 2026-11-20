import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import SignupPage       from './modules/auth/pages/SignupPage';
import LoginPage        from './modules/auth/pages/LoginPage';
import DashboardPage    from './modules/auth/pages/DashboardPage';
import ProfilePage      from './modules/auth/pages/ProfilePage';
import EditProfilePage  from './modules/auth/pages/EditProfilePage';
import MySkillsPage     from './modules/auth/pages/MySkillsPage';
import MyPortfolioPage  from './modules/auth/pages/MyPortfolioPage';

import Homepage             from './modules/marketplace/pages/Homepage';
import ExploreServicesPage  from './modules/marketplace/pages/ExploreServicesPage';
import ServiceDetailsPage   from './modules/marketplace/pages/ServiceDetailsPage';
import CreateServicePage    from './modules/marketplace/pages/CreateServicePage';
import EditServicePage      from './modules/marketplace/pages/EditServicePage';

import ExchangePage          from './modules/exchange/pages/ExchangePage';
import OfferSkillPage        from './modules/exchange/pages/OfferSkillPage';
import RequestSkillPage      from './modules/exchange/pages/RequestSkillPage';
import MatchesPage           from './modules/exchange/pages/MatchesPage';
import ExchangeRequestsPage  from './modules/exchange/pages/ExchangeRequestsPage';
import MyExchangesPage       from './modules/exchange/pages/MyExchangesPage';
import ListingDetailPage     from './modules/exchange/pages/ListingDetailPage';
import MyListingsPage        from './modules/exchange/pages/MyListingsPage';

import MyOrdersPage           from './modules/orders/pages/MyOrdersPage';
import OrderDetailsPage       from './modules/orders/pages/OrderDetailsPage';
import CheckoutPage           from './modules/orders/pages/CheckoutPage';
import PaymentStatusPage      from './modules/orders/pages/PaymentStatusPage';
import TransactionHistoryPage from './modules/orders/pages/TransactionHistoryPage';
import ReviewsPage            from './modules/orders/pages/ReviewsPage';
import RewardsPage            from './modules/orders/pages/RewardsPage';
import LeaderboardPage        from './modules/orders/pages/LeaderboardPage';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        
        <Route path="/"                       element={<Homepage />} />
        <Route path="/marketplace"            element={<ExploreServicesPage />} />
        <Route path="/marketplace/services/:id" element={<ServiceDetailsPage />} />

        <Route path="/marketplace/create"     element={<ProtectedRoute><CreateServicePage /></ProtectedRoute>} />
        <Route path="/marketplace/edit/:id"   element={<ProtectedRoute><EditServicePage /></ProtectedRoute>} />

        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login"  element={<LoginPage />} />

        <Route path="/dashboard"    element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
        <Route path="/my-skills"    element={<ProtectedRoute><MySkillsPage /></ProtectedRoute>} />
        <Route path="/my-portfolio" element={<ProtectedRoute><MyPortfolioPage /></ProtectedRoute>} />

        <Route path="/exchange"              element={<ExchangePage />} />
        <Route path="/exchange/offer"        element={<ProtectedRoute><OfferSkillPage /></ProtectedRoute>} />
        <Route path="/exchange/request"      element={<RequestSkillPage />} />
        <Route path="/exchange/edit/:id"     element={<ProtectedRoute><OfferSkillPage /></ProtectedRoute>} />
        <Route path="/exchange/matches"      element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />
        <Route path="/exchange/requests"     element={<ProtectedRoute><ExchangeRequestsPage /></ProtectedRoute>} />
        <Route path="/exchange/my-exchanges" element={<ProtectedRoute><MyExchangesPage /></ProtectedRoute>} />
        <Route path="/exchange/my-listings"  element={<ProtectedRoute><MyListingsPage /></ProtectedRoute>} />
        <Route path="/exchange/:id"          element={<ListingDetailPage />} />

        <Route path="/orders"               element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id"           element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
        <Route path="/checkout/:serviceId"  element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/payment/status"       element={<ProtectedRoute><PaymentStatusPage /></ProtectedRoute>} />
        <Route path="/transactions"         element={<ProtectedRoute><TransactionHistoryPage /></ProtectedRoute>} />
        <Route path="/reviews"              element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
        <Route path="/rewards"              element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
        <Route path="/leaderboard"          element={<LeaderboardPage />} />

        <Route path="*" element={<div style={{ textAlign: 'center', padding: 80 }}><h2>404 — Page not found</h2></div>} />
      </Routes>
    </>
  );
}
