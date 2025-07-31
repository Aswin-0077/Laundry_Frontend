import React from "react";
// import Header from "../components/Header";
// import Footer from "../components/Footer";
import SectionHeading from "../components/SectionHeading";
import PageContainer from "../components/PageContainer";
import Table from "../components/Table";
import Searchbar from "../components/Searchbar";
import { useEffect, useState } from "react";
import axios from "axios";

interface DisposeItemProps {
    sidebarCollapsed?: boolean;
    toggleSidebar?: () => void;
}

const BASE_URL = 'http://localhost:3005';

const DisposeItem: React.FC<DisposeItemProps> = () => {
  const [columns, setColumns] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/DisposeItems`);
        const dbRes = await fetch('/db.json');
        const db = await dbRes.json();
        const columns = [
          { key: "id", header: "ID" },
          { key: "category", header: "Category" },
          { key: "linenType", header: "Linen Type" },
          { key: "fabricDensity", header: "Fabric Density" },
          { key: "washDurability", header: "Wash Durability" },
          { key: "sourceArea", header: "Source Area" },
        ];
        setColumns(columns);
        setData(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setColumns([]);
        setData([]);
      }
    };
    fetchData();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredData = data.filter((item: any) =>
    Object.values(item)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator /> */}
      <PageContainer>
        <SectionHeading title="Dispose item"  subtitle="Hospital Laundry Linen Management System"  />
        <Searchbar value={searchTerm} onChange={handleSearchChange} />
        <Table columns={columns} data={filteredData} />
      </PageContainer>
      {/* <Footer /> */}
    </>
  );
};

export default DisposeItem;
