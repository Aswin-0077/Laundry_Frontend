import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretRight } from "@fortawesome/free-solid-svg-icons";
import sidebarLogo from "../assets/sidebar-logo.jpg";
import '../styles/sidebar.css'

interface SideBarProps {
  collapsed?: boolean;
}

const SideBar: React.FC<SideBarProps> = ({ collapsed = false }) => {
  const [menuSearch, setMenuSearch] = useState("");

  // Sidebar menu items
  const menuItems = [
    { to: "/linen", label: "Linen Management", title: "Linen Management" },
    { to: "/wash-items", label: "Wash Item", title: "Wash Item" },
    { to: "/outside-wash", label: "Outside Wash", title: "Outside Wash" },
    { to: "/dispose-items", label: "Dispose Item", title: "Dispose Item" },
    { to: "/vendorMap", label: "VendorMapping", title: "VendorMapping" },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(menuSearch.toLowerCase())
  );

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-content">
        <div className="sidebar-top">
          <a
            href=""
            className={`sidebar-profile ${collapsed ? "collapsed" : ""}`}
          >
            <img src={sidebarLogo} alt="" />
          </a>
          <div className="sidebar-text">
            <h6 className="sidebar-heading">System Admin</h6>
            <h4 className="sidebar-para">HODO Hospital,</h4>
            <p className="sidebar-para">Kazhakkottam</p>
            <p className="sidebar-para2">System Admin</p>
          </div>
        </div>
        <div className={`searchbar ${collapsed ? "collapsed" : ""}`}>
          <div className="sidebar-date">
            <h6 className="sidebar-date-heading">
              @Anchal {new Intl.DateTimeFormat('en-GB', {
                day:'2-digit',
                month:'2-digit',
                year:'numeric'
              }).format(new Date())}
            </h6>

          </div>
          <input
            type="text"
            className="searchbar"
            placeholder="Search Menu- Ctrl + M"
            value={menuSearch}
            onChange={e => setMenuSearch(e.target.value)}
          />
        </div>
      </div>
      <nav>
        <ul>
          <li className="sidebar-title">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "sidebar-heading2 active" : "sidebar-heading2"
              }
              title="Laundry Management"
            >
              Laundry Management
            </NavLink>
          </li>
          <ul className="sidebar-sublist">

            {/* <li>
              <NavLink
                to="/home"
                style={{fontWeight:400,color:"#cccccc"}}
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
                title={collapsed ? "Home" : ""}
              >
                <span>
                  <FontAwesomeIcon icon={faCaretRight} />
                </span>
                {!collapsed && "Home"}
              </NavLink>
            </li> */}
            
            {filteredMenuItems.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  style={{ fontWeight: 400, color: "#cccccc" }}
                  className={({ isActive }) =>
                    isActive ? "nav-item active" : "nav-item"
                  }
                  title={collapsed ? item.title : ""}
                >
                  <span>
                    <FontAwesomeIcon icon={faCaretRight} />
                  </span>
                  {!collapsed && item.label}
                </NavLink>
              </li>
            ))}
            





            
            {/* <li>
              <NavLink
                to="/claims" style={{fontWeight:400,color:"#cccccc"}}
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
                title={collapsed ? "Claims" : ""}
              >
                <span>
                  <FontAwesomeIcon icon={faCaretRight} />
                </span>
                {!collapsed && "Claims"}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/location" style={{fontWeight:400,color:"#cccccc"}}
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
                title={collapsed ? "Vehicle Location" : ""}
              >
                <span>
                  <FontAwesomeIcon icon={faCaretRight} />
                </span>
                {!collapsed && "Vehicle Location"}
              </NavLink>
            </li> */}
            


          </ul>
        </ul>
      </nav>
    </div>
  );
};

export default SideBar;
