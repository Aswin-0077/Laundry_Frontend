import React, { useEffect, useState } from 'react';
import '../styles/page.css';
import Cards from '../components/Cards';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SectionHeading from '../components/SectionHeading';
import PageContainer from '../components/PageContainer';
// import Searchbar from '../components/Searchbar';
// import Table from '../components/Table';
// import vehicleData from '../../db.json';

interface Claim {
  claimAmount?: string | number;
}

interface Vehicle {
  insurance?: boolean;
  claims?: Claim[];
}

interface Stats {
  totalVehicles: number;
  totalInsurances: number;
  totalClaims: number;
  totalClaimAmount: number;
  insuranceCoverage: string;
}

const Page: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalVehicles: 0,
    totalInsurances: 0,
    totalClaims: 0,
    totalClaimAmount: 0,
    insuranceCoverage: '0%',
  });

  // useEffect(() => {
  //   const vehicles: Vehicle[] = vehicleData.vehicles || [];

  //   const totalVehicles = vehicles.length;
  //   const totalInsurances = vehicles.filter((v) => v.insurance).length;
  //   const allClaims = vehicles.flatMap((v) => v.claims || []);
  //   const totalClaims = allClaims.length;
  //   const totalClaimAmount = allClaims.reduce(
  //     (sum, claim) => sum + parseFloat(claim.claimAmount?.toString() || '0'),
  //     0
  //   );
  //   const insuranceCoverage = totalVehicles
  //     ? `${Math.round((totalInsurances / totalVehicles) * 100)}%`
  //     : '0%';

  //   setStats({
  //     totalVehicles,
  //     totalInsurances,
  //     totalClaims,
  //     totalClaimAmount,
  //     insuranceCoverage,
  //   });
  // }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };


  return (
    <>
    <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator />

    {/* <div className="page-container"> */}
      <PageContainer>
      <SectionHeading title='Dashboard' subtitle='adasd'/>
      <h1>Dashboard Summary</h1>
      <div className="dashboard-summary-cards">
        {[
          { title: 'Total Vehicles', subtitle: stats.totalVehicles.toString() },
          { title: 'Total Insurances', subtitle: stats.totalInsurances.toString() },
          { title: 'Total Claims', subtitle: stats.totalClaims.toString() },
          { title: 'Total Claim Amount', subtitle: `$${stats.totalClaimAmount}` },
          { title: 'Insurance Coverage', subtitle: stats.insuranceCoverage }
        ].map((card, index) => (
          <Cards key={index} title={card.title} subtitle={card.subtitle} />
        ))}
      </div>


      {/* <Searchbar /> */}
      {/* <Table /> */}
      </PageContainer>
    {/* </div> */}
    <Footer />
    </>
  );
};

export default Page;
