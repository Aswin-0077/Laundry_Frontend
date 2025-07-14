import React, { useEffect, useState, useRef } from "react";
// import Header from "../components/Header";
// import Footer from "../components/Footer";
import SectionHeading from "../components/SectionHeading";
import PageContainer from "../components/PageContainer";
import Table from "../components/Table";
import ButtonWithGradient from "../components/ButtonWithGradient";
import CustomModal from '../components/Modal';
import Searchbar from "../components/Searchbar";
import { FaMapMarkedAlt, FaPrint } from 'react-icons/fa';
import CancelButton from "../components/CancelButton";

interface OutsideWashProps {
    sidebarCollapsed?: boolean;
    toggleSidebar?: () => void;
}

const columns = [
  { key: "id", header: "ID" },
  { key: "category", header: "Category" },
  { key: "linenType", header: "Linen Type" },
  { key: "fabricDensity", header: "Fabric Density" },
  { key: "washDurability", header: "Wash Durability" },
  { key: "sourceArea", header: "Source Area" },
  { key: "vendor", header: "Vendor" },
  { key: "rate", header: "Rate(In Rs)" },
  { key: "status", header: "Status" },
  { key: "time", header: "Time(In min)" }
  // { key: "actions", header: "Actions" }
];

const statusOptions = ["Pending", "In Progress", "Done"];

const OutsideWash: React.FC<OutsideWashProps> = () => {
  const [data, setData] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [rate, setRate] = useState('');
  const [status, setStatus] = useState('Pending');
  const [time, setTime] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://192.168.50.253:3001/OutsideWashedItems');
        const items = await response.json();
        setData(items);
      } catch (err) {
        setData([]);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    fetch('http://192.168.50.253:3001/Vendors').then(res => res.json()).then(setVendors);
  }, []);

  // Open modal and prefill vendor/rate/status/time
  const handleMap = (row: any) => {
    setSelectedRow(row);
    setSelectedVendorId(row.vendorId || '');
    setRate(row.rate || '');
    setStatus(row.status || 'Pending');
    setTime(row.time || '');
    setShowModal(true);
  };

  // When vendor changes, auto-fill rate if mapping exists
  useEffect(() => {
    if (!selectedVendorId || !selectedRow) return;
    const vendor = vendors.find((v: any) => v.id === Number(selectedVendorId));
    if (!vendor) return;
    const rateObj = vendor.rates.find((r: any) => r.itemId === selectedRow.id);
    setRate(rateObj ? rateObj.rate : '');
  }, [selectedVendorId, selectedRow, vendors]);

  // Save mapping to db.json and update local state
  const handleSave = async () => {
    if (!selectedRow) return;
    const updated = {
      ...selectedRow,
      vendorId: selectedVendorId,
      vendor: vendors.find((v: any) => v.id === Number(selectedVendorId))?.name || '',
      rate,
      status,
      time
    };
    await fetch(`http://192.168.50.253:3001/OutsideWashedItems/${selectedRow.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    setData(data.map((item: any) => item.id === selectedRow.id ? updated : item));
    setShowModal(false);
    setSelectedRow(null);
    setSelectedVendorId('');
    setRate('');
    setStatus('Pending');
    setTime('');
  };

  // Print bill for the item
  const handlePrint = (row: any) => {
    setSelectedRow(row);
    setTimeout(() => {
      if (printRef.current) {
        const printContents = printRef.current.innerHTML;
        const win = window.open('', '', 'height=600,width=800');
        if (win) {
          win.document.write('<html><head><title>Bill</title></head><body>');
          win.document.write(printContents);
          win.document.write('</body></html>');
          win.document.close();
          win.print();
        }
      }
    }, 100);
  };

  // Table data with actions
  const tableData = data.map((row: any) => ({
    ...row,
    actions: <>
      <button
        className="icon-btn"
        onClick={() => handleMap(row)}
        aria-label="Map"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: 8 }}
      >
        <span title="Map"><FaMapMarkedAlt color="#0d92ae" size={22} style={{ filter: 'drop-shadow(0 2px 4px #b3e0f7)' }} /></span>
      </button>
      <button
        className="icon-btn"
        onClick={() => handlePrint(row)}
        aria-label="Print"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <span title="Print"><FaPrint color="#0d92ae" size={22} style={{ filter: 'drop-shadow(0 2px 4px #b3e0f7)' }} /></span>
      </button>
    </>
  }));

  // Filtered data
  const filteredData = tableData.filter((item: any) =>
    Object.values(item)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator /> */}
      <PageContainer>
        <SectionHeading title="Outside Wash" subtitle="Hospital Laundry Linen Management System" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Searchbar value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Table columns={columns} data={filteredData} />
        <CustomModal
          show={showModal}
          onHide={() => setShowModal(false)}
          title="Map Vendor & Rate"
          footer={
            <>
              {/* <ButtonWithGradient text="Cancel" onClick={() => setShowModal(false)} /> */}
              <CancelButton text="Cancel" onClick={() => setShowModal(false)} />
              <ButtonWithGradient text="Save" onClick={handleSave} />
            </>
          }
        >
          <div style={{ marginBottom: 16 }}>
            <label>Vendor</label>
            <select className="form-control" value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)}>
              <option value="">Select Vendor</option>
              {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Rate</label>
            <input className="form-control" type="number" min={0} value={rate} onChange={e => setRate(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Status</label>
            <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Time</label>
            <input className="form-control" type="text" value={time} onChange={e => setTime(e.target.value)} placeholder="e.g. 2h 30m or 14:00-16:00" />
          </div>
        </CustomModal>
        {/* Hidden print area */}
        {selectedRow && (
          <div style={{ display: 'none' }} ref={printRef}>
            <h2>Bill</h2>
            <p><b>Item:</b> {selectedRow.category}</p>
            <p><b>Linen Type:</b> {selectedRow.linenType}</p>
            <p><b>Vendor:</b> {selectedRow.vendor}</p>
            <p><b>Rate:</b> {selectedRow.rate}</p>
            <p><b>Status:</b> {selectedRow.status}</p>
            <p><b>Time:</b> {selectedRow.time}</p>
          </div>
        )}
      </PageContainer>
      {/* <Footer /> */}
    </>
  );
};

export default OutsideWash;
