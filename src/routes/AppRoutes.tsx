import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/0_HomePage/HomePage';
import DeepFake from '../pages/1_DeepFake/DeepFake';
import Hallucinate from '../pages/2_Hallucinate/Hallucinate';
import DataShadows from '../pages/3_DataShadows/DataShadows';
import RetailDemolition from '../pages/4_RetailDemolition/RetailDemolition.tsx';
import PhishingPanel from '../pages/5_Phishing/PhishingPanel';
import PhishingScorePage from '../pages/5_Phishing/PhishingScorePage';
import PhishingEducationPage from '../pages/5_Phishing/PhishingEducationPage';
import RankingPage from '../components/sharedPages/RankingPage';
import LeaderboardPage from '../components/functional/LeaderboardPage';
import AdminPage from '../components/functional/AdminPage';
import LoginPage from '../components/sharedPages/LoginPage';
import DesignPage from '../components/sharedPages/DesignPage';
import RegisterPage from '../components/sharedPages/RegisterPage';
import UltimateShowdown from '../pages/6_UltimateShowdown/UltimateShowdown';
import AdminConsole from '../pages/6_UltimateShowdown/AdminConsole';


interface AppRoutesProps {
  toggleColorMode: () => void;
}

const AppRoutes: React.FC<AppRoutesProps> = ({ toggleColorMode }) => {
  return (
    <Routes>
      <Route path="/" element={<HomePage toggleColorMode={toggleColorMode} />} />
      <Route path="/login/:game" element={<LoginPage />} />
      <Route path="/phishing/edu" element={<PhishingEducationPage />} />
      <Route path="/deepfake" element={<DeepFake />} />
      <Route path="/hallucinate" element={<Hallucinate />} />
      <Route path="/datashadows" element={<DataShadows />} />
      <Route path="/retaildemolition" element={<RetailDemolition />} />
      <Route path="/phishing" element={<PhishingPanel />} />
      <Route path="/phishing/score" element={<PhishingScorePage />} />
      <Route path="/ranking" element={<RankingPage />} />
      <Route path="/ranking/game/:game" element={<RankingPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/design" element={<DesignPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/final" element={<UltimateShowdown />} />
      <Route path="/final/admin" element={<AdminConsole />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
};

export default AppRoutes;
