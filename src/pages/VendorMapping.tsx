import React, { useEffect, useState } from "react";
// import Header from "../components/Header";
// import Footer from "../components/Footer";
import SectionHeading from "../components/SectionHeading";
import PageContainer from "../components/PageContainer";
import ButtonWithGradient from "../components/ButtonWithGradient";
import CustomModal from '../components/Modal';
import Table from '../components/Table';
import EditButton from '../components/EditButton';
import DeleteButton from '../components/DeleteButton';
import '../App.css'
import { toast } from "react-toastify";
import Searchbar from "../components/Searchbar";
import CancelButton from "../components/CancelButton";
import Breadcrumb from '../components/Breadcrumb';


interface VendorMapProps {
    sidebarCollapsed?: boolean;
    toggleSidebar?: () => void;
}

const VendorMapping: React.FC<VendorMapProps> = () => {
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState<string>('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [contactError, setContactError] = useState('');
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [vendors, setVendors] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [rate, setRate] = useState('');
  const [vendorError, setVendorError] = useState('');
  const [itemError, setItemError] = useState('');
  const [rateError, setRateError] = useState('');
  const [editVendor, setEditVendor] = useState<any>(null);
  const [editRate, setEditRate] = useState<any>(null);
  const [vendorSearch, setVendorSearch] = useState('');
  const [rateSearch, setRateSearch] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    fetch('http://192.168.50.253:3005/Vendors').then(res => res.json()).then(setVendors);
    fetch('http://192.168.50.253:3005/Wash-Item-Data').then(res => res.json()).then(setItems);
  }, []);

  // Edit Vendor
  const handleEditVendor = (vendor: any) => {
    setEditVendor(vendor);
    setVendorName(vendor.name);
    setVendorContact(vendor.contact);
    setVendorAddress(vendor.address);
    setShowVendorModal(true);
  };

  // Add Vendor
  const handleSaveVendor = async () => {
    // Validate all fields
    if (!vendorName.trim()) {
      setNameError('Please enter vendor name');
      return;
    }
    if (!vendorContact) {
      setContactError('Please enter vendor contact');
      return;
    }
    if (vendorContact.length !== 10) {
      setContactError('Please enter exactly 10 digits for contact');
      return;
    }
    if (!vendorAddress.trim()) {
      setAddressError('Please enter vendor address');
      return;
    }

    setNameError('');
    setContactError('');
    setAddressError('');

    if (editVendor) {
      // Update
      const updated = { ...editVendor, name: vendorName, contact: vendorContact, address: vendorAddress };
      await fetch(`http://192.168.50.253:3005/Vendors/${editVendor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setVendors(vendors.map(v => v.id === editVendor.id ? updated : v));
      setEditVendor(null);
      toast.info('Vendor updated successfully');
    } else {
      // Add
      const newVendor = {
        name: vendorName,
        contact: Number(vendorContact),
        address: vendorAddress,
        rates: [],
        id: Date.now()
      };
      await fetch('http://192.168.50.253:3005/Vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVendor)
      });
      setVendors([...vendors, newVendor]);
    }
    setShowVendorModal(false);
    setVendorName(''); setVendorContact(''); setVendorAddress('');
  };

  // Delete Vendor
  const handleDeleteVendor = async (vendor: any) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    await fetch(`http://192.168.50.253:3005/Vendors/${vendor.id}`, { method: 'DELETE' });
    setVendors(vendors.filter(v => v.id !== vendor.id));
    toast.error('Vendor deleted successfully');
  };

  // Save Rate (add or edit)
  const handleSaveRate = async () => {
    // Validate all fields
    if (!selectedVendorId) {
      setVendorError('Please select a vendor');
      return;
    }
    if (!selectedItemId) {
      setItemError('Please select an item');
      return;
    }
    if (!rate || isNaN(Number(rate))) {
      setRateError('Please enter a valid rate');
      return;
    }
    if (Number(rate) <= 0) {
      setRateError('Rate must be greater than 0');
      return;
    }

    setVendorError('');
    setItemError('');
    setRateError('');

    if (!selectedVendorId || !selectedItemId || !rate) return;
    const vendorIdx = vendors.findIndex(v => v.id === Number(selectedVendorId));
    if (vendorIdx === -1) return;
    const vendor = vendors[vendorIdx];
    const item = items.find(i => i.id === Number(selectedItemId));
    if (!item) return;
    // Edit logic: if editing, update the correct rate object (even if item changed)
    if (editRate) {
      // Remove the old rate object (by itemId)
      const oldItemId = editRate.rateObj.itemId;
      vendor.rates = vendor.rates.filter((r: any) => r.itemId !== Number(oldItemId));
      // Add the new/updated rate object
      vendor.rates.push({ itemId: item.id, itemName: item.category, rate });
      toast.success('Rate updated successfully');
    } else {
      // Add or update logic for new mapping
      const existingRateIdx = vendor.rates.findIndex((r: any) => r.itemId === item.id);
      if (existingRateIdx !== -1) {
        vendor.rates[existingRateIdx].rate = rate;
      } else {
        vendor.rates.push({ itemId: item.id, itemName: item.category, rate });
      }
    }
    await fetch(`http://192.168.50.253:3005/Vendors/${vendor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rates: vendor.rates })
    });
    const newVendors = [...vendors];
    newVendors[vendorIdx] = { ...vendor };
    setVendors(newVendors);
    setShowRateModal(false);
    setSelectedVendorId(''); setSelectedItemId(''); setRate('');
    setEditRate(null);
  };

  // Edit Rate
  const handleEditRate = (vendor: any, rateObj: any) => {
    setEditRate({ vendor, rateObj });
    setSelectedVendorId(vendor.id.toString());
    setSelectedItemId(rateObj.itemId.toString());
    setRate(rateObj.rate.toString());
    setShowRateModal(true);
  };

  // Delete Rate
  const handleDeleteRate = async (vendor: any, rateObj: any) => {
    if (!window.confirm('Are you sure you want to delete this rate mapping?')) return;
    const updatedRates = vendor.rates.filter((r: any) => r.itemId !== rateObj.itemId);
    await fetch(`http://192.168.50.253:3005/Vendors/${vendor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rates: updatedRates })
    });
    setVendors(vendors.map(v => v.id === vendor.id ? { ...v, rates: updatedRates } : v));
    toast.error('Rate mapping deleted successfully');
  };

  // Vendors Table
  const vendorColumns = [
    { key: 'name', header: 'Name' },
    { key: 'contact', header: 'Contact' },
    { key: 'address', header: 'Address' },
    { key: 'actions', header: 'Actions' }
  ];
  // Vendor-Item-Rate Table
  const rateColumns = [
    { key: 'vendor', header: 'Vendor' },
    { key: 'item', header: 'Item' },
    { key: 'rate', header: 'Rate(In Rs)' },
    { key: 'actions', header: 'Actions' }
  ];
  const filteredVendors = vendors.filter((v: any) =>
    Object.values(v)
      .join(' ')
      .toLowerCase()
      .includes(vendorSearch.toLowerCase())
  );
  const rateTableData = vendors.flatMap(vendor =>
    (vendor.rates || []).map((r: any) => ({
      vendor: vendor.name,
      item: r.itemName,
      rate: r.rate,
      rateObj: r,
      actions: { vendor, rateObj: r }
    }))
  );
  const filteredRates = rateTableData.filter((row: any) =>
    Object.values(row)
      .join(' ')
      .toLowerCase()
      .includes(rateSearch.toLowerCase())
  );

  return (
    <>
      {/* <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator /> */}
      <PageContainer>
        <SectionHeading title="Vendor Mapping" subtitle="Hospital Laundry Linen Management System" />
        <Breadcrumb
          steps={[{ label: 'Vendors' }, { label: 'Vendor-Item Rates' }]}
          activeStep={activeStep}
          onStepClick={setActiveStep}
        />
        {activeStep === 0 && (
          <>
            {/* <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}> */}
                <ButtonWithGradient text="Add Vendor" onClick={() => {
                  setEditVendor(null);
                  setVendorName('');
                  setVendorContact('');
                  setVendorAddress('');
                  setShowVendorModal(true);
                }} />
              
            {/* </div> */}
            {/* <div className="sub-header">Vendors</div> */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop:"25px" ,marginBottom:"-25px"}}>
              <div style={{ maxWidth: 350, width: '100%' }}>
                <Searchbar value={vendorSearch} onChange={e => setVendorSearch(e.target.value)} />
              </div>
            </div>
            <Table columns={vendorColumns} data={filteredVendors.map(vendor => ({
              ...vendor,
              actions: (
                <>
                  <div className="d-flex">
                    <EditButton onClick={() => handleEditVendor(vendor)} />
                    <DeleteButton onClick={() => handleDeleteVendor(vendor)} />
                  </div>
                </>
              )
            }))} />
          </>
        )}
        {activeStep === 1 && (
          <>
            {/* <div className="sub-header" style={{ marginTop: 32 }}>Vendor-Item Rates</div> */}
            <ButtonWithGradient text="Map Item Rate" onClick={() => {
                setEditRate(null);
                setSelectedVendorId('');
                setSelectedItemId('');
                setRate('');
                setShowRateModal(true);
              }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop:"25px" ,marginBottom:"-25px"}}>
              <div style={{ maxWidth: 350, width: '100%' }}>
                <Searchbar value={rateSearch} onChange={e => setRateSearch(e.target.value)} />
              </div>
            </div>
            <Table columns={rateColumns} data={filteredRates.map(row => ({
              ...row,
              actions: (
                <>
                  <div className="d-flex">
                    <EditButton onClick={() => handleEditRate(vendors.find(v => v.name === row.vendor), row.rateObj)} />
                    <DeleteButton onClick={() => handleDeleteRate(vendors.find(v => v.name === row.vendor), row.rateObj)} />
                  </div>
                </>
              )
            }))} />
          </>
        )}
        <CustomModal
          show={showVendorModal}
          onHide={() => {
            setShowVendorModal(false);
            setEditVendor(null);
            setVendorName('');
            setVendorContact('');
            setVendorAddress('');
          }}
          title={editVendor ? 'Edit Vendor' : 'Add Vendor'}
          footer={
            <>
              {/* <ButtonWithGradient text="Cancel" onClick={() => { setShowVendorModal(false); setEditVendor(null); }} /> */}
              <CancelButton text="Cancel" onClick={() => {
                setShowVendorModal(false);
                setEditVendor(null);
                setVendorName('');
                setVendorContact('');
                setVendorAddress('');
              }} />
              <ButtonWithGradient text="Save" onClick={handleSaveVendor} />
            </>
          }
        >
          <div style={{ marginBottom: 16 }}>
            <label style={{fontSize:'14px'}}>Name</label>
            <input 
              className={`form-control ${nameError ? 'is-invalid' : ''}`} 
              value={vendorName} 
              onChange={e => {
                setVendorName(e.target.value);
                if (e.target.value.trim()) {
                  setNameError('');
                }
              }}
            />
            {nameError && <div className="invalid-feedback">{nameError}</div>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{fontSize:'14px'}}>Contact</label>
            <input
              type="text"
              value={vendorContact}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow numbers
                const numericValue = value.replace(/\D/g, '');
                // Limit to 10 digits
                if (numericValue.length > 10) {
                  setContactError('Maximum 10 digits allowed');
                } else {
                  setVendorContact(numericValue);
                  if (numericValue.length === 0) {
                    setContactError('Please enter vendor contact');
                  } else if (numericValue.length !== 10) {
                    setContactError('Please enter exactly 10 digits');
                  } else {
                    setContactError('');
                  }
                }
              }}
              className={`form-control ${contactError ? 'is-invalid' : ''}`}
              placeholder="10-digit contact number"
              
            />
            {contactError && <div className="invalid-feedback">{contactError}</div>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{fontSize:'14px'}}>Address</label>
            <input 
              className={`form-control ${addressError ? 'is-invalid' : ''}`} 
              value={vendorAddress} 
              onChange={e => {
                setVendorAddress(e.target.value);
                if (e.target.value.trim()) {
                  setAddressError('');
                }
              }}
            />
            {addressError && <div className="invalid-feedback">{addressError}</div>}
          </div>
        </CustomModal>
        {/* Map Item Rate Modal */}
        <CustomModal
          show={showRateModal}
          onHide={() => {
            setShowRateModal(false);
            setEditRate(null);
            setSelectedVendorId('');
            setSelectedItemId('');
            setRate('');
          }}
          title={editRate ? 'Edit Item Rate' : 'Map Item Rate'}
          footer={
            <>
              {/* <ButtonWithGradient text="Cancel" onClick={() => { setShowRateModal(false); setEditRate(null); }} /> */}
              <CancelButton text="Cancel" onClick={() => {
                setShowRateModal(false);
                setEditRate(null);
                setSelectedVendorId('');
                setSelectedItemId('');
                setRate('');
              }} />
              <ButtonWithGradient text="Save" onClick={handleSaveRate} />
            </>
          }
        >
          <div style={{ marginBottom: 16 }}>
            <label style={{fontSize:'14px'}}>Vendor</label>
            <select 
              value={selectedVendorId} 
              onChange={e => {
                setSelectedVendorId(e.target.value);
                if (e.target.value) {
                  setVendorError('');
                }
              }} 
              className={`form-control ${vendorError ? 'is-invalid' : ''}`}
            >
              <option value="">Select Vendor</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
            {vendorError && <div className="invalid-feedback">{vendorError}</div>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{fontSize:'14px'}}>Item</label>
            <select 
              value={selectedItemId} 
              onChange={e => {
                setSelectedItemId(e.target.value);
                if (e.target.value) {
                  setItemError('');
                }
              }} 
              className={`form-control ${itemError ? 'is-invalid' : ''}`}
            >
              <option value="">Select Item</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.category}
                </option>
              ))}
            </select>
            {itemError && <div className="invalid-feedback">{itemError}</div>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{fontSize:'14px'}}>Rate</label>
            <input
              type="number"
              value={rate}
              onChange={e => {
                const value = e.target.value;
                if (value === '' || Number(value) > 0) {
                  setRate(value);
                  setRateError('');
                }
              }}
              className={`form-control ${rateError ? 'is-invalid' : ''}`}
              placeholder="Enter rate in Rs"
            />
            {rateError && <div className="invalid-feedback">{rateError}</div>}
          </div>
        </CustomModal>
      </PageContainer>
      {/* <Footer /> */}
    </>
  );
};

export default VendorMapping;
