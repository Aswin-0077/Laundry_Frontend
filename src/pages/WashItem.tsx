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
// import FormDateInput from "../components/Date";
// import Stepper from '../components/Stepper';
import Breadcrumb from "../components/Breadcrumb";
import EditButton from "../components/EditButton";
import DeleteButton from "../components/DeleteButton";

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
  { key: 'machine', header: 'Machine' },
  { key: 'action', header: 'Action' }
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
  const [activeStep, setActiveStep] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editFields, setEditFields] = useState({
    detergent: '',
    machine: '',
    timeTaken: '',
  });

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
        const res = await fetch('http://192.168.50.253:3005/Detergents');
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
    try {
      const newConfig = { materialType, detergent, machine };
      
      const response = await fetch('http://192.168.50.253:3005/Detergents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
      
      const savedConfig = await response.json();
      setConfigurations([...configurations, savedConfig]);
      setShowModal(false);
      setMaterialType('');
      setDetergent('');
      setMachine('');
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Update washedLinenItems entry with new info
  const handleSaveInsideWash = async () => {
    if (!selectedItem) return;
    
    try {
      const updated = {
        ...selectedItem,
        detergent: selectedDetergent,
        machine: selectedMachine,
        timeTaken,
        washing: true // Mark as being washed
      };
      
      const response = await fetch(`http://192.168.50.253:3005/washedLinenItems/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update wash details');
      }
      
      const responseData = await response.json();
      setData(data.map((item: any) => item.id === selectedItem.id ? responseData : item));
      setShowInsideWashModal(false);
      setSelectedItem(null);
      setSelectedDetergent('');
      setSelectedMachine('');
      setTimeTaken('');
      toast.success('Wash details updated successfully');
    } catch (error) {
      console.error('Error updating wash details:', error);
      toast.error('Failed to update wash details: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  // Move item to OutsideWashedItems and remove from washedLinenItems
  const handleOutsideWash = async (row: any) => {
    // Add to OutsideWashedItems
    await fetch('http://192.168.50.253:3005/OutsideWashedItems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    });
    // Remove from washedLinenItems
    await fetch(`http://192.168.50.253:3005/washedLinenItems/${row.id}`, { method: 'DELETE' });
    setData(data.filter((item: any) => item.id !== row.id));
    toast.success('Item successfully sent for outside wash!');
    navigate('/outside-wash');
  };

  // When edit button is clicked
  const handleEditClick = (item: any) => {
    setEditItem(item);
    setEditFields({
      detergent: item.detergent || '',
      machine: item.machine || '',
      timeTaken: item.timeTaken || '',
    });
    setShowEditModal(true);
  };

  // Save edited item
  const handleEditSave = async () => {
    if (!editItem) return;
    
    try {
      const updatedData = {
        ...editItem,
        ...editFields,
      };
      
      const response = await fetch(`http://192.168.50.253:3005/washedLinenItems/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update item');
      }
      
      const responseData = await response.json();
      setData(data.map((item: any) => item.id === editItem.id ? responseData : item));
      setShowEditModal(false);
      setEditItem(null);
      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };


  // Delete washed item
  const handleDeleteWashedItem = async (item: any) => {
    if (!window.confirm('Are you sure you want to delete this washed item?')) return;
    
    try {
      const response = await fetch(`http://192.168.50.253:3005/washedLinenItems/${item.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      
      setData(data.filter((dataItem: any) => dataItem.id !== item.id));
      toast.success('Washed item deleted successfully');
    } catch (error) {
      console.error('Error deleting washed item:', error);
      toast.error('Failed to delete washed item: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Edit and delete handlers for detergent configurations
  const [editConfig, setEditConfig] = useState<any>(null);
  const [showEditConfigModal, setShowEditConfigModal] = useState(false);
  const [editConfigFields, setEditConfigFields] = useState({
    materialType: '',
    detergent: '',
    machine: '',
  });

  const handleEditConfig = (config: any) => {
    setEditConfig(config);
    setEditConfigFields({
      materialType: config.materialType || '',
      detergent: config.detergent || '',
      machine: config.machine || '',
    });
    setShowEditConfigModal(true);
  };

  const handleSaveEditConfig = async () => {
    if (!editConfig) return;
    
    try {
      const response = await fetch(`http://192.168.50.253:3005/Detergents/${editConfig.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editConfigFields)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }
      
      const updatedConfig = await response.json();
      setConfigurations(configurations.map((config: any) => 
        config.id === editConfig.id ? updatedConfig : config
      ));
      
      setShowEditConfigModal(false);
      setEditConfig(null);
      toast.success('Configuration updated successfully');
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error('Failed to update configuration: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteConfig = async (config: any) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;
    
    try {
      const response = await fetch(`http://192.168.50.253:3005/Detergents/${config.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }
      
      setConfigurations(configurations.filter((c: any) => c.id !== config.id));
      toast.success('Configuration deleted successfully');
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast.error('Failed to delete configuration: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  


  const renderAction = (row: any) => {
    if (row.washing) {
      return (
        <>

        <div className="d-flex align-items-center">
          <button
            className="icon-btn washing"
            disabled
            aria-label="Washing"
            style={{ background: 'none', border: 'none', cursor: 'not-allowed', padding: 0, marginRight: 8 }}
          >
            <span title="Washing"><MdLocalLaundryService color="#0582ac" size={24} style={{ filter: 'drop-shadow(0 2px 4px #b3e0f7)' }} /></span>
          </button>
          <EditButton onClick={() => handleEditClick(row)} />
          <DeleteButton onClick={() => handleDeleteWashedItem(row)} />
        </div>
          
        </>
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
        {/* <Stepper
          steps={[{ label: 'Wash Item' }, { label: 'Material Configuration' }]}
          activeStep={activeStep}
          onStepClick={setActiveStep}
        /> */}
        <Breadcrumb 
        steps={[{ label: 'Wash Item' }, { label: 'Material Configuration' }]}
        activeStep={activeStep} onStepClick={setActiveStep}/>
        {activeStep === 0 && (
          <>
            <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '-10px', gap: 16 }}>
              <Searchbar value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Table columns={dynamicColumns} data={filteredData} renderAction={renderAction} />
            
          </>
        )}
        {activeStep === 1 && (
          <>
            {/* <div className="sub-header">Material Configurations</div> */}
            <div className="d-flex justify-content-between align-items-center mt-3" style={{ marginBottom: 16, gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <ButtonWithGradient text="Add Detergent & Machine" onClick={() => setShowModal(true)} />
              </div>
              <div style={{ flex: 1, maxWidth: 350 }}>
                <Searchbar value={configSearchTerm} onChange={e => setConfigSearchTerm(e.target.value)} />
              </div>
            </div>
            {/* <Table columns={configColumns} data={filteredConfigs} /> */}
            <Table columns={configColumns} data={filteredConfigs.map(config => ({
              ...config,
              action: (
                <>
                  <div className="d-flex">
                    <EditButton onClick={() => handleEditConfig(config)} />
                    <DeleteButton onClick={() => handleDeleteConfig(config)} />
                  </div>
                </>
              )
            }))} />
            
          </>
        )}
        {/* Section for adding detergents and machines */}
        <div style={{ marginTop: 40 }}>

          {/* <SectionHeading  title="Material Configurations" subtitle="Hospital Laundry Linen Management System" /> */}
          {/* <div className="sub-header">Material Configurations</div> */}


          {/* <div className="d-flex justify-content-between align-items-center mt-3" style={{ marginBottom: 16, gap: 16 }}> */}
            {/* <div style={{ textAlign: 'center' }}> */}
              {/* <ButtonWithGradient text="Add Detergent & Machine" onClick={() => setShowModal(true)} /> */}
            {/* </div> */}
           

            {/* <div style={{ flex: 1, maxWidth: 350 }}> */}
              {/* <Searchbar value={configSearchTerm} onChange={e => setConfigSearchTerm(e.target.value)} /> */}
            {/* </div> */}
            
          {/* </div> */}
          {/* <Table columns={configColumns} data={filteredConfigs} /> */}
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
            <label style={{fontSize:'14px'}}>Material Type</label>
            <input type="text" value={materialType} onChange={e => setMaterialType(e.target.value)} className="form-control" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{fontSize:'14px'}}>Detergent</label>
            <input type="text" value={detergent} onChange={e => setDetergent(e.target.value)} className="form-control" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{fontSize:'14px'}}>Machine</label>
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

        {/* Edit Modal */}
        <CustomModal
          show={showEditModal}
          onHide={() => {
            setShowEditModal(false);
            setEditItem(null);
          }}
          title="Edit Wash Item"
          footer={
            <>
              <CancelButton text="Cancel" onClick={() => {
                setShowEditModal(false);
                setEditItem(null);
              }} />
              <ButtonWithGradient text="Save" onClick={handleEditSave} />
            </>
          }
        >
          {editItem && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label>Detergent</label>
                <select
                  className="form-control"
                  value={editFields.detergent}
                  onChange={e => setEditFields({ ...editFields, detergent: e.target.value })}
                  required
                >
                  <option value="">Select Detergent</option>
                  {detergentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Machine</label>
                <select
                  className="form-control"
                  value={editFields.machine}
                  onChange={e => setEditFields({ ...editFields, machine: e.target.value })}
                  required
                >
                  <option value="">Select Machine</option>
                  {machineOptions.map((m) => (
                    <option
                      key={m}
                      value={m}
                      disabled={machinesInUse.includes(m) && editItem?.machine !== m}
                    >
                      {m} {machinesInUse.includes(m) && editItem?.machine !== m ? "(In Use)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Time Taken (minutes)</label>
                <input
                  className="form-control"
                  type="number"
                  value={editFields.timeTaken}
                  onChange={e => setEditFields({ ...editFields, timeTaken: e.target.value })}
                  min={1}
                />
              </div>
            </>
          )}
        </CustomModal>

        {/* Edit Configuration Modal */}
        <CustomModal
          show={showEditConfigModal}
          onHide={() => {
            setShowEditConfigModal(false);
            setEditConfig(null);
          }}
          title="Edit Configuration"
          footer={
            <>
              <CancelButton text="Cancel" onClick={() => {
                setShowEditConfigModal(false);
                setEditConfig(null);
              }} />
              <ButtonWithGradient text="Save" onClick={handleSaveEditConfig} />
            </>
          }
        >
          {editConfig && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{fontSize:'14px'}}>Material Type</label>
                <input
                  type="text"
                  value={editConfigFields.materialType}
                  onChange={e => setEditConfigFields({ ...editConfigFields, materialType: e.target.value })}
                  className="form-control"
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{fontSize:'14px'}}>Detergent</label>
                <input
                  type="text"
                  value={editConfigFields.detergent}
                  onChange={e => setEditConfigFields({ ...editConfigFields, detergent: e.target.value })}
                  className="form-control"
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{fontSize:'14px'}}>Machine</label>
                <input
                  type="text"
                  value={editConfigFields.machine}
                  onChange={e => setEditConfigFields({ ...editConfigFields, machine: e.target.value })}
                  className="form-control"
                />
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
