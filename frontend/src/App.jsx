import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StartScreen from './pages/StartScreen';
import TournamentsList from './pages/TournamentsList';
import RegistrationEmail from './pages/RegistrationEmail';
import RegistrationCheck from './pages/RegistrationCheck';
import RegistrationProfile from './pages/RegistrationProfile';
import RoleSelection from './pages/RoleSelection';
import AlreadyRegistered from './pages/AlreadyRegistered';
import JudgeApplications from './pages/JudgeApplications';
import OrganizerDashboard from './pages/OrganizerDashboard';
import JudgeSlots from './pages/JudgeSlots';
import ApplicationReview from './pages/ApplicationReview';
import ApplicationSent from './pages/ApplicationSent';
import MyApplications from './pages/MyApplications';
import SlotChanges from './pages/SlotChanges';
import OrganizerTournaments from './pages/OrganizerTournaments';
import JudgeApplicationDetail from './pages/JudgeApplicationDetail';
import OrganizerSaved from './pages/OrganizerSaved';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartScreen />} />
        <Route path="/tournaments" element={<TournamentsList />} />
        <Route path="/register/:competitionId" element={<RegistrationEmail />} />
        <Route path="/register/check" element={<RegistrationCheck />} />
        <Route path="/register/profile" element={<RegistrationProfile />} />
        <Route path="/register/role" element={<RoleSelection />} />
        <Route path="/register/slots" element={<JudgeSlots />} />
        <Route path="/register/review" element={<ApplicationReview />} />
        <Route path="/register/sent" element={<ApplicationSent />} />
        <Route path="/applications" element={<MyApplications />} />
        <Route path="/slots/change" element={<SlotChanges />} />
        <Route path="/register/already" element={<AlreadyRegistered />} />
        <Route path="/organizer" element={<OrganizerDashboard />} />
        <Route path="/organizer/tournaments" element={<OrganizerTournaments />} />
        <Route path="/organizer/saved" element={<OrganizerSaved />} />
        <Route path="/judge-applications" element={<JudgeApplications />} />
        <Route path="/judge-applications/:applicationId" element={<JudgeApplicationDetail />} />
      </Routes>
    </Router>
  );
}

export default App;