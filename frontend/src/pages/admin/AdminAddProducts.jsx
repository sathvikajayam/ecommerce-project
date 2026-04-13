import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import * as publicCategoryService from "../../service/publicCategoryService";
import * as publicBrandService from "../../service/publicBrandService";
import "../styles/AdminAddProducts.css";

const AdminAddProducts = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [variants, setVariants] = useState([
    {
      variantType: "",
      variantValue: "",
      price: "",
      discount: "",
      flatDiscount: "0",
      discountValidityDays: "0",
      discountUserLimit: "0",
      images: [], // Array of File objects
      videos: [], // Array of File objects
    },
  ]);
  const [variantMediaPreviews, setVariantMediaPreviews] = useState([]); // Array of { images: [], videos: [] }

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        variantType: "",
        variantValue: "",
        price: "",
        discount: "",
        flatDiscount: "0",
        discountValidityDays: "0",
        discountUserLimit: "0",
        images: [],
        videos: [],
      },
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== index));
    const updatedPreviews = [...variantMediaPreviews];
    updatedPreviews.splice(index, 1);
    setVariantMediaPreviews(updatedPreviews);
  };

  const handleMediaChange = (index, type, files) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const updatedVariants = [...variants];
    updatedVariants[index][type] = [...updatedVariants[index][type], ...fileList];
    setVariants(updatedVariants);

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVariantMediaPreviews((prev) => {
          const updated = [...prev];
          if (!updated[index]) updated[index] = { images: [], videos: [] };
          if (type === "images") {
            updated[index].images.push(reader.result);
          } else {
            updated[index].videos.push(reader.result);
          }
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (variantIndex, type, mediaIndex) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex][type].splice(mediaIndex, 1);
    setVariants(updatedVariants);

    setVariantMediaPreviews((prev) => {
      const updated = [...prev];
      if (updated[variantIndex]) {
        updated[variantIndex][type].splice(mediaIndex, 1);
      }
      return updated;
    });
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const cats = await publicCategoryService.getAllCategories();
        setCategories(cats);
        const brs = await publicBrandService.getAllBrands();
        setBrands(brs);
      } catch (err) {
        console.error("Failed to load options", err);
      }
    };
    loadOptions();
  }, []);

  const validationSchema = Yup.object({
    title: Yup.string().required("Product title is required"),
    category: Yup.string().required("Category is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("category", values.category);
      formData.append("brand", values.brand);
      formData.append("description", values.description);

      const variantsData = variants.map((v, idx) => {
        const price = parseFloat(v.price) || 0;
        const discount = parseFloat(v.discount) || 0;
        const flatDiscount = parseFloat(v.flatDiscount) || 0;
        let priceAfterDiscount = price;
        if (discount > 0) {
          priceAfterDiscount = price * (100 - discount) / 100;
        }
        priceAfterDiscount = Math.max(priceAfterDiscount - flatDiscount, 0).toFixed(2);

        v.images.forEach((file, imgIdx) => {
          formData.append(`variant_${idx}_image_${imgIdx}`, file);
        });
        v.videos.forEach((file, vidIdx) => {
          formData.append(`variant_${idx}_video_${vidIdx}`, file);
        });

        return {
          variantType: v.variantType,
          variantValue: v.variantValue,
          price: v.price,
          discount: v.discount,
          flatDiscount: v.flatDiscount,
          discountValidityDays: v.discountValidityDays,
          discountUserLimit: v.discountUserLimit,
          priceAfterDiscount,
          images: [],
          videos: []
        };
      });

      formData.append("variants", JSON.stringify(variantsData));

      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/products`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Product added successfully!");
      navigate("/admin/products");
    } catch (error) {
      console.error("Failed to add product:", error);
      alert("Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-add-products">
      <h1>Add New Product</h1>

      <Formik
        initialValues={{ title: "", category: "", brand: "", description: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form className="product-form">
            <div className="form-group">
              <label>Product Title *</label>
              <Field name="title" className={`form-control ${errors.title && touched.title ? "is-invalid" : ""}`} />
              <ErrorMessage name="title" component="div" className="error-message" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <Field as="select" name="category" className={`form-control ${errors.category && touched.category ? "is-invalid" : ""}`}>
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c._id || c.name} value={c.name}>{c.name}</option>)}
                </Field>
                <ErrorMessage name="category" component="div" className="error-message" />
              </div>

              <div className="form-group">
                <label>Brand</label>
                <Field as="select" name="brand" className="form-control">
                  <option value="">Select Brand</option>
                  {brands.map((b) => <option key={b._id || b.name} value={b.name}>{b.name}</option>)}
                </Field>
              </div>
            </div>

            <div className="variants-section">
              <h3>Variants</h3>
              {variants.map((variant, index) => (
                <div key={index} className="variant-row">
                  <div className="variant-grid">
                    <div className="variant-field">
                      <label>Type</label>
                      <input type="text" placeholder="Size, Color" className="form-control" value={variant.variantType} onChange={(e) => handleVariantChange(index, "variantType", e.target.value)} />
                    </div>
                    <div className="variant-field">
                      <label>Value</label>
                      <input type="text" placeholder="XL, Red" className="form-control" value={variant.variantValue} onChange={(e) => handleVariantChange(index, "variantValue", e.target.value)} />
                    </div>
                    <div className="variant-field">
                      <label>Price</label>
                      <input type="number" className="form-control" value={variant.price} onChange={(e) => handleVariantChange(index, "price", e.target.value)} />
                    </div>
                    <div className="variant-field">
                      <label>Discount %</label>
                      <input type="number" className="form-control" value={variant.discount} onChange={(e) => handleVariantChange(index, "discount", e.target.value)} />
                    </div>
                    <div className="variant-field">
                      <label>Flat Discount</label>
                      <input type="number" className="form-control" value={variant.flatDiscount} onChange={(e) => handleVariantChange(index, "flatDiscount", e.target.value)} />
                    </div>
                    <div className="variant-field">
                      <label>Validity (Days)</label>
                      <input type="number" className="form-control" value={variant.discountValidityDays} onChange={(e) => handleVariantChange(index, "discountValidityDays", e.target.value)} />
                    </div>
                    <div className="variant-field">
                      <label>User Limit</label>
                      <input type="number" className="form-control" value={variant.discountUserLimit} onChange={(e) => handleVariantChange(index, "discountUserLimit", e.target.value)} />
                    </div>
                    <div className="variant-field">
                      <label>Calculated Price</label>
                      <div className="calculated-price">
                        ₹{(() => {
                          const p = parseFloat(variant.price) || 0;
                          const d = parseFloat(variant.discount) || 0;
                          const f = parseFloat(variant.flatDiscount) || 0;
                          let res = p;
                          if (d > 0) res = p * (100 - d) / 100;
                          return Math.max(res - f, 0).toFixed(2);
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="media-upload-section">
                    <div className="media-group">
                      <label>Images</label>
                      <input type="file" multiple accept="image/*" onChange={(e) => handleMediaChange(index, "images", e.target.files)} className="media-input" id={`imgs-${index}`} />
                      <label htmlFor={`imgs-${index}`} className="media-label-btn">+ Add Images</label>
                      <div className="media-preview-container">
                        {variantMediaPreviews[index]?.images?.map((src, i) => (
                          <div key={i} className="media-preview-item">
                            <img src={src} alt="preview" />
                            <button type="button" onClick={() => removeMedia(index, "images", i)}>×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="media-group">
                      <label>Videos</label>
                      <input type="file" multiple accept="video/*" onChange={(e) => handleMediaChange(index, "videos", e.target.files)} className="media-input" id={`vids-${index}`} />
                      <label htmlFor={`vids-${index}`} className="media-label-btn">+ Add Videos</label>
                      <div className="media-preview-container">
                        {variantMediaPreviews[index]?.videos?.map((src, i) => (
                          <div key={i} className="media-preview-item">
                            <video 
                              src={src} 
                              muted 
                              onMouseEnter={(e) => e.target.play()} 
                              onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                            />
                            <div className="media-preview-play-icon"><i className="fa fa-play"></i></div>
                            <button type="button" className="btn-remove-media-small" onClick={() => removeMedia(index, "videos", i)}>×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {variants.length > 1 && <button type="button" className="btn-remove-variant" onClick={() => removeVariant(index)}>✕ Remove Variant</button>}
                </div>
              ))}
              <button type="button" className="btn-add-variant" onClick={addVariant}>+ Add Another Variant</button>
            </div>

            <div className="form-group">
              <label>Description</label>
              <Field as="textarea" name="description" className="form-control" rows="4" />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success" disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add Product"}</button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate("/admin/products")}>Cancel</button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AdminAddProducts;
