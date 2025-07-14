import React, { useEffect, useState } from "react";
// import Header from "../components/Header";
// import Footer from "../components/Footer";
import SectionHeading from "../components/SectionHeading";
import PageContainer from "../components/PageContainer";
import Table from "../components/Table";
import { useNavigate } from "react-router-dom";
import { washItem, getWashedItems, disposeItem, deleteLinenItem } from "../services/api";
import "../../db.json"; // Import db.json to ensure it's included in the build
import Searchbar from "../components/Searchbar";
import { MdLocalLaundryService } from 'react-icons/md';
import { FaSoap } from 'react-icons/fa';
// import Dispose from '../assets/delete.png'
import DeleteButton from "../components/DeleteButton";
import { toast } from "react-toastify";


interface LinenManagementProps {
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
}

const LinenManagement: React.FC<LinenManagementProps> = () => {
  const navigate = useNavigate();
  const [columns, setColumns] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [washedIds, setWashedIds] = useState<Set<any>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/db.json');
        const db = await response.json();
        setColumns(db["Wash-Item-Header"] || []);
        setData(db["Wash-Item-Data"] || []);
      } catch (err) {
        setColumns([]);
        setData([]);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchWashed = async () => {
      try {
        const washed = await getWashedItems();
        setWashedIds(new Set(washed.map((item: any) => item.id)));
      } catch (err) {
        setWashedIds(new Set());
      }
    };
    fetchWashed();
  }, [data]);

  const handleWash = async (row: any) => {
    try {
      await washItem(row);
      toast.success('Item successfully sent for washing!');
      navigate('/wash-items');
    } catch (error) {
      console.error('Failed to wash item:', error);
      toast.error('Item already sent for washing. Please wait for it to be processed.');
    }
  };

  const handleDispose = async (row: any) => {
    try {
      await disposeItem(row);
      await deleteLinenItem(row.id);
      setData(prevData => prevData.filter((item: any) => item.id !== row.id));
      toast.success('Item successfully disposed of!');
      navigate('/dispose-items');
    } catch (error) {
      console.error('Failed to dispose item:', error);
      toast.success('Failed to dispose item.');
    }
  };

  const renderAction = (row: any) => {
    const isWashing = washedIds.has(row.id);
    return (
      <>
        <button
          className={`icon-btn ${isWashing ? 'washing' : ''}`}
          onClick={() => handleWash(row)}
          disabled={isWashing}
          aria-label={isWashing ? 'Washing' : 'Wash'}
          style={{ background: 'none', border: 'none', cursor: isWashing ? 'not-allowed' : 'pointer', padding: 0, marginRight: 8 }}
        >
          {isWashing ? (
            <span title="Washing"><MdLocalLaundryService color="#0582ac" size={24} style={{ filter: 'drop-shadow(0 2px 4px #b3e0f7)' }} /></span>
          ) : (
            <span title="Wash"><FaSoap color="#0582ac" size={22} style={{ filter: 'drop-shadow(0 2px 4px #b3e0f7)' }} /></span>
          )}
        </button>
        {/* Only render Dispose button if the row is not being washed */}
        {!isWashing && (
          <button
            className="icon-btn dispose"
            aria-label="Dispose"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span title="Dispose"><DeleteButton onClick={() => handleDispose(row)}/></span>
          </button>
        )}
      </>
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filter data based on search term
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
        <SectionHeading title="Linen Management" subtitle="Hospital Laundry Linen Management System" />
        <Searchbar value={searchTerm} onChange={handleSearchChange}  />
        <Table columns={columns} data={filteredData} renderAction={renderAction} />         
      </PageContainer>
      {/* <Footer /> */}
    </>
  );
};

export default LinenManagement;
