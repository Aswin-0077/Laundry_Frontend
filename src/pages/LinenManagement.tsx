import React, { useEffect, useState, useMemo } from "react";
// import Header from "../components/Header";
// import Footer from "../components/Footer";
import SectionHeading from "../components/SectionHeading";
import PageContainer from "../components/PageContainer";
import Table from "../components/Table";
import { useNavigate } from "react-router-dom";
import { washItem, getWashedItems, disposeItem, deleteLinenItem } from "../services/api";
import "../../db.json"; 
import Searchbar from "../components/Searchbar";
import { MdLocalLaundryService } from 'react-icons/md';
import { FaSoap } from 'react-icons/fa';
import DeleteButton from "../components/DeleteButton";
import { toast } from "react-toastify";
import FormDateInput from "../components/Date";



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

  const handleAlert = (row: any) => {
    // Show confirmation dialog
    const isConfirmed = window.confirm("Are you sure you want to send this item for washing?");

    // Only navigate if the user clicks "OK" (isConfirmed is true)
    if (isConfirmed) {
      handleWash(row);
    }
    // If the user clicks "Cancel", nothing happens and they stay on the same page
  };

  const renderAction = (row: any) => {
    const isWashing = washedIds.has(row.id);
    return (
      <>
        <button
          className={`icon-btn ${isWashing ? 'washing' : ''}`}
          onClick={() => handleAlert(row)}
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
            <span title="Dispose"><DeleteButton onClick={() => handleDispose(row)} /></span>
          </button>
        )}
      </>
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const [selectedSource, setSelectedSource] = useState<string>('');

  // Get unique source areas for the filter
  const sourceAreas = useMemo(() => {
    const areas = new Set<string>();
    data.forEach((item: any) => {
      if (item.sourceArea) {
        areas.add(item.sourceArea);
      }
    });
    return Array.from(areas).sort().map(area => ({
      label: area,
      value: area
    }));
  }, [data]);

  // Filter data based on search term and source area
  const filteredData = data.filter((item: any) => {
    const matchesSearch = Object.values(item)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesSource = !selectedSource || item.sourceArea === selectedSource;
    
    return matchesSearch && matchesSource;
  });

  return (
    <>
      {/* <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator /> */}
      <PageContainer>
        <SectionHeading title="Linen Management" subtitle="Hospital Laundry Linen Management System" />
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-end' }}>
          <FormDateInput label="From date" />
          <FormDateInput label="To date" />

          <div style={{ minWidth: '200px' }}>
            <select 
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
            >
              <option value="">All Source Areas</option>
              {sourceAreas.map((area) => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </select>
          </div>


          <Searchbar value={searchTerm} onChange={handleSearchChange} />
        </div>
        <Table columns={columns} data={filteredData} renderAction={renderAction} />
      </PageContainer>
      {/* <Footer /> */}
    </>
  );
};

export default LinenManagement;
