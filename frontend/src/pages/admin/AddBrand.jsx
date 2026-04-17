import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import * as brandService from "../../service/brandService";
import "../styles/AdminBrands.css";

const AddBrand = () => {
  const navigate = useNavigate();
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const validationSchema = Yup.object({
    name: Yup.string().required("Brand name is required"),
    description: Yup.string(),
    website: Yup.string().url("Must be a valid URL"),
    status: Yup.string().oneOf(["active", "inactive"]),
    logo: Yup.string(),
  });

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

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      let submissionData;

      if (logoFile) {
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("description", values.description);
        formData.append("website", values.website);
        formData.append("status", values.status);
        formData.append("logo", logoFile);
        submissionData = formData;
      } else {
        submissionData = {
          name: values.name,
          description: values.description,
          website: values.website,
          status: values.status,
          logo: values.logo || null,
        };
      }

      await brandService.createBrand(submissionData);

      alert("Brand added successfully!");
      navigate("/admin/brands");
    } catch (error) {
      console.error("Failed to add brand:", error);
      alert(error.response?.data?.message || "Failed to add brand");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-add-brand">
      <h1>Add New Brand</h1>

      <Formik
        initialValues={{
          name: "",
          description: "",
          website: "",
          status: "active",
          logo: "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched, setFieldValue, values }) => (
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

            {/* Description */}
            <div className="form-group">
              <label>Description</label>
              <Field
                as="textarea"
                name="description"
                className="form-control"
                rows="3"
              />
            </div>

            {/* Website */}
            <div className="form-group">
              <label>Website (Optional)</label>
              <Field
                type="text"
                name="website"
                placeholder="https://example.com"
                className={`form-control ${
                  errors.website && touched.website ? "is-invalid" : ""
                }`}
              />
              <ErrorMessage name="website" component="div" className="error-message" />
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
                        onClick={handleRemoveLogo}
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
                style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Brand"}
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

export default AddBrand;
