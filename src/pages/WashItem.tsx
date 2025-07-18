import React, { useEffect, useState } from "react";
// import Header from "../components/Header";
// import Footer from "../components/Footer";
import SectionHeading from "../components/SectionHeading";
import PageContainer from "../components/PageContainer";
import Table from "../components/Table";
import { getWashedItems } from "../services/api";
import ButtonWithGradient from "../components/ButtonWithGradient";
import CustomModal from '../components/Modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import Searchbar from "../components/Searchbar";
import { MdLocalLaundryService } from 'react-icons/md';
import { FaTruckMoving } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import '../App.css'
import { toast } from "react-toastify";
import CancelButton from "../components/CancelButton";
import FormDateInput from "../components/Date";

interface WashItemProps {
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
  { key: "action", header: "Action" },
];

const configColumns = [
  { key: 'materialType', header: 'Material Type' },
  { key: 'detergent', header: 'Detergent' },
  { key: 'machine', header: 'Machine' }
];

const WashItem: React.FC<WashItemProps> = () => {
  const [data, setData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [materialType, setMaterialType] = useState('');
  const [detergent, setDetergent] = useState('');
  const [machine, setMachine] = useState('');
  const [configurations, setConfigurations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [configSearchTerm, setConfigSearchTerm] = useState('');
  const [showInsideWashModal, setShowInsideWashModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedDetergent, setSelectedDetergent] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [timeTaken, setTimeTaken] = useState('');
  const navigate = useNavigate();

  // Helper to get unique detergents and machines from Detergents table
  const detergentOptions = Array.from(new Set(configurations.map((c: any) => c.detergent)));
  const machineOptions = Array.from(new Set(configurations.map((c: any) => c.machine)));

  // Add extra columns if any washed item has detergent/machine/timeTaken
  let dynamicColumns = [
    ...columns,
    ...(data.some((item: any) => item.detergent) ? [{ key: 'detergent', header: 'Detergent' }] : []),
    ...(data.some((item: any) => item.machine) ? [{ key: 'machine', header: 'Machine' }] : []),
    ...(data.some((item: any) => item.timeTaken) ? [{ key: 'timeTaken', header: 'Time Taken (min)' }] : []),
  ];
  // Move Action column to the end
  const actionColIdx = dynamicColumns.findIndex(col => col.key === 'action');
  if (actionColIdx !== -1) {
    const [actionCol] = dynamicColumns.splice(actionColIdx, 1);
    dynamicColumns.push(actionCol);
  }

  useEffect(() => {
    const fetchWashedItems = async () => {
      try {
        const items = await getWashedItems();
        setData(items);
      } catch (err) {
        console.error('Failed to fetch washed items:', err);
        setData([]);
      }
    };
    fetchWashedItems();
  }, []);

  // Fetch configurations from db.json (if needed)
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const res = await fetch('http://192.168.50.253:3001/Detergents');
        if (res.ok) {
          const configs = await res.json();
          setConfigurations(configs);
        }
      } catch (err) {
        setConfigurations([]);
      }
    };
    fetchConfigs();
  }, []);

  const handleSaveConfig = async () => {
    const newConfig = { materialType, detergent, machine };
    // Save to db.json in Detergents
    await fetch('http://192.168.50.253:3001/Detergents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });
    setConfigurations([...configurations, newConfig]);
    setShowModal(false);
    setMaterialType('');
    setDetergent('');
    setMachine('');
  };

  // Update washedLinenItems entry with new info
  const handleSaveInsideWash = async () => {
    if (!selectedItem) return;
    const updated = {
      ...selectedItem,
      detergent: selectedDetergent,
      machine: selectedMachine,
      timeTaken,
      washing: true // Mark as being washed
    };
    // PATCH the item in washedLinenItems
    await fetch(`http://192.168.50.253:3001/washedLinenItems/${selectedItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ detergent: selectedDetergent, machine: selectedMachine, timeTaken, washing: true })
    });
    // Update local state
    setData(data.map((item: any) => item.id === selectedItem.id ? updated : item));
    setShowInsideWashModal(false);
    setSelectedItem(null);
    setSelectedDetergent('');
    setSelectedMachine('');
    setTimeTaken('');
  };
  // Move item to OutsideWashedItems and remove from washedLinenItems
  const handleOutsideWash = async (row: any) => {
    // Add to OutsideWashedItems
    await fetch('http://192.168.50.253:3001/OutsideWashedItems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    });
    // Remove from washedLinenItems
    await fetch(`http://192.168.50.253:3001/washedLinenItems/${row.id}`, { method: 'DELETE' });
    setData(data.filter((item: any) => item.id !== row.id));
    toast.success('Item successfully sent for outside wash!');
    navigate('/outside-wash');
  };

  const renderAction = (row: any) => {
    if (row.washing) {
      return (
        <button
          className="icon-btn washing"
          disabled
          aria-label="Washing"
          style={{ background: 'none', border: 'none', cursor: 'not-allowed', padding: 0 }}
        >
          <span title="Washing"><MdLocalLaundryService color="#0582ac" size={24} style={{ filter: 'drop-shadow(0 2px 4px #b3e0f7)' }} /></span>
        </button>
      );
    }
    return (
      <>
        <button
          className="icon-btn"
          onClick={() => {
            setSelectedItem(row);
            setSelectedDetergent(row.detergent || '');
            setSelectedMachine(row.machine || '');
            setTimeTaken(row.timeTaken || '');
            setShowInsideWashModal(true);
          }}
          aria-label="Inside Wash"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: 8 }}
        >
          <span title="Inside Wash"><MdLocalLaundryService color="#0582ac" size={24} style={{ filter: 'drop-shadow(0 2px 4px #b3e0f7)' }} /></span>
        </button>
        <button
          className="icon-btn"
          onClick={() => handleOutsideWash(row)}
          aria-label="Outside Wash"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <span title="Outside Wash"><FaTruckMoving color="#0d92ae" size={22} style={{ filter: 'drop-shadow(0 2px 4px #b3e0f7)' }} /></span>
        </button>
      </>
    );
  };

  // Search logic for washed items
  const filteredData = data.filter((item: any) =>
    Object.values(item)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Search logic for configurations
  const filteredConfigs = configurations.filter((item: any) =>
    Object.values(item)
      .join(' ')
      .toLowerCase()
      .includes(configSearchTerm.toLowerCase())
  );

  // Find machines currently in use (washing)
  const machinesInUse = data
    .filter((item: any) => item.washing && item.machine)
    .map((item: any) => item.machine);

  return (
    <>
      {/* <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator /> */}
      <PageContainer>
        <SectionHeading title="Washed Items" subtitle="Hospital Laundry Linen Management System" />
        {/* Washed Items Table with Search */}
        
        <div className="d-flex justify-content-between align-items-center mt-5" style={{ marginBottom: 16, gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <ButtonWithGradient text="Add Detergent & Machine" onClick={() => setShowModal(true)} />
            </div>

            <div style={{ flex: 1, maxWidth: 350 }}>
            <Searchbar value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            
          </div>
        <Table columns={dynamicColumns} data={filteredData} renderAction={renderAction} />
        {/* Section for adding detergents and machines */}
        <div style={{ marginTop: 40 }}>

          {/* <SectionHeading  title="Material Configurations" subtitle="Hospital Laundry Linen Management System" /> */}
          <div className="sub-header">Material Configurations</div>


          <div className="d-flex justify-content-between align-items-center mt-3" style={{ marginBottom: 16, gap: 16 }}>
           

            {/* <div style={{ flex: 1, maxWidth: 350 }}> */}
              <Searchbar value={configSearchTerm} onChange={e => setConfigSearchTerm(e.target.value)} />
            {/* </div> */}
            
          </div>
          <Table columns={configColumns} data={filteredConfigs} />
        </div>
        
        {/* Modal for adding configuration */}
        <CustomModal show={showModal} onHide={() => {
          setShowModal(false);
          setMaterialType('');
          setDetergent('');
          setMachine('');
        }}  title="Add Detergent & Machine" footer={
            <>
              {/* <ButtonWithGradient text="Cancel" onClick={() => setShowModal(false)} /> */}
              <CancelButton text="Cancel" onClick={() => {
                setShowModal(false);
                setMaterialType('');
                setDetergent('');
                setMachine('');
              }} />  
              <ButtonWithGradient text="Save" onClick={handleSaveConfig} />
            </> } >

          <div style={{ marginBottom: 16 }}>
            <label>Material Type</label>
            <input type="text" value={materialType} onChange={e => setMaterialType(e.target.value)} className="form-control" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Detergent</label>
            <input type="text" value={detergent} onChange={e => setDetergent(e.target.value)} className="form-control" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Machine</label>
            <input type="text" value={machine} onChange={e => setMachine(e.target.value)} className="form-control" />
          </div>
          
        </CustomModal>

        <CustomModal show={showInsideWashModal} onHide={() => setShowInsideWashModal(false)} title="Inside Wash" footer={
            <>
              {/* <ButtonWithGradient text="Cancel" onClick={() => setShowInsideWashModal(false)} /> */}
              <CancelButton text="Cancel" onClick={() => setShowInsideWashModal(false)} />  
              <ButtonWithGradient text="Save" onClick={handleSaveInsideWash} />
            </>
          }
        >
          {selectedItem && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label><b>Item:</b></label>
                <input className="form-control" value={selectedItem.category + ' (' + selectedItem.id + ')'} readOnly />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Detergent</label>
                <select className="form-control" value={selectedDetergent} onChange={e => setSelectedDetergent(e.target.value)} required>
                  <option value="">Select Detergent</option>
                  {detergentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Machine</label>
                <select className="form-control" value={selectedMachine} onChange={e => setSelectedMachine(e.target.value)} required>
                  <option value="">Select Machine</option>
                  {machineOptions.map((m) => (
                    <option
                      key={m}
                      value={m}
                      disabled={machinesInUse.includes(m) && selectedItem?.machine !== m}
                    >
                      {m} {machinesInUse.includes(m) && selectedItem?.machine !== m ? "(In Use)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Time Taken (minutes)</label>
                <input className="form-control" type="number" value={timeTaken} onChange={e => setTimeTaken(e.target.value)} min={1} required />
              </div>
            </>
          )}
        </CustomModal>
      </PageContainer>
      {/* <Footer /> */}
    </>
  );
};

export default WashItem;
