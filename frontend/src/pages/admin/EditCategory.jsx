
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import * as categoryService from "../../service/categoryService";
import "../styles/AdminCategories.css";



const EditCategory = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubCategory, setIsSubCategory] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required(isSubCategory ? "Sub-Category name is required" : "Category name is required"),
    description: Yup.string(),
    status: Yup.string().oneOf(["active", "inactive"]),
    image: Yup.string(),
    parentCategory: isSubCategory ? Yup.string().required("Parent Category name is required") : Yup.string(),
  });

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const [categoryResponse, categoriesResponse] = await Promise.all([
          categoryService.getCategoryById(id),
          categoryService.getAllCategories(),
        ]);

        setCategory(categoryResponse);
        setImagePreview(categoryResponse.image || null);
        setCategoryOptions(
          (Array.isArray(categoriesResponse) ? categoriesResponse : []).filter(
            (cat) => cat._id !== id
          )
        );

        // Check if it's a sub-category
        if (categoryResponse.parentCategory || categoryResponse.isSubCategory) {
          setIsSubCategory(true);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch category:", error);
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [id]);

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

      await categoryService.updateCategory(id, submissionData);

      alert("Category updated successfully!");
      navigate("/admin/categories");
    } catch (error) {
      console.error("Failed to update category:", error);
      alert("Failed to update category");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-edit-category">
        <p>Loading category...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="admin-edit-category">
        <p>Category not found</p>
      </div>
    );
  }

  return (
    <div className="admin-edit-category">
      <h1>Edit Category</h1>

      <Formik
        enableReinitialize
        initialValues={{
          name: category.name || "",
          description: category.description || "",
          status: category.status || "active",
          image: category.image || "",
          parentCategory: category.parentCategory || "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched, values, setFieldValue }) => (
          <Form className="category-form">

            {/* Category Name */}
            <div className="form-group">
              <label>Category Name *</label>
              <Field
                type="text"
                name="name"
                className={`form-control ${errors.name && touched.name ? "is-invalid" : ""
                  }`}
                placeholder="Enter category name"
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

                {/* Upload */}
                <div className="image-input-section">
                  <h4>Upload Category Image</h4>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input"
                    id="edit-category-file-upload"
                  />

                  <label htmlFor="edit-category-file-upload" className="file-input-label">
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
                {isSubmitting ? "Updating..." : "Update Category"}
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

export default EditCategory;
