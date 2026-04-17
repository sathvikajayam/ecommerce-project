import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getStoredAdminUser, hasAdminPermission } from "../../utils/adminPermissions";

const AdminNavbar = () => {
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const adminUser = getStoredAdminUser();
  const canViewNavbar =
    hasAdminPermission("navbar", "view", adminUser) ||
    hasAdminPermission("navbar", "edit", adminUser);
  const canEditNavbar = hasAdminPermission("navbar", "edit", adminUser);

  const previewUrl = useMemo(() => {
    if (!selectedLogo) return "";
    return URL.createObjectURL(selectedLogo);
  }, [selectedLogo]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get("/api/settings/navbar");
        setCurrentLogoUrl(data?.navbarLogoUrl || "");
      } catch (error) {
        console.error("Failed to load navbar settings:", error);
      }
    };

    load();
  }, []);

  const handleLogoChange = (event) => {
    if (!canEditNavbar) return;
    const file = event.target.files?.[0] || null;
    setSelectedLogo(file);
  };

  const handleSaveLogo = async (event) => {
    event.preventDefault();
    if (!canEditNavbar) {
      alert("You don't have permission to edit the navbar.");
      return;
    }
    if (!selectedLogo) {
      alert("Please choose a logo image first.");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedLogo);

      const { data } = await axios.put("/api/settings/navbar/logo", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      setCurrentLogoUrl(data?.navbarLogoUrl || "");
      setSelectedLogo(null);
      alert("Navbar logo updated successfully.");
    } catch (error) {
      console.error("Failed to update navbar logo:", error);
      alert("Failed to update navbar logo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container-fluid py-3">
      <h1 className="h4 mb-2">Logo</h1>

      {!canViewNavbar ? (
        <p className="text-muted">You don't have permission to view navbar settings.</p>
      ) : null}

      <div className="card mt-3">
        <div className="card-body">
          <h2 className="h6 mb-3">Navbar and Footer Logo</h2>

          <div className="row g-3 align-items-start">
            <div className="col-12 col-md-6">
              <label className="form-label">Upload logo</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={!canEditNavbar}
              />
              <div className="form-text">Supported: JPG, PNG, WEBP, GIF</div>

              <button
                className="btn btn-primary mt-3"
                style={{ backgroundColor: "#2563eb", borderColor: "#2563eb", color: "white" }}
                onClick={handleSaveLogo}
                disabled={isSaving || !selectedLogo || !canEditNavbar}
              >
                {isSaving ? "Saving..." : "Save Logo"}
              </button>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Preview</label>
              <div className="border rounded p-3 bg-light">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Selected navbar logo preview"
                    style={{ maxWidth: "220px", maxHeight: "80px", objectFit: "contain" }}
                  />
                ) : currentLogoUrl ? (
                  <img
                    src={currentLogoUrl}
                    alt="Current navbar logo"
                    style={{ maxWidth: "220px", maxHeight: "80px", objectFit: "contain" }}
                  />
                ) : (
                  <div className="text-muted">No logo uploaded yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;
