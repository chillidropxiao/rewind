import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DailyReview from './pages/DailyReview';
import DeepReview from './pages/DeepReview';
import KnowledgeBase from './pages/KnowledgeBase';
import Profile from './pages/Profile';
import PlaceholderPage from './pages/Placeholder';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/daily" element={<DailyReview />} />
            <Route path="/deep" element={<DeepReview />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
