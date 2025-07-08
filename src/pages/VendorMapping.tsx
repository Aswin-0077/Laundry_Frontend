import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
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

interface VendorMapProps {
    sidebarCollapsed?: boolean;
    toggleSidebar?: () => void;
}

const VendorMapping: React.FC<VendorMapProps> = ({ sidebarCollapsed = false, toggleSidebar }) => {
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendors, setVendors] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [rate, setRate] = useState('');
  const [editVendor, setEditVendor] = useState<any>(null);
  const [editRate, setEditRate] = useState<any>(null);
  const [vendorSearch, setVendorSearch] = useState('');
  const [rateSearch, setRateSearch] = useState('');

  useEffect(() => {
    fetch('http://192.168.50.253:3001/Vendors').then(res => res.json()).then(setVendors);
    fetch('http://192.168.50.253:3001/Wash-Item-Data').then(res => res.json()).then(setItems);
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
    if (editVendor) {
      // Update
      const updated = { ...editVendor, name: vendorName, contact: vendorContact, address: vendorAddress };
      await fetch(`http://192.168.50.253:3001/Vendors/${editVendor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setVendors(vendors.map(v => v.id === editVendor.id ? updated : v));
      setEditVendor(null);
      toast.success('Vendor updated successfully');
    } else {
      // Add
      const newVendor = {
        name: vendorName,
        contact: vendorContact,
        address: vendorAddress,
        rates: [],
        id: Date.now()
      };
      await fetch('http://192.168.50.253:3001/Vendors', {
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
    await fetch(`http://192.168.50.253:3001/Vendors/${vendor.id}`, { method: 'DELETE' });
    setVendors(vendors.filter(v => v.id !== vendor.id));
    toast.error('Vendor deleted successfully');
  };

  // Save Rate (add or edit)
  const handleSaveRate = async () => {
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
    await fetch(`http://192.168.50.253:3001/Vendors/${vendor.id}`, {
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
    await fetch(`http://192.168.50.253:3001/Vendors/${vendor.id}`, {
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
    { key: 'rate', header: 'Rate' },
    { key: 'actions', header: 'Actions' }
  ];
  const filteredVendors = vendors.filter((v: any) =>
    Object.values(v)
      .join(' ')
      .toLowerCase()
      .includes(vendorSearch.toLowerCase())
  );
  const rateTableData = vendors.flatMap(vendor =>
    vendor.rates.map((r: any) => ({
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
      <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator />
      <PageContainer>
        <SectionHeading title="Vendor Mapping" subtitle="Hospital Laundry Linen Management System" />
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <ButtonWithGradient text="Add Vendor" onClick={() => setShowVendorModal(true)} />
          <ButtonWithGradient text="Map Item Rate" onClick={() => setShowRateModal(true)} />
        </div>
        <div className="sub-header">Vendors</div>
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
        <div className="sub-header" style={{ marginTop: 32 }}>Vendor-Item Rates</div>
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
        <CustomModal
          show={showVendorModal}
          onHide={() => { setShowVendorModal(false); setEditVendor(null); }}
          title={editVendor ? 'Edit Vendor' : 'Add Vendor'}
          footer={
            <>
              <ButtonWithGradient text="Cancel" onClick={() => { setShowVendorModal(false); setEditVendor(null); }} />
              <ButtonWithGradient text="Save" onClick={handleSaveVendor} />
            </>
          }
        >
          <div style={{ marginBottom: 16 }}>
            <label>Name</label>
            <input className="form-control" value={vendorName} onChange={e => setVendorName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Contact</label>
            <input className="form-control" value={vendorContact} onChange={e => setVendorContact(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Address</label>
            <input className="form-control" value={vendorAddress} onChange={e => setVendorAddress(e.target.value)} />
          </div>
        </CustomModal>
        {/* Map Item Rate Modal */}
        <CustomModal
          show={showRateModal}
          onHide={() => { setShowRateModal(false); setEditRate(null); }}
          title={editRate ? 'Edit Item Rate' : 'Map Item Rate'}
          footer={
            <>
              <ButtonWithGradient text="Cancel" onClick={() => { setShowRateModal(false); setEditRate(null); }} />
              <ButtonWithGradient text="Save" onClick={handleSaveRate} />
            </>
          }
        >
          <div style={{ marginBottom: 16 }}>
            <label>Vendor</label>
            <select className="form-control" value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)} disabled={!!editRate}>
              <option value="">Select Vendor</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Item</label>
            <select className="form-control" value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} disabled={false}>
              <option value="">Select Item</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.category}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Rate</label>
            <input className="form-control" type="number" min={0} value={rate} onChange={e => setRate(e.target.value)} />
          </div>
        </CustomModal>
      </PageContainer>
      <Footer />
    </>
  );
};

export default VendorMapping;
