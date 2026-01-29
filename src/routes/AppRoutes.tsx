import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/0_HomePage/HomePage';
import DeepFake from '../pages/1_DeepFake/DeepFake';
import Hallucinate from '../pages/2_Hallucinate/Hallucinate';
import DataShadows from '../pages/3_DataShadows/DataShadows';
import RetailDemolition from '../pages/4_RetailDemolition/RetailDemolition';
import Phishing from '../pages/5_Phishing/Phishing';


interface AppRoutesProps {
  toggleColorMode: () => void;
}

const AppRoutes: React.FC<AppRoutesProps> = ({ toggleColorMode }) => {
  return (
    <Routes>
      <Route path="/" element={<HomePage toggleColorMode={toggleColorMode} />} />
      <Route path="/deepfake" element={<DeepFake />} />
      <Route path="/hallucinate" element={<Hallucinate />} />
      <Route path="/datashadows" element={<DataShadows />} />
      <Route path="/retaildemolition" element={<RetailDemolition />} />
      <Route path="/phishing" element={<Phishing />} />
    </Routes>
  );
};

export default AppRoutes;