import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import * as categoryService from "../../service/categoryService";
import "../styles/AdminCategories.css";



const AddCategory = () => {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubCategory, setIsSubCategory] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const validationSchema = Yup.object({
    name: Yup.string().required(isSubCategory ? "Sub-Category name is required" : "Category name is required"),
    description: Yup.string(),
    status: Yup.string().oneOf(["active", "inactive"]),
    image: Yup.string(),
    parentCategory: isSubCategory ? Yup.string().required("Parent Category name is required") : Yup.string(),
  });

  useEffect(() => {
    const fetchCategoryOptions = async () => {
      try {
        const response = await categoryService.getAllCategories();
        setCategoryOptions(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Failed to fetch categories for dropdown:", error);
        setCategoryOptions([]);
      }
    };

    fetchCategoryOptions();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      let submissionData;

      if (imageFile) {
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("description", values.description);
        formData.append("status", values.status);
        formData.append("image", imageFile);
        if (isSubCategory) {
          formData.append("parentCategory", values.parentCategory);
          formData.append("isSubCategory", true);
        }

        submissionData = formData;
      } else {
        submissionData = {
          name: values.name,
          description: values.description,
          status: values.status,
          image: values.image,
        };
        if (isSubCategory) {
          submissionData.parentCategory = values.parentCategory;
          submissionData.isSubCategory = true;
        }
      }

      await categoryService.createCategory(submissionData);

      alert("Category added successfully!");
      navigate("/admin/categories");
    } catch (error) {
      console.error("Failed to add category:", error);
      alert(error.response?.data?.message || "Failed to add category");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-add-category">
      <h1>Add New Category</h1>

      <Formik
        initialValues={{
          name: "",
          description: "",
          status: "active",
          image: "",
          parentCategory: "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched, values, setFieldValue }) => (
          <Form className="category-form">

            {/* Category Name */}
            <div className="form-group">
              <label>{isSubCategory ? "Category Name *" : "Category Name *"}</label>
              <Field
                type="text"
                name="name"
                className={`form-control ${errors.name && touched.name ? "is-invalid" : ""
                  }`}
                placeholder={isSubCategory ? "Enter category name" : "Enter category name"}
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

            {/* Image Section */}
            <div className="form-group">
              <label>Category Image</label>

              <div className="image-input-container">

                {/* Upload Section */}
                <div className="image-input-section">
                  <h4>Upload Category Image</h4>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input"
                    id="category-file-upload"
                  />

                  <label htmlFor="category-file-upload" className="file-input-label">
                    Choose Image
                  </label>

                  {imageFile && (
                    <div className="file-info">
                      <p>Selected: {imageFile.name}</p>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="btn-remove-image"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {imagePreview && (
                  <div className="image-preview">
                    <p>Preview:</p>
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>
            </div>

            {/* Sub-Category Option */}
            <div className="form-group sub-category-radio">
              <label className="radio-label">
                <input
                  type="radio"
                  name="isSubCategory"
                  value="yes"
                  checked={isSubCategory}
                  onChange={() => setIsSubCategory(true)}
                  className="radio-input"
                />
                <span className="radio-text">This is a Sub-Category</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="isSubCategory"
                  value="no"
                  checked={!isSubCategory}
                  onChange={() => {
                    setIsSubCategory(false);
                    setFieldValue("parentCategory", "");
                  }}
                  className="radio-input"
                />
                <span className="radio-text">This is a Main Category</span>
              </label>
            </div>

            {/* Main Category Name (shown when sub-category is selected) */}
            {isSubCategory && (
              <div className="form-group">
                <label>Main Category Name *</label>
                <Field
                  as="select"
                  name="parentCategory"
                  className={`form-control ${errors.parentCategory && touched.parentCategory ? "is-invalid" : ""
                    }`}
                >
                  <option value="">Select main category</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="parentCategory" component="div" className="error-message" />
              </div>
            )}

            {/* Status */}
            <div className="form-group">
              <label>Status</label>
              <Field as="select" name="status" className="form-control">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Field>
            </div>

            {/* Buttons */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-success"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Category"}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/admin/categories")}
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

export default AddCategory;
