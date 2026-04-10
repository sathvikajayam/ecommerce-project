import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import * as brandService from "../../service/brandService";
import "../styles/AdminBrands.css";

const EditBrand = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [brand, setBrand] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  const validationSchema = Yup.object({
    name: Yup.string().required("Brand name is required"),
    status: Yup.string().oneOf(["active", "inactive"]),
    logo: Yup.string(),
  });

  useEffect(() => {
  const fetchBrand = async () => {
    try {
      const response = await brandService.getBrandById(id);
      setBrand(response);
      setLogoPreview(response.logo || null);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch brand:", error);
      setLoading(false);
    }
  };

  fetchBrand();
}, [id]);

  const handleFileChange = (e, setFieldValue) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setFieldValue("logo", "");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = (setFieldValue) => {
    setLogoFile(null);
    setLogoPreview(null);
    setFieldValue("logo", "");
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      let submissionData;

      if (logoFile) {
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("status", values.status);
        formData.append("logo", logoFile);
        submissionData = formData;
      } else {
        submissionData = {
          name: values.name,
          status: values.status,
          logo: values.logo || logoPreview || null,
        };
      }

      await brandService.updateBrand(id, submissionData);

      alert("Brand updated successfully!");
      navigate("/admin/brands");
    } catch (error) {
      console.error("Failed to update brand:", error);
      alert(error.response?.data?.message || "Failed to update brand");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-edit-brand">
        <p>Loading brand...</p>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="admin-edit-brand">
        <p>Brand not found</p>
      </div>
    );
  }

  return (
    <div className="admin-edit-brand">
      <h1>Edit Brand</h1>

      <Formik
        initialValues={{
          name: brand.name || "",
          status: brand.status || "active",
          logo: brand.logo || "",
        }}
        enableReinitialize
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched, setFieldValue }) => (
          <Form className="brand-form">

            {/* Brand Name */}
            <div className="form-group">
              <label>Brand Name *</label>
              <Field
                type="text"
                name="name"
                className={`form-control ${
                  errors.name && touched.name ? "is-invalid" : ""
                }`}
              />
              <ErrorMessage name="name" component="div" className="error-message" />
            </div>

            {/* Status */}
            <div className="form-group">
              <label>Status</label>
              <Field as="select" name="status" className="form-control">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Field>
            </div>

            {/* Logo Section */}
            <div className="form-group">
              <label>Brand Logo</label>

              <div className="image-input-container">

                {/* Upload Option */}
                <div className="image-input-section">
                  <h4>Upload Brand Logo</h4>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setFieldValue)}
                    className="file-input"
                    id="logo-upload"
                  />

                  <label htmlFor="logo-upload" className="file-input-label">
                    Choose Logo
                  </label>

                  {logoFile && (
                    <div className="file-info">
                      <p>Selected: {logoFile.name}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveLogo(setFieldValue)}
                        className="btn-remove-image"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Preview */}
                {logoPreview && (
                  <div className="image-preview">
                    <p>Preview:</p>
                    <img src={logoPreview} alt="Preview" />
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-success"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Brand"}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/admin/brands")}
              >
                Cancel
              </button>
            </div>

          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EditBrand;