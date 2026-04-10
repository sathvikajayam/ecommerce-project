import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import axios from "axios";
import * as publicCategoryService from "../../service/publicCategoryService";
import * as publicBrandService from "../../service/publicBrandService";
import "../styles/AdminEditProduct.css";

const AdminEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
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
      images: [], // Existing URLs
      videos: [], // Existing URLs
      newImages: [], // New File objects
      newVideos: [], // New File objects
    },
  ]);
  const [variantMediaPreviews, setVariantMediaPreviews] = useState([]); // Array of { newImages: [], newVideos: [] }

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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        });
        setProduct(response.data);
        if (response.data.variants && response.data.variants.length > 0) {
          setVariants(
            response.data.variants.map((v) => ({
              variantType: v.variantType || "",
              variantValue: v.variantValue || "",
              price: v.price ?? "",
              discount: v.discount ?? "",
              flatDiscount: v.flatDiscount ?? "0",
              discountValidityDays: v.discountValidityDays ?? "0",
              discountUserLimit: v.discountUserLimit ?? "0",
              images: v.images || [],
              videos: v.videos || [],
              newImages: [],
              newVideos: [],
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        alert("Failed to load product");
        navigate("/admin/products");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

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
        newImages: [],
        newVideos: [],
      },
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== index));
    setVariantMediaPreviews((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleMediaChange = (index, type, files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    const updatedVariants = [...variants];
    const field = type === "images" ? "newImages" : "newVideos";
    updatedVariants[index][field] = [...updatedVariants[index][field], ...fileList];
    setVariants(updatedVariants);

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVariantMediaPreviews((prev) => {
          const updated = [...prev];
          if (!updated[index]) updated[index] = { newImages: [], newVideos: [] };
          updated[index][field].push(reader.result);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingMedia = (variantIndex, type, mediaIndex) => {
    const updated = [...variants];
    updated[variantIndex][type].splice(mediaIndex, 1);
    setVariants(updated);
  };

  const removeNewMedia = (variantIndex, type, mediaIndex) => {
    const updated = [...variants];
    const field = type === "images" ? "newImages" : "newVideos";
    updated[variantIndex][field].splice(mediaIndex, 1);
    setVariants(updated);

    setVariantMediaPreviews((prev) => {
      const updated = [...prev];
      if (updated[variantIndex]) {
        updated[variantIndex][field].splice(mediaIndex, 1);
      }
      return updated;
    });
  };

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
        if (discount > 0) priceAfterDiscount = price * (100 - discount) / 100;
        priceAfterDiscount = Math.max(priceAfterDiscount - flatDiscount, 0).toFixed(2);

        v.newImages.forEach((file, imgIdx) => {
          formData.append(`variant_${idx}_image_${imgIdx}`, file);
        });
        v.newVideos.forEach((file, vidIdx) => {
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
          images: v.images,
          videos: v.videos,
        };
      });

      formData.append("variants", JSON.stringify(variantsData));

      await axios.put(`http://localhost:5000/api/admin/products/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Product updated successfully!");
      navigate("/admin/products");
    } catch (error) {
      console.error("Failed to update product:", error);
      alert("Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !product) return <div className="admin-edit-products"><p>Loading...</p></div>;

  return (
    <div className="admin-edit-products">
      <h1>Edit Product</h1>
      <Formik
        initialValues={{
          title: product.title || "",
          category: product.category || "",
          brand: product.brand || "",
          description: product.description || "",
        }}
        validationSchema={Yup.object({
          title: Yup.string().required("Required"),
          category: Yup.string().required("Required"),
        })}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form className="product-form">
            <div className="form-group">
              <label>Product Title *</label>
              <Field name="title" className={`form-control ${errors.title && touched.title ? "is-invalid" : ""}`} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <Field as="select" name="category" className="form-control">
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                </Field>
              </div>
              <div className="form-group">
                <label>Brand</label>
                <Field as="select" name="brand" className="form-control">
                  <option value="">Select Brand</option>
                  {brands.map((b) => <option key={b._id} value={b.name}>{b.name}</option>)}
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
                      <input placeholder="Type" value={variant.variantType} onChange={(e) => handleVariantChange(index, "variantType", e.target.value)} className="form-control" />
                    </div>
                    <div className="variant-field">
                      <label>Value</label>
                      <input placeholder="Value" value={variant.variantValue} onChange={(e) => handleVariantChange(index, "variantValue", e.target.value)} className="form-control" />
                    </div>
                    <div className="variant-field">
                      <label>Price</label>
                      <input type="number" placeholder="Price" value={variant.price} onChange={(e) => handleVariantChange(index, "price", e.target.value)} className="form-control" />
                    </div>
                    <div className="variant-field">
                      <label>Discount %</label>
                      <input type="number" placeholder="Discount %" value={variant.discount} onChange={(e) => handleVariantChange(index, "discount", e.target.value)} className="form-control" />
                    </div>
                    <div className="variant-field">
                      <label>Flat</label>
                      <input type="number" placeholder="Flat" value={variant.flatDiscount} onChange={(e) => handleVariantChange(index, "flatDiscount", e.target.value)} className="form-control" />
                    </div>
                    <div className="variant-field">
                      <label>Days</label>
                      <input type="number" placeholder="Days" value={variant.discountValidityDays} onChange={(e) => handleVariantChange(index, "discountValidityDays", e.target.value)} className="form-control" />
                    </div>
                    <div className="variant-field">
                      <label>Limit</label>
                      <input type="number" placeholder="Limit" value={variant.discountUserLimit} onChange={(e) => handleVariantChange(index, "discountUserLimit", e.target.value)} className="form-control" />
                    </div>
                    <div className="variant-field">
                      <label>Calculated</label>
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
                      <input type="file" multiple accept="image/*" onChange={(e) => handleMediaChange(index, "images", e.target.files)} className="media-input" id={`edit-imgs-${index}`} />
                      <label htmlFor={`edit-imgs-${index}`} className="media-label-btn">+ Add Images</label>

                      <div className="media-preview-container">
                        {variant.images.map((url, i) => (
                          <div key={`exist-img-${i}`} className="media-preview-item">
                            <img src={url} alt="exist" />
                            <button type="button" className="btn-remove-media" onClick={() => removeExistingMedia(index, "images", i)}>×</button>
                          </div>
                        ))}
                        {variantMediaPreviews[index]?.newImages?.map((src, i) => (
                          <div key={`new-img-${i}`} className="media-preview-item new-media">
                            <img src={src} alt="new" />
                            <button type="button" className="btn-remove-media" onClick={() => removeNewMedia(index, "images", i)}>×</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="media-group">
                      <label>Videos</label>
                      <input type="file" multiple accept="video/*" onChange={(e) => handleMediaChange(index, "videos", e.target.files)} className="media-input" id={`edit-vids-${index}`} />
                      <label htmlFor={`edit-vids-${index}`} className="media-label-btn">+ Add Videos</label>

                      <div className="media-preview-container">
                        {variant.videos.map((url, i) => (
                          <div key={`exist-vid-${i}`} className="media-preview-item">
                            <video 
                              src={url} 
                              muted 
                              onMouseEnter={(e) => e.target.play()} 
                              onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                            />
                            <div className="media-preview-play-icon"><i className="fa fa-play"></i></div>
                            <button type="button" className="btn-remove-media-small" onClick={() => removeExistingMedia(index, "videos", i)}>×</button>
                          </div>
                        ))}
                        {variantMediaPreviews[index]?.newVideos?.map((src, i) => (
                          <div key={`new-vid-${i}`} className="media-preview-item new-media">
                            <video 
                              src={src} 
                              muted 
                              onMouseEnter={(e) => e.target.play()} 
                              onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                            />
                            <div className="media-preview-play-icon"><i className="fa fa-play"></i></div>
                            <button type="button" className="btn-remove-media-small" onClick={() => removeNewMedia(index, "videos", i)}>×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {variants.length > 1 && <button type="button" className="btn-remove-variant" onClick={() => removeVariant(index)}>✕ Remove Variant</button>}
                </div>
              ))}
              <button type="button" className="btn-add-variant" onClick={addVariant}>+ Add Variant</button>
            </div>

            <div className="form-group">
              <label>Description</label>
              <Field as="textarea" name="description" className="form-control" rows="4" />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success" disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Update Product"}</button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate("/admin/products")}>Cancel</button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AdminEditProduct;
