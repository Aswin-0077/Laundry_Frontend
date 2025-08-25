import React, { useEffect, useState, useMemo, useCallback } from "react";
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
        // Fetch columns from static JSON (for headers)
        const headersResponse = await fetch('/db.json');
        const db = await headersResponse.json();
        setColumns(db["Wash-Item-Header"] || []);
        
        // Fetch actual data from MSSQL database API
        const dataResponse = await fetch('http://192.168.50.253:3005/Wash-Item-Data');
        if (dataResponse.ok) {
          const washItems = await dataResponse.json();
          setData(washItems);
        } else {
          console.error('Failed to fetch wash items from database');
          setData([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
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
      // Refresh data from database to reflect changes
      await refreshData();
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
      // Refresh data from database to reflect changes
      await refreshData();
      toast.success('Item successfully disposed of!');
      navigate('/dispose-items');
    } catch (error) {
      console.error('Failed to dispose item:', error);
      toast.error('Failed to dispose item.');
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
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Function to refresh data from database
  const refreshData = useCallback(async () => {
    try {
      const dataResponse = await fetch('http://192.168.50.253:3005/Wash-Item-Data');
      if (dataResponse.ok) {
        const washItems = await dataResponse.json();
        setData(washItems);
      } else {
        console.error('Failed to refresh wash items from database');
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  }, []);

  // Auto-refresh data periodically and on window focus
  useEffect(() => {
    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(refreshData, 30000);

    // Refresh when window gains focus (user comes back to tab)
    const handleFocus = () => {
      refreshData();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshData]);

  // Helper function to convert MM-DD-YY format to Date object
  const parseItemDate = (dateString: string): Date | null => {
    if (!dateString) return null;

    // Handle MM-DD-YY format (like "12-07-25")
    const parts = dateString.split("-");
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);

      // Convert 2-digit year to 4-digit (assuming 20XX)
      if (year < 100) {
        year += 2000;
      }

      return new Date(year, month, day);
    }

    // Fallback to standard Date parsing
    return new Date(dateString);
  };

  // Helper function to format date for display (converts MM-DD-YY to YYYY-MM-DD)
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return dateString;

    const parsedDate = parseItemDate(dateString);
    if (!parsedDate || isNaN(parsedDate.getTime())) return dateString;

    // Format as YYYY-MM-DD to match date picker format
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Date change handlers
  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromDate(e.target.value);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToDate(e.target.value);
  };

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

  // Filter data based on search term, source area, and date range
  const filteredData = data.filter((item: any) => {
    const matchesSearch = Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesSource = !selectedSource || item.sourceArea === selectedSource;

    // Date range filtering logic
    let matchesDateRange = true;
    
    // Only apply date filtering if at least one date is selected
    if ((fromDate || toDate) && item.date) {
      const itemDate = parseItemDate(item.date);
      
      if (itemDate && !isNaN(itemDate.getTime())) {
        if (fromDate && toDate) {
          // Both dates are set
          const fromDateObj = new Date(fromDate);
          const toDateObj = new Date(toDate);
          
          // Set time to start/end of day for proper comparison
          fromDateObj.setHours(0, 0, 0, 0);
          toDateObj.setHours(23, 59, 59, 999);
          itemDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
          
          // Only filter if fromDate <= toDate, otherwise show all data
          if (fromDateObj <= toDateObj) {
            matchesDateRange = itemDate >= fromDateObj && itemDate <= toDateObj;
          }
        } else if (fromDate) {
          // Only from date is set
          const fromDateObj = new Date(fromDate);
          fromDateObj.setHours(0, 0, 0, 0);
          itemDate.setHours(12, 0, 0, 0);
          matchesDateRange = itemDate >= fromDateObj;
        } else if (toDate) {
          // Only to date is set
          const toDateObj = new Date(toDate);
          toDateObj.setHours(23, 59, 59, 999);
          itemDate.setHours(12, 0, 0, 0);
          matchesDateRange = itemDate <= toDateObj;
        }
      }
    }

    return matchesSearch && matchesSource && matchesDateRange;
  });

  // Format dates in the filtered data for consistent display
  const formattedData = filteredData.map((item) => ({
    ...item,
    date: formatDateForDisplay(item.date),
  }));

  return (
    <>
      {/* <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator /> */}
      <PageContainer>
        <SectionHeading title="Linen Management" subtitle="Hospital Laundry Linen Management System" />
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-end' }}>
          <FormDateInput 
            label="From date" 
            value={fromDate}
            onChange={handleFromDateChange}
            name="fromDate"
          />
          <FormDateInput 
            label="To date" 
            value={toDate}
            onChange={handleToDateChange}
            name="toDate"
          />

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
        <Table columns={columns} data={formattedData} renderAction={renderAction} />
      </PageContainer>
      {/* <Footer /> */}
    </>
  );
};

export default LinenManagement;
